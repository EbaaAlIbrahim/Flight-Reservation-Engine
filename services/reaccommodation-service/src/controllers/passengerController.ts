import { Request, Response } from 'express';
import pool from '../config/db';
import redis from '../config/redis';

// Get disruption status and available alternatives for a passenger
export const getPassengerDisruptionDetails = async (req: Request, res: Response): Promise<void> => {
  const { passengerId } = req.params;

  try {
    // 1. Fetch passenger info and check if they have a DISRUPTED booking
    const passengerQuery = await pool.query(`
      SELECT p.passenger_id, p.first_name, p.last_name, p.loyalty_tier,
             b.booking_id, b.status as booking_status,
             f.flight_number as original_flight, f.origin, f.destination
      FROM passengers p
      JOIN bookings b ON p.passenger_id = b.passenger_id
      JOIN flights f ON b.flight_id = f.flight_id
      WHERE p.passenger_id = $1;
    `, [passengerId]);

    if (passengerQuery.rows.length === 0) {
      res.status(404).json({ error: 'Passenger or booking record not found.' });
      return;
    }

    const passengerData = passengerQuery.rows[0];

    // 2. Fetch potential alternative flights traveling to the same destination
    const alternativesQuery = await pool.query(`
      SELECT flight_id, flight_number, origin, destination, departure_time, arrival_time
      FROM flights
      WHERE origin = $1 AND destination = $2 AND flight_number != $3;
    `, [passengerData.origin, passengerData.destination, passengerData.original_flight]);

    // 3. Enrich the alternative flights with real-time seat counts from Memurai
    const alternativeFlightsWithCache = [];
    for (const flight of alternativesQuery.rows) {
      const cachedSeats = await redis.hget('flight:seats', flight.flight_number);
      
      alternativeFlightsWithCache.push({
        flight_id: flight.flight_id,
        flight_number: flight.flight_number,
        origin: flight.origin,
        destination: flight.destination,
        departure_time: flight.departure_time,
        arrival_time: flight.arrival_time,
        available_seats: cachedSeats ? parseInt(cachedSeats) : 0
      });
    }

    // 4. Send combined response optimized for mobile consumption
    res.json({
      passenger: {
        id: passengerData.passenger_id,
        name: `${passengerData.first_name} ${passengerData.last_name}`,
        tier: passengerData.loyalty_tier
      },
      disruption_alert: {
        booking_id: passengerData.booking_id,
        original_flight: passengerData.original_flight,
        status: passengerData.booking_status,
        message: passengerData.booking_status === 'DISRUPTED' 
          ? `Flight ${passengerData.original_flight} has been cancelled due to severe weather. Please select an alternative option below.`
          : 'Your flight status is operational.'
      },
      alternative_options: alternativeFlightsWithCache
    });

  } catch (error) {
    console.error(' Error fetching passenger disruption endpoints data:', error);
    res.status(500).json({ error: 'Internal server error processing re-accommodation options.' });
  }
};
// Process a passenger's manual alternative flight selection
export const selectAlternativeFlight = async (req: Request, res: Response): Promise<void> => {
  const { passengerId } = req.params;
  const { flightId, flightNumber } = req.body;

  if (!flightId || !flightNumber) {
    res.status(400).json({ error: 'Missing required parameters: flightId and flightNumber.' });
    return;
  }

  try {
    // 1. Check real-time seat availability in Memurai cache before hitting the database
    const cachedSeats = await redis.hget('flight:seats', flightNumber);
    const availableSeats = cachedSeats ? parseInt(cachedSeats) : 0;

    if (availableSeats <= 0) {
      res.status(409).json({ error: `Flight ${flightNumber} is fully booked. Please select another option.` });
      return;
    }

    // 2. Begin database transaction block to ensure atomic operations
    await pool.query('BEGIN');

    // 3. Verify the booking status and lock the rows for update
    const bookingCheck = await pool.query(`
      SELECT booking_id FROM bookings 
      WHERE passenger_id = $1 AND status = 'DISRUPTED' 
      FOR UPDATE;
    `, [passengerId]);

    if (bookingCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      res.status(404).json({ error: 'No disrupted booking found for this passenger.' });
      return;
    }

    const bookingId = bookingCheck.rows[0].booking_id;

    // 4. Double-check actual DB seats to prevent race conditions
    const dbFlightCheck = await pool.query(`
      SELECT available_seats FROM flights WHERE flight_id = $1 FOR UPDATE;
    `, [flightId]);

    if (dbFlightCheck.rows[0].available_seats <= 0) {
      await pool.query('ROLLBACK');
      // Sync cache back to 0 since DB says it's full
      await redis.hset('flight:seats', flightNumber, 0);
      res.status(409).json({ error: `Flight ${flightNumber} is fully booked.` });
      return;
    }

    // 5. Decrement seat count in PostgreSQL
    await pool.query(`
      UPDATE flights SET available_seats = available_seats - 1 WHERE flight_id = $1;
    `, [flightId]);

    // 6. Re-route the passenger's booking status
    await pool.query(`
      UPDATE bookings 
      SET flight_id = $1, status = 'RE_ROUTED', updated_at = CURRENT_TIMESTAMP 
      WHERE booking_id = $2;
    `, [flightId, bookingId]);

    // 7. Commit PostgreSQL transaction safely
    await pool.query('COMMIT');

    // 8. Decrement real-time cache count in Memurai
    const newCacheCount = await redis.hincrby('flight:seats', flightNumber, -1);

    res.json({
      success: true,
      message: `Successfully re-booked onto flight ${flightNumber}!`,
      updated_remaining_seats: newCacheCount
    });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(' Alternative re-routing selection failed:', error);
    res.status(500).json({ error: 'Internal system failure completing re-booking transaction.' });
  }
};

// GET /api/passengers/:passengerId/bookings
export const getRealPassengerBookings = async (req: Request, res: Response): Promise<void> => {
  const passengerId = String(req.params.passengerId);
  try {
    const result = await pool.query(`
      SELECT b.booking_id, b.seat_number, b.status, f.flight_number, f.origin, f.destination
      FROM bookings b
      JOIN flights f ON b.flight_id = f.flight_id
      WHERE b.passenger_id = $1;
    `, [passengerId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve passenger trips.' });
  }
};

export const cancelRealPassengerBooking = async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.params;

  try {
    // 1. Fetch the booking context parameters before deleting it
    const bookingQuery = await pool.query(`
      SELECT flight_id, seat_number FROM bookings WHERE booking_id = $1;
    `, [bookingId]);

    if (bookingQuery.rows.length === 0) {
      res.status(404).json({ error: 'Itinerary booking record profile not found.' });
      return;
    }

    const { flight_id, seat_number } = bookingQuery.rows[0];

    // 2. Start an atomic SQL transaction block to release inventories
    await pool.query('BEGIN');

    // 3. Delete the booking row log record cleanly
    await pool.query('DELETE FROM bookings WHERE booking_id = $1;', [bookingId]);

    // 4. CRITICAL FIX: Unlock the physical aircraft seat configuration cell!
    await pool.query(`
      UPDATE seats SET is_booked = FALSE WHERE flight_id = $1 AND seat_number = $2;
    `, [flight_id, seat_number]);

    // 5. Restore flight seat capacity counter increments in PostgreSQL
    await pool.query(`
      UPDATE flights SET available_seats = available_seats + 1 WHERE flight_id = $1;
    `, [flight_id]);

    await pool.query('COMMIT');

    // 6. Restore memory parameters back inside Memurai/Redis high-speed cache
    const flightNumberQuery = await pool.query('SELECT flight_number FROM flights WHERE flight_id = $1', [flight_id]);
    if (flightNumberQuery.rows.length > 0) {
      await redis.hincrby('flight:seats', flightNumberQuery.rows[0].flight_number, 1);
    }

    res.json({ success: true, message: 'Reservation cancelled successfully. Seat inventories released.' });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Failed to release cancelled seat parameters:', error);
    res.status(500).json({ error: 'Internal system cancellation processing error.' });
  }
};

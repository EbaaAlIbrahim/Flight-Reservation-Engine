import { Request, Response } from 'express';
import pool from '../config/db';
import redis from '../config/redis';

// POST /api/passengers/:passengerId/book OR POST /api/flights/book
export const createPassengerFlightBooking = async (req: Request, res: Response): Promise<void> => {
  const passengerId = req.body.passengerId || req.body.passenger_id || req.params.passengerId;
  const { flightId, seatNumber } = req.body;

  if (!passengerId || !flightId || !seatNumber) {
    res.status(400).json({ error: 'Missing required parameters: passengerId, flightId, or seatNumber.' });
    return;
  }

  try {
    // 1. Begin SQL Transaction block to lock rows and avoid concurrent race conditions
    await pool.query('BEGIN');

    // 2. Check if the specific seat coordinate is already taken
    const seatCheck = await pool.query(`
      SELECT seat_id, is_booked FROM seats 
      WHERE flight_id = $1 AND seat_number = $2 FOR UPDATE;
    `, [flightId, seatNumber]);

    if (seatCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      res.status(404).json({ error: 'Selected seat coordinate location does not exist on this aircraft type.' });
      return;
    }

    // 🟢 FIXED: Extract index 0 to correctly evaluate object parameter flags
    if (seatCheck.rows[0].is_booked) {
      await pool.query('ROLLBACK');
      res.status(409).json({ error: `Seat ${seatNumber} has already been reserved by another flyer.` });
      return;
    }

    // 3. Mark the seat layout coordinate row as taken
    await pool.query(`
      UPDATE seats SET is_booked = TRUE WHERE flight_id = $1 AND seat_number = $2;
    `, [flightId, seatNumber]);

    // 4. Create the global ticket log in the bookings grid table
    const bookingResult = await pool.query(`
      INSERT INTO bookings (passenger_id, flight_id, seat_number, status)
      VALUES ($1, $2, $3, 'CONFIRMED')
      RETURNING booking_id;
    `, [passengerId, flightId, seatNumber]);

    // 🟢 FIXED: Extract index 0 right away to prevent undefined token crashes
    const newBookingId = bookingResult.rows[0].booking_id;

    // 5. Log the electronic credit card bill payment transaction invoice receipt
    await pool.query(`
      INSERT INTO payments (booking_id, amount_paid, payment_status)
      VALUES ($1, 249.00, 'SUCCESS');
    `, [newBookingId]);

    // 6. Decrement the available flight seat metrics inside PostgreSQL
    await pool.query(`
      UPDATE flights SET available_seats = available_seats - 1 WHERE flight_id = $1;
    `, [flightId]);

    // 7. Commit SQL transaction block safely to disk parameters
    await pool.query('COMMIT');

    // 8. Fetch flight metadata code string to decrement memory metrics inside Upstash Redis cache safely
    const flightQuery = await pool.query('SELECT flight_number FROM flights WHERE flight_id = $1', [flightId]);
    if (flightQuery.rows.length > 0) {
      // 🟢 FIXED: Extract index 0 safely from database tracking row
      const flightNum = flightQuery.rows[0].flight_number;
      const currentCachedSeats = await redis.get(`flight:seats:${flightNum}`);
      if (currentCachedSeats) {
        const newCount = Math.max(0, parseInt(String(currentCachedSeats), 10) - 1);
        await redis.set(`flight:seats:${flightNum}`, String(newCount));
      }
    }

    res.status(201).json({
      success: true,
      message: 'Secure card checkout successful! Ticket issued.',
      bookingId: newBookingId
    });

  } catch (error) {
    try { await pool.query('ROLLBACK'); } catch (e) { console.error('Rollback failed:', e); }
    console.error(' Booking checkout pipeline failed:', error);
    res.status(500).json({ error: 'Internal server card terminal checkout processing error.' });
  }
};

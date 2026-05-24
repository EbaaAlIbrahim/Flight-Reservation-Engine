import { Request, Response } from 'express';
import pool from '../config/db';

// POST /api/passengers/register
export const registerPassenger = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ error: 'All fields are required to register.' });
    return;
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT passenger_id FROM passengers WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Insert new passenger with zero baseline history
    const newUser = await pool.query(`
      INSERT INTO passengers (first_name, last_name, email, password_hash, loyalty_tier, lifetime_flights_booked)
      VALUES ($1, $2, $3, $4, 'NORMAL', 0)
      RETURNING passenger_id, first_name, last_name, email, loyalty_tier;
    `, [firstName, lastName, email, password]);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      passenger: newUser.rows[0]
    });
  } catch (error) {
    console.error(' Registration error:', error);
    res.status(500).json({ error: 'Internal registration processing failure.' });
  }
};

// POST /api/passengers/login
export const loginPassenger = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const userQuery = await pool.query(`
      SELECT passenger_id, first_name, last_name, email, loyalty_tier, password_hash 
      FROM passengers WHERE email = $1
    `, [email]);

    // CRITICAL FIX: Extract rows[0] properly to verify existing database password
    if (userQuery.rows.length === 0 || userQuery.rows[0].password_hash !== password) {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
      return;
    }

    const user = userQuery.rows[0];
    res.json({
      success: true,
      message: 'Authentication successful!',
      passenger: {
        id: user.passenger_id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        tier: user.loyalty_tier
      }
    });
  } catch (error) {
    console.error(' Login error:', error);
    res.status(500).json({ error: 'Internal login processing failure.' });
  }
};

// GET /api/passengers/:passengerId/trips
export const getRealPassengerBookings = async (req: Request, res: Response): Promise<void> => {
  const passengerId = String(req.params.passengerId);
  try {
    const result = await pool.query(`
      SELECT b.booking_id, f.flight_number, f.origin, f.destination, b.seat_number, b.status
      FROM bookings b
      JOIN flights f ON b.flight_id = f.flight_id
      WHERE b.passenger_id = $1
      ORDER BY b.updated_at DESC
    `, [passengerId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error(' Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch personal trips profiles.' });
  }
};

// DELETE /api/passengers/:passengerId/trips/:bookingId
export const cancelRealPassengerBooking = async (req: Request, res: Response): Promise<void> => {
  const { passengerId, bookingId } = req.params;
  try {
    await pool.query('BEGIN');

    // 1. Find the flight and seat number to release
    const bookingQuery = await pool.query(`
      SELECT flight_id, seat_number, status FROM bookings 
      WHERE booking_id = $1 AND passenger_id = $2 FOR UPDATE
    `, [bookingId, passengerId]);

    if (bookingQuery.rows.length === 0) {
      await pool.query('ROLLBACK');
      res.status(404).json({ error: 'Target reservation record not found.' });
      return;
    }

    const { flight_id, seat_number, status } = bookingQuery.rows[0];

    // 2. If it was confirmed/rerouted, free up the physical seat inventory
    if (status !== 'CANCELLED') {
      // Free seat table
      await pool.query(`
        UPDATE seats SET is_booked = FALSE 
        WHERE flight_id = $1 AND seat_number = $2
      `, [flight_id, seat_number]);

      // Return increment to flight capacity count
      await pool.query(`
        UPDATE flights SET available_seats = available_seats + 1 
        WHERE flight_id = $1
      `, [flight_id]);

      // Sync the real-time cache value in Memurai instantly
      const flightNumQuery = await pool.query('SELECT flight_number FROM flights WHERE flight_id = $1', [flight_id]);
      if (flightNumQuery.rows.length > 0) {
        const redis = require('../config/redis').default; // dynamic load
        await redis.hincrby('flight:seats', flightNumQuery.rows[0].flight_number, 1);
      }
    }

    // 3. Instead of wiping history, update status flag to CANCELLED for audit records
    await pool.query(`
      UPDATE bookings SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
      WHERE booking_id = $1
    `, [bookingId]);

    await pool.query('COMMIT');
    res.json({ success: true, message: 'Reservation cancelled and seat inventory released successfully.' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(' Cancellation error:', error);
    res.status(500).json({ error: 'Failed to process self-service cancellation routine.' });
  }
};

// DELETE /api/passengers/:passengerId
export const deletePassengerAccount = async (req: Request, res: Response): Promise<void> => {
  const passengerId = String(req.params.passengerId);

  try {
    // Drop the user row. Cascade keys in our schema will drop their bookings automatically
    const deleteQuery = await pool.query('DELETE FROM passengers WHERE passenger_id = $1 RETURNING passenger_id;', [passengerId]);
    
    if (deleteQuery.rows.length === 0) {
      res.status(404).json({ error: 'User profile account profile not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Account profile deleted completely from Apex Database records.'
    });
  } catch (error) {
    console.error(' Account deletion failed:', error);
    res.status(500).json({ error: 'Failed to complete account self-service deletion.' });
  }
};
// GET /api/passengers/:passengerId/notifications
export const getPassengerNotifications = async (req: Request, res: Response): Promise<void> => {
  const passengerId = String(req.params.passengerId);
  try {
    const result = await pool.query(`
      SELECT notification_id, title, message, type, created_at 
      FROM passenger_notifications 
      WHERE passenger_id = $1 
      ORDER BY created_at DESC;
    `, [passengerId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve passenger alerts timeline.' });
  }
};

// DELETE /api/passengers/:passengerId/notifications/:notificationId
export const deletePassengerNotification = async (req: Request, res: Response): Promise<void> => {
  const { notificationId } = req.params;
  try {
    await pool.query('DELETE FROM passenger_notifications WHERE notification_id = $1', [notificationId]);
    res.json({ success: true, message: 'Notification cleared cleanly.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to purge targeted alert row.' });
  }
};


// --- authController.ts ---
import { Request, Response } from 'express';
import pool from '../config/db';
import redis from '../config/redis';

export const registerPassenger = async (req: Request, res: Response): Promise<void> => {
  const firstName = req.body.firstName || req.body.first_name;
  const lastName = req.body.lastName || req.body.last_name;
  const { email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ error: 'All fields are required to register.' });
    return;
  }

  try {
    const userCheck = await pool.query('SELECT passenger_id FROM passengers WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const newUser = await pool.query(`
      INSERT INTO passengers (first_name, last_name, email, password_hash, loyalty_tier, lifetime_flights_booked)
      VALUES ($1, $2, $3, $4, 'NORMAL', 0)
      RETURNING passenger_id, first_name, last_name, email, loyalty_tier;
    `, [firstName, lastName, email, password]);

    // 🟢 FIX: Extract index 0 right away to prevent undefined crashes
    const createdUser = newUser.rows[0]; 

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      passenger: {
        id: createdUser.passenger_id,
        name: `${createdUser.first_name} ${createdUser.last_name}`,
        email: createdUser.email,
        tier: createdUser.loyalty_tier
      }
    });
  } catch (error) {
    console.error(' Registration error:', error);
    res.status(500).json({ error: 'Internal registration processing failure.' });
  }
};


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

    // 🟢 FIX: Compare with rows[0].password_hash to properly authenticate
    if (userQuery.rows.length === 0 || userQuery.rows[0].password_hash !== password) {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
      return;
    }

    const user = userQuery.rows[0]; // Extract row index 0 safely
    
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


export const getRealPassengerBookings = async (req: Request, res: Response): Promise<void> => {
  const passengerId = req.params.passengerId;
  try {
    const result = await pool.query(`SELECT b.*, f.flight_number FROM bookings b JOIN flights f ON b.flight_id = f.flight_id WHERE b.passenger_id = $1`, [passengerId]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Fetch failed' }); }
};

// DELETE /api/passengers/:passengerId/trips/:bookingId
export const cancelRealPassengerBooking = async (req: Request, res: Response): Promise<void> => {
  // 🟢 FIXED: Match case-sensitivity parameters exactly as defined in passengerRoutes.ts
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
      // Free seat configuration table matrix row cell
      await pool.query(`
        UPDATE seats SET is_booked = FALSE 
        WHERE flight_id = $1 AND seat_number = $2
      `, [flight_id, seat_number]);

      // Return increment to flight capacity counter metrics
      await pool.query(`
        UPDATE flights SET available_seats = available_seats + 1 
        WHERE flight_id = $1
      `, [flight_id]);

      // Sync the real-time cache value inside Upstash Redis instantly
      const flightNumQuery = await pool.query('SELECT flight_number FROM flights WHERE flight_id = $1', [flight_id]);
      if (flightNumQuery.rows.length > 0) {
        // 🟢 FIXED: Safely read row array index 0 mapping parameters
        const flightNum = flightNumQuery.rows[0].flight_number;
        const currentCachedSeats = await redis.get(`flight:seats:${flightNum}`);
        if (currentCachedSeats) {
          const newCount = parseInt(String(currentCachedSeats), 10) + 1;
          await redis.set(`flight:seats:${flightNum}`, String(newCount));
        }
      }
    }

    // 3. Instead of wiping history, update status flag to CANCELLED for logging validation audits
    await pool.query(`
      UPDATE bookings SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
      WHERE booking_id = $1
    `, [bookingId]);

    await pool.query('COMMIT');
    res.json({ success: true, message: 'Reservation cancelled and seat inventory released successfully.' });
  } catch (error) {
    try { await pool.query('ROLLBACK'); } catch (e) { console.error('Rollback error:', e); }
    console.error(' Cancellation error:', error);
    res.status(500).json({ error: 'Failed to process self-service cancellation routine.' });
  }
};


export const deletePassengerAccount = async (req: Request, res: Response): Promise<void> => {
  const { passengerId } = req.params;
  try {
    await pool.query('DELETE FROM passengers WHERE passenger_id = $1', [passengerId]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Deletion failed' }); }
};

export const getPassengerNotifications = async (req: Request, res: Response): Promise<void> => {
  const { passengerId } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM passenger_notifications WHERE passenger_id = $1`, [passengerId]);
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: 'Fetch failed' }); }
};

export const deletePassengerNotification = async (req: Request, res: Response): Promise<void> => {
  const { notificationId } = req.params;
  try {
    await pool.query('DELETE FROM passenger_notifications WHERE notification_id = $1', [notificationId]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Deletion failed' }); }
};


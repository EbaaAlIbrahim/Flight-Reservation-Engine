// --- authController.ts ---
import { Request, Response } from 'express';
import pool from '../config/db';
import redis from '../config/redis';

// POST /api/passengers/register
export const registerPassenger = async (req: Request, res: Response): Promise<void> => {
  // Support both snake_case from standard testing tools and camelCase from React App state definitions
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

    // Insert user record with strict snake_case naming columns on database disk
    const newUser = await pool.query(`
      INSERT INTO passengers (first_name, last_name, email, password_hash, loyalty_tier, lifetime_flights_booked)
      VALUES ($1, $2, $3, $4, 'NORMAL', 0)
      RETURNING passenger_id, first_name, last_name, email, loyalty_tier;
    `, [firstName, lastName, email, password]);

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

    if (userQuery.rows.length === 0 || userQuery.rows[0].password_hash !== password) {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
      return;
    }

    const user = userQuery.rows[0];
    
    // Explicitly return individual parameter keys expected by App.tsx view states
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

export const cancelRealPassengerBooking = async (req: Request, res: Response): Promise<void> => {
  const { bookingId } = req.params;
  try {
    await pool.query('UPDATE bookings SET status = $1 WHERE booking_id = $2', ['CANCELLED', bookingId]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Cancellation failed' }); }
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


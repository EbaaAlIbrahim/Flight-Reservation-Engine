// --- authController.ts ---
import { Request, Response } from 'express';
import pool from '../config/db';
import redis from '../config/redis';

export const registerPassenger = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const newUser = await pool.query(`INSERT INTO passengers (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING passenger_id;`, [firstName, lastName, email, password]);
    res.status(201).json({ success: true, passenger: newUser.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Registration failed' }); }
};

export const loginPassenger = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    const userQuery = await pool.query(`SELECT * FROM passengers WHERE email = $1 AND password_hash = $2`, [email, password]);
    if (userQuery.rows.length === 0) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    res.json({ success: true, passenger: userQuery.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Login failed' }); }
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


// --- passengerController.ts ---
import { Request, Response } from 'express';
import pool from '../config/db';
import redis from '../config/redis';

export const getPassengerDisruptionDetails = async (req: Request, res: Response): Promise<void> => {
  const { passengerId } = req.params;
  try {
    const bookings = await pool.query(`SELECT * FROM bookings WHERE passenger_id = $1 AND status = $2`, [passengerId, 'DISRUPTED']);
    res.json(bookings.rows);
  } catch (error) { res.status(500).json({ error: 'Fetch failed' }); }
};

export const selectAlternativeFlight = async (req: Request, res: Response): Promise<void> => {
  const { bookingId, newFlightId } = req.body;
  try {
    await pool.query(`UPDATE bookings SET flight_id = $1, status = $2 WHERE booking_id = $3`, [newFlightId, 'RE_ROUTED', bookingId]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Update failed' }); }
};

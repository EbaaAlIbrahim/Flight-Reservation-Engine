import { Request, Response } from 'express';
import pool from '../config/db';

/**
 * 🟢 Fetch all bookings flagged as disrupted for a specific passenger
 */
export const getPassengerDisruptionDetails = async (req: Request, res: Response): Promise<void> => {
  const { passengerId } = req.params;
  try {
    const bookings = await pool.query(
      'SELECT * FROM bookings WHERE passenger_id = $1 AND status = $2', 
      [passengerId, 'DISRUPTED']
    );
    res.json(bookings.rows);
  } catch (error) { 
    res.status(500).json({ error: 'Fetch failed to retrieve flight disruption logs.' }); 
  }
};

/**
 * 🟢 Update an existing reservation to a new alternative flight
 */
export const selectAlternativeFlight = async (req: Request, res: Response): Promise<void> => {
  const { bookingId, newFlightId } = req.body;
  try {
    await pool.query(
      'UPDATE bookings SET flight_id = $1, status = $2 WHERE booking_id = $3', 
      [newFlightId, 'RE_ROUTED', bookingId]
    );
    res.json({ success: true, message: 'Passenger successfully re-routed to alternative schedule.' });
  } catch (error) { 
    res.status(500).json({ error: 'Update transaction failed during alternative flight placement.' }); 
  }
};

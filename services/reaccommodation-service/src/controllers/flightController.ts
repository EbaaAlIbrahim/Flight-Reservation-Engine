// --- flightController.ts ---
import { Request, Response } from 'express';
import pool from '../config/db';

export const getAllAvailableFlights = async (req: Request, res: Response): Promise<void> => {
  try {
    const flights = await pool.query('SELECT * FROM flights WHERE available_seats > 0');
    res.json(flights.rows);
  } catch (error) { res.status(500).json({ error: 'Fetch failed' }); }
};

export const getFlightSeatMap = async (req: Request, res: Response): Promise<void> => {
  const { flightId } = req.params;
  try {
    const seats = await pool.query('SELECT * FROM seats WHERE flight_id = $1', [flightId]);
    res.json(seats.rows);
  } catch (error) { res.status(500).json({ error: 'Fetch failed' }); }
};
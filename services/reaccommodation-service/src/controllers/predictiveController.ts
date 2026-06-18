// --- predictiveController.ts ---
import { Request, Response } from 'express';
import pool from '../config/db';

export const evaluateFlightDelayRisk = async (req: Request, res: Response): Promise<void> => {
  const { flightNumber } = req.body;
  try {
    const flight = await pool.query('SELECT * FROM flights WHERE flight_number = $1', [flightNumber]);
    res.json({ flight: flight.rows[0], risk: 'low' });
  } catch (error) { res.status(500).json({ error: 'Analysis failed' }); }
};

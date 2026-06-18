import { Request, Response } from 'express';
import pool from '../config/db';

export const handleMachineLearningSyncWebhook = async (req: Request, res: Response): Promise<void> => {
  const { flightNumber, delayMinutes, probabilityRisk } = req.body;
  try {
    const flightQuery = await pool.query('SELECT flight_id, airline_name FROM flights WHERE flight_number = $1', [flightNumber]);
    if (flightQuery.rows.length === 0) { res.status(404).json({ error: 'Flight not found' }); return; }
    const flight = flightQuery.rows[0];
    await pool.query(`UPDATE flights SET predictive_delay_probability = $1, predicted_delay_minutes = $2 WHERE flight_number = $3;`, [probabilityRisk, delayMinutes, flightNumber]);
    const flagType = delayMinutes >= 120 ? 'CANCEL_RISK' : 'DELAY_RISK';
    const passengerQuery = await pool.query(`SELECT passenger_id FROM bookings WHERE flight_id = $1 AND status != 'CANCELLED';`, [flight.flight_id]);
    for (const row of passengerQuery.rows) {
      await pool.query(`INSERT INTO passenger_notifications (passenger_id, title, message, type) VALUES ($1, $2, $3, $4);`, [row.passenger_id, flagType === 'CANCEL_RISK' ? 'Critical Status' : 'Delay Update', 'Flight status changed', flagType]);
    }
    res.json({ success: true, notified: passengerQuery.rows.length });
  } catch (error) { res.status(500).json({ error: 'Sync error' }); }
};
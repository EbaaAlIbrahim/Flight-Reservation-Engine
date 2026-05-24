import { Request, Response } from 'express';
import pool from '../config/db';

// POST /api/admin/ai/sync-prediction (Triggered automatically by Python ML Engine Webhook)
export const handleMachineLearningSyncWebhook = async (req: Request, res: Response): Promise<void> => {
  const { flightNumber, delayMinutes, probabilityRisk } = req.body;

  try {
    console.log(`📡 Webhook Received: Syncing Python ML delay calculations for Flight ${flightNumber}...`);

    // 1. Fetch flight operational data details
    const flightQuery = await pool.query('SELECT flight_id, airline_name FROM flights WHERE flight_number = $1', [flightNumber]);
    if (flightQuery.rows.length === 0) {
      res.status(404).json({ error: 'Target flight vector data path not found.' });
      return;
    }
    const flight = flightQuery.rows[0];

    // 2. Update flights table parameter arrays with true ML model predictions
    await pool.query(`
      UPDATE flights 
      SET predictive_delay_probability = $1, predicted_delay_minutes = $2 
      WHERE flight_number = $3;
    `, [probabilityRisk, delayMinutes, flightNumber]);

    // Determine flag severity categories
    const flagType = delayMinutes >= 120 ? 'CANCEL_RISK' : 'DELAY_RISK';

    // 3. BROADCAST NOTICE PIPELINE LOOP
    // Find all users who are actively registered and booked onto this delayed aircraft
    const passengerQuery = await pool.query(`
      SELECT passenger_id FROM bookings WHERE flight_id = $1 AND status != 'CANCELLED';
    `, [flight.flight_id]);

    for (const row of passengerQuery.rows) {
      const alertTitle = flagType === 'CANCEL_RISK' ? ' Critical Flight Status Alteration' : '🕒 Schedule Delay Update';
      const alertMessage = `Important operations update regarding your upcoming ${flight.airline_name} Flight ${flightNumber}: Our Machine Learning Predictive Core tracking weather across interconnected airports has projected a delay of exactly +${delayMinutes} minutes for your travel vector. Please monitor your live dashboard screen for schedule updates.`;

      // Insert custom message row directly into each user's notification box drawer pipeline
      await pool.query(`
        INSERT INTO passenger_notifications (passenger_id, title, message, type)
        VALUES ($1, $2, $3, $4);
      `, [row.passenger_id, alertTitle, alertMessage, flagType]);
    }

    res.json({
      success: true,
      message: `Machine learning predictions synchronized! ${passengerQuery.rows.length} registered passengers notified successfully via live alerts stream.`
    });

  } catch (error) {
    console.error(' Failed to process input webhook metrics:', error);
    res.status(500).json({ error: 'Internal server synchronization error.' });
  }
};

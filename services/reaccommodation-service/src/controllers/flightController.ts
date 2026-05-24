import { Request, Response } from 'express';
import pool from '../config/db';

// GET /api/flights
export const getAllAvailableFlights = async (req: Request, res: Response): Promise<void> => {
  try {
    // Select flights that aren't the baseline canceled flight
    const flightsQuery = await pool.query(`
      SELECT flight_id, flight_number, origin, destination, departure_time, arrival_time, capacity, available_seats 
      FROM flights 
      WHERE available_seats > 0
      ORDER BY departure_time ASC
    `);
    res.json(flightsQuery.rows);
  } catch (error) {
    console.error(' Flight list retrieval failed:', error);
    res.status(500).json({ error: 'Failed to retrieve available flights.' });
  }
};

// GET /api/flights/:flightId/seats
export const getFlightSeatMap = async (req: Request, res: Response): Promise<void> => {
  // Extract and explicitly cast parameters to a clean string primitive
  const flightId = String(req.params.flightId);

  try {
    const seatsQuery = await pool.query(`
      SELECT seat_id, seat_number, is_booked 
      FROM seats 
      WHERE flight_id = $1
      ORDER BY seat_number ASC
    `, [flightId]);

    res.json({
      flight_id: parseInt(flightId, 10),
      seats: seatsQuery.rows
    });
  } catch (error) {
    console.error(' Seat map retrieval failed:', error);
    res.status(500).json({ error: 'Failed to build seat configurations map.' });
  }
};

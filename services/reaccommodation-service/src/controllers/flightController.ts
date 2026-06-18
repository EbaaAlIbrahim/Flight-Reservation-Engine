import { Request, Response } from 'express';
import pool from '../config/db';

// GET /api/flights
export const getAllAvailableFlights = async (req: Request, res: Response): Promise<void> => {
  try {
    const flights = await pool.query(`
      SELECT flight_id, flight_number, airline_name, origin, destination, 
             departure_time, arrival_time, capacity, available_seats 
      FROM flights 
      WHERE available_seats > 0
      ORDER BY departure_time ASC;
    `);
    res.json(flights.rows);
  } catch (error) {
    console.error('Fetch flights failed:', error);
    res.status(500).json({ error: 'Fetch flights failed' });
  }
};

// GET /api/flights/:flightId/seats
export const getFlightSeatMap = async (req: Request, res: Response): Promise<void> => {
  const flightId = String(req.params.flightId);

  try {
    const seats = await pool.query(`
      SELECT seat_id, seat_number, is_booked 
      FROM seats 
      WHERE flight_id = $1
      ORDER BY seat_number ASC;
    `, [flightId]);

    // 🟢 FIXED: Wrap the array inside an object matching your frontend's requirements
    res.json({
      flight_id: parseInt(flightId, 10),
      seats: seats.rows // This allows the front-end to safely run .map() without crashing!
    });
  } catch (error) {
    console.error('Fetch seats map failed:', error);
    res.status(500).json({ error: 'Fetch seats map failed' });
  }
};

// --- bookingController.ts ---
import { Request, Response } from 'express';
import pool from '../config/db';
import redis from '../config/redis';

export const createPassengerFlightBooking = async (req: Request, res: Response): Promise<void> => {
  const { passengerId, flightId, seatNumber } = req.body;
  try {
    await pool.query('BEGIN');
    const bookingResult = await pool.query(`INSERT INTO bookings (passenger_id, flight_id, seat_number, status) VALUES ($1, $2, $3, $4) RETURNING booking_id;`, [passengerId, flightId, seatNumber, 'CONFIRMED']);
    await pool.query(`UPDATE flights SET available_seats = available_seats - 1 WHERE flight_id = $1;`, [flightId]);
    await pool.query('COMMIT');
    res.status(201).json({ success: true, bookingId: bookingResult.rows[0].booking_id });
  } catch (error) { await pool.query('ROLLBACK'); res.status(500).json({ error: 'Booking failed' }); }
};
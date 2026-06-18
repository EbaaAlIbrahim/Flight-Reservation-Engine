import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db'; // 🟢 Import your pg pool connection
import passengerRoutes from './routes/passengerRoutes';
import adminRoutes from './routes/adminRoutes';
import flightRoutes from './routes/flightRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'https://flight-reservation-ui.vercel.app',
  credentials: true
}));

app.options('/*path', cors());
app.use(express.json());

// 🚀 DIAGNOSTICS HOMEPAGE: Query and print database contents straight to screen
app.get('/', async (req: Request, res: Response) => {
  try {
    // Query active flight seed records from Supabase
    const dbTest = await pool.query('SELECT flight_number, airline_name, origin, destination, available_seats FROM flights ORDER BY flight_number ASC LIMIT 10;');
    
    res.json({
      database_status: "CONNECTED ✅",
      message: "The backend is securely querying database metrics.",
      total_flights_found: dbTest.rows.length,
      live_database_rows: dbTest.rows // This will visually print your seeded database on screen
    });
  } catch (error: any) {
    res.status(500).json({
      database_status: "CRASHED ❌",
      error_message: error.message,
      tip: "If you see 'password authentication failed' or 'timeout', your Vercel Environment variables are missing or out of sync."
    });
  }
});

// Routes Mounting Points
app.use('/api/passengers', passengerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/flights', flightRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', message: 'Aviation Re-accommodation Service is fully operational.' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}

export default app;

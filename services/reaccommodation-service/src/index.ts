import express, { Request, Response } from 'express';
import cors from 'cors'; // 1. Added CORS security import
import dotenv from 'dotenv';
import pool from './config/db';
import redis from './config/redis'; 
import { initializeDatabase } from './db/initDb';
import { seedMockData } from './db/seed';
import { syncFlightInventoryToCache } from './controllers/cacheController';
import passengerRoutes from './routes/passengerRoutes';
import adminRoutes from './routes/adminRoutes';
import flightRoutes from './routes/flightRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Activated CORS policy to accept secure requests from your live frontend
app.use(cors({
  origin: [
    'http://localhost:5173', // Local Vite testing environment
    'https://vercel.app' // Your exact production frontend URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes Master Mounting Points
app.use('/api/passengers', passengerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/flights', flightRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', message: 'Re-accommodation Service Engine is active' });
});

async function runEngineLifecycle() {
  try {
    // 1. Verify relational database infrastructure
    await pool.query('SELECT NOW()');
    console.log(' PostgreSQL Connection Verified successfully!');
    await redis.ping();
    console.log(' Upstash Cloud Redis Cache Connection Verified successfully!');

    // 2. Initialize structural system tables
    const databaseIsFreshlyCreated = await initializeDatabase();

    // 3. Conditional Seeding: ONLY run mock seeding if database was empty/missing
    if (databaseIsFreshlyCreated) {
      console.log(' Empty database state detected. Populating playground data rows...');
      await seedMockData();
    } else {
      console.log(' Persistent Storage Active: Retaining existing user profiles, bookings, and billing metrics.');
    }

    // 4. Synchronize operational flight inventories to memory cache pool arrays
    await syncFlightInventoryToCache();
    
  } catch (error) {
    console.error(' Engine lifecycle startup crashed!');
    console.error(error);
    // Removed process.exit(1) so a temporary database hiccup doesn't crash your serverless instance completely
  }
}

// 3. Optimized trigger condition for Vercel Serverless environment execution
if (process.env.VERCEL) {
  // Runs lifecycle syncing mechanisms immediately in the cloud background
  runEngineLifecycle();
} else {
  // Local laptop startup execution loop
  app.listen(PORT, async () => {
    console.log('--------------------------------------------------');
    console.log(` Server running smoothly on http://localhost:${PORT}`);
    await runEngineLifecycle();
  });
}

// Export the app module required by Vercel serverless functions handle configurations
export default app;

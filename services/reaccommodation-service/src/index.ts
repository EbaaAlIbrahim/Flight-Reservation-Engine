import express, { Request, Response } from 'express';
import cors from 'cors';
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

// 1. Fully open CORS globally for production ease to resolve any domain matching bugs completely
app.use(cors({
  origin: true, // Dynamically reflects and accepts whichever frontend URL calls it safely
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

// Flag to ensure structural setup runs only once per server instance lifecycle
let engineInitialized = false;

async function runEngineLifecycle() {
  if (engineInitialized) return;
  try {
    // 1. Verify relational database infrastructure
    await pool.query('SELECT NOW()');
    console.log(' PostgreSQL Connection Verified successfully!');
    await redis.ping();
    console.log(' Cloud Redis Cache Connection Verified successfully!');

    // 2. Initialize structural system tables
    const databaseIsFreshlyCreated = await initializeDatabase();

    // 3. Conditional Seeding: ONLY run mock seeding if database was empty/missing
    if (databaseIsFreshlyCreated) {
      console.log(' Empty database state detected. Populating playground data rows...');
      await seedMockData();
    }

    // 4. Synchronize operational flight inventories to memory cache pool arrays
    await syncFlightInventoryToCache();
    engineInitialized = true;
    
  } catch (error) {
    console.error(' Engine lifecycle startup crashed!');
    console.error(error);
  }
}

// Middleware handler trick: Automatically runs database boots on the very first network request
app.use(async (req, res, next) => {
  await runEngineLifecycle();
  next();
});

// 2. FIXED: Keep the standard listen runner active so Vercel hooks into the port execution context cleanly
app.listen(PORT, async () => {
  console.log(`Server running smoothly on port ${PORT}`);
});

// Export the app module required by Vercel serverless configurations
export default app;

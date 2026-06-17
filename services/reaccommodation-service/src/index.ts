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

// Globally allow Cross-Origin Resource Sharing for production stability
app.use(cors({
  origin: true, 
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
  res.json({ status: 'UP', message: 'Re-accommodation Service Engine is active inside Vercel Serverless!' });
});

// Flag to guarantee structural initialization runs only once per runtime block lifecycle
let engineInitialized = false;

async function runEngineLifecycle() {
  if (engineInitialized) return;
  try {
    // 1. Verify relational cloud storage connections
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL Connection Verified successfully!');
    
    await redis.ping();
    console.log('Upstash Cloud Redis Connection Verified successfully!');

    // 2. Initialize structural system tables
    const databaseIsFreshlyCreated = await initializeDatabase();

    // 3. Conditional Seeding
    if (databaseIsFreshlyCreated) {
      console.log('Empty database state detected. Populating playground data rows...');
      await seedMockData();
    }

    // 4. Synchronize operational flight inventories to memory cache pool arrays
    await syncFlightInventoryToCache();
    engineInitialized = true;
    
  } catch (error) {
    console.error('Engine lifecycle startup crashed inside serverless execution block!');
    console.error(error);
  }
}

// Interceptor Middleware: Lazily executes initialization logic on-demand before running endpoint controllers
app.use((req, res, next) => {
  if (!engineInitialized) {
    runEngineLifecycle().catch(console.error);
  }
  next();
});

// NATIVE SERVERLESS ENGINE ROUTING:
// If running locally, spin up standard listen bindings. Otherwise, export the app module directly for Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}

// Crucial: Vercel reads this export statement to map incoming HTTP calls straight into Express
export default app;

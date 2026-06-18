import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passengerRoutes from './routes/passengerRoutes';
import adminRoutes from './routes/adminRoutes';
import flightRoutes from './routes/flightRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'https://flight-reservation-ui.vercel.app',
  'http://localhost:5173'
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy Configuration'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Explicitly handle preflight OPTIONS requests across all routes
app.options('*', cors());

app.use(express.json());

// Routes Master Mounting Points
app.use('/passengers', passengerRoutes);
app.use('/admin', adminRoutes);
app.use('/flights', flightRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', message: 'Aviation Re-accommodation Service is fully operational.' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}

export default app;

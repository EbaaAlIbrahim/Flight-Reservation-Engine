import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

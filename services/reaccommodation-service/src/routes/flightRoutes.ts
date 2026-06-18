
// --- flightRoutes.ts ---
import { Router } from 'express';
import { getAllAvailableFlights, getFlightSeatMap } from '../controllers/flightController';
import { createPassengerFlightBooking } from '../controllers/bookingController';
import { evaluateFlightDelayRisk } from '../controllers/predictiveController';
const router = Router();
router.get('/', getAllAvailableFlights);
router.get('/:flightId/seats', getFlightSeatMap);
router.post('/book', createPassengerFlightBooking);
router.post('/predict-delay', evaluateFlightDelayRisk);
export default router;
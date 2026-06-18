
// --- flightRoutes.ts ---
import { Router } from 'express';
import { getAllAvailableFlights, getFlightSeatMap } from '../controllers/flightController';
import { createPassengerFlightBooking } from '../controllers/bookingController';
const router = Router();
router.get('/', getAllAvailableFlights);
router.get('/:flightId/seats', getFlightSeatMap);
router.post('/book', createPassengerFlightBooking);
export default router;
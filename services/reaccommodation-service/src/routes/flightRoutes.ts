import { Router } from 'express';
import { getAllAvailableFlights, getFlightSeatMap } from '../controllers/flightController';
import { createPassengerFlightBooking } from '../controllers/bookingController'; // Fixed function naming import

const router = Router();

// Expose flight browser endpoint grids
router.get('/', getAllAvailableFlights);

// Expose visual seating configurations layout matrix map
router.get('/:flightId/seats', getFlightSeatMap);

// Expose secure booking checkout network route
router.post('/book', createPassengerFlightBooking);

export default router;

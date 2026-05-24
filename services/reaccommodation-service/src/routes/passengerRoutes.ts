import { Router } from 'express';
import { getPassengerDisruptionDetails, selectAlternativeFlight, getRealPassengerBookings, cancelRealPassengerBooking } from '../controllers/passengerController';
import { registerPassenger, loginPassenger, deletePassengerAccount, getPassengerNotifications, deletePassengerNotification } from '../controllers/authController'; // Added new imports
import { createPassengerFlightBooking } from '../controllers/bookingController'; 

const router = Router();

// Auth Endpoints
router.post('/register', registerPassenger);
router.post('/login', loginPassenger);

// Operational Disruption Endpoints
router.get('/:passengerId/disruption', getPassengerDisruptionDetails);
router.post('/:passengerId/select', selectAlternativeFlight);

// Core Booking & Itinerary Management Vectors
router.post('/:passengerId/book', createPassengerFlightBooking); 
router.get('/:passengerId/trips', getRealPassengerBookings);
router.delete('/:passengerId/trips/:bookingId', cancelRealPassengerBooking);
router.delete('/:passengerId', deletePassengerAccount);

// Live Alert Timeline Feed Routes
router.get('/:passengerId/notifications', getPassengerNotifications);
router.delete('/:passengerId/notifications/:notificationId', deletePassengerNotification);

export default router;

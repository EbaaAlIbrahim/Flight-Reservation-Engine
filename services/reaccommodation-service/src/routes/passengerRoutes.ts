import { Router } from 'express';
// 1. Remove the misplaced trip handlers from passengerController import:
import { getPassengerDisruptionDetails, selectAlternativeFlight } from '../controllers/passengerController';
// 2. Move those trip handlers into the authController import instead:
import { registerPassenger, loginPassenger, deletePassengerAccount, getPassengerNotifications, deletePassengerNotification, getRealPassengerBookings, cancelRealPassengerBooking } from '../controllers/authController'; 
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

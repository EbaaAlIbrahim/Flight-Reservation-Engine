import { Router } from 'express';
import { handleMachineLearningSyncWebhook } from '../controllers/aiAgentController';

const router = Router();

// Endpoint for Python Webhook loop sync operations
router.post('/ai/sync-prediction', handleMachineLearningSyncWebhook);

export default router;

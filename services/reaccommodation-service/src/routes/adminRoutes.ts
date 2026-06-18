// --- adminRoutes.ts ---
import { Router } from 'express';
import { handleMachineLearningSyncWebhook } from '../controllers/aiAgentController';
const router = Router();
router.post('/ai/sync-prediction', handleMachineLearningSyncWebhook);
export default router;
import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import * as transferController from '../controllers/transferController';

const router = Router();
router.use(requireAuth as any);

router.post('/', transferController.createTransfer as any);
router.get('/', transferController.getTransfers as any);
router.get('/:id', transferController.getTransferById as any);
router.post('/:id/execute', transferController.executeTransfer as any);

export default router;

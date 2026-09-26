import { Router } from 'express';
import { getAdjustments, getAdjustmentById, createAdjustment } from '../controllers/adjustmentController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth as any);

router.get('/', getAdjustments as any);
router.get('/:id', getAdjustmentById as any);
router.post('/', createAdjustment as any);

export default router;

import { Router } from 'express';
import { getDeliveries, getDeliveryById, createDelivery, validateDelivery } from '../controllers/deliveryController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth as any);

router.get('/', getDeliveries as any);
router.post('/', createDelivery as any);
router.get('/:id', getDeliveryById as any);
router.post('/:id/validate', validateDelivery as any);

export default router;

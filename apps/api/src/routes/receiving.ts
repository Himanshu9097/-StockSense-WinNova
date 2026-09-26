import { Router } from 'express';
import { getReceipts, getReceiptById, createReceipt, validateReceipt, receiveItems, completePutaway, getPutawayTasks } from '../controllers/receivingController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth as any);

router.get('/', getReceipts as any);
router.get('/tasks', getPutawayTasks as any);
router.post('/', createReceipt as any);
router.get('/:id', getReceiptById as any);
router.post('/:id/validate', validateReceipt as any);
router.post('/receive', receiveItems as any);
router.post('/putaway', completePutaway as any);

export default router;

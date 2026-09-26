import { Router } from 'express';
import { 
  getReceipts, 
  getReceiptById, 
  createReceipt, 
  updateReceipt,
  validateReceipt, 
  cancelReceipt,
  deleteReceipt,
  receiveItems, 
  completePutaway, 
  getPutawayTasks 
} from '../controllers/receivingController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth as any);

router.get('/', getReceipts as any);
router.get('/tasks', getPutawayTasks as any);
router.post('/', createReceipt as any);
router.get('/:id', getReceiptById as any);
router.put('/:id', updateReceipt as any);
router.post('/:id/validate', validateReceipt as any);
router.post('/:id/cancel', cancelReceipt as any);
router.delete('/:id', deleteReceipt as any);
router.post('/receive', receiveItems as any);
router.post('/putaway', completePutaway as any);

export default router;

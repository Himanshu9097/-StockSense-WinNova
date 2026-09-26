import { Router } from 'express';
import { getProducts, createProduct, getWarehouses, getLocations, getStock, seedInventory } from '../controllers/inventoryController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth as any);

router.get('/products', getProducts as any);
router.post('/products', createProduct as any);
router.get('/warehouses', getWarehouses as any);
router.get('/locations', getLocations as any);
router.get('/stock', getStock as any);
router.post('/seed', seedInventory as any);

export default router;

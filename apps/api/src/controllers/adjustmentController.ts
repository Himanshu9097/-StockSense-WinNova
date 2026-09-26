import { Response } from 'express';
import { AdjustmentService } from '../services/adjustmentService';
import { AuthRequest } from '../middlewares/auth';

export const getAdjustments = async (req: AuthRequest, res: Response) => {
  try {
    const filters = req.query;
    const adjustments = await AdjustmentService.getAdjustments(filters);
    res.status(200).json(adjustments);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching adjustments' });
  }
};

export const getAdjustmentById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adjustment = await AdjustmentService.getAdjustmentById(id as string);
    if (!adjustment) {
      return res.status(404).json({ error: 'Adjustment not found' });
    }
    res.status(200).json(adjustment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error fetching adjustment' });
  }
};

export const createAdjustment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { productId, warehouseId, locationId, countedQuantity, expectedSystemQuantity, reason, notes } = req.body;

    if (!productId || !warehouseId || !locationId || countedQuantity === undefined || expectedSystemQuantity === undefined || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const adjustment = await AdjustmentService.createAdjustment({
      productId, warehouseId, locationId, countedQuantity, expectedSystemQuantity, reason, notes
    }, userId);

    res.status(201).json({ message: 'Stock adjusted successfully', adjustment });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Unable to apply adjustment. Please try again.' });
  }
};

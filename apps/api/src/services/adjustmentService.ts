import mongoose from 'mongoose';
import { Adjustment, InventoryBalance, StockLedger, Product, Warehouse, Location } from '../models';

export class AdjustmentService {
  static async getAdjustments(filters: any = {}) {
    const query: any = {};
    if (filters.productId) query.productId = filters.productId;
    if (filters.warehouseId) query.warehouseId = filters.warehouseId;
    if (filters.locationId) query.locationId = filters.locationId;
    if (filters.status) query.status = filters.status;
    
    return Adjustment.find(query)
      .populate('productId', 'name sku')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  }

  static async getAdjustmentById(id: string) {
    return Adjustment.findById(id)
      .populate('productId')
      .populate('warehouseId')
      .populate('locationId')
      .populate('createdBy', 'name email');
  }

  static async createAdjustment(data: {
    productId: string;
    warehouseId: string;
    locationId: string;
    countedQuantity: number;
    expectedSystemQuantity: number;
    reason: string;
    notes?: string;
  }, userId: string) {
    const { productId, warehouseId, locationId, countedQuantity, expectedSystemQuantity, reason, notes } = data;

    if (countedQuantity < 0) {
      throw new Error('Physical count cannot be negative');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const location = await Location.findById(locationId).session(session);
      if (!location) throw new Error('Location not found');
      if (location.warehouseId.toString() !== warehouseId) {
        throw new Error('Location does not belong to selected warehouse');
      }

      let balance = await InventoryBalance.findOne({ productId, locationId }).session(session);
      
      if (!balance) {
        balance = new InventoryBalance({ productId, warehouseId, locationId, onHand: 0 });
      }

      const systemQuantity = balance.onHand;
      if (systemQuantity !== expectedSystemQuantity) {
        throw new Error('Stock changed since this adjustment was started. Please refresh and recount.');
      }
      const difference = countedQuantity - systemQuantity;
      if (difference === 0) {
        throw new Error('No adjustment required');
      }

      balance.onHand = countedQuantity;
      await balance.save({ session });

      const adjustment = new Adjustment({
        productId,
        warehouseId,
        locationId,
        systemQuantity,
        countedQuantity,
        difference,
        reason,
        notes,
        createdBy: userId,
        status: 'Completed'
      });
      await adjustment.save({ session });

      const ledger = new StockLedger({
        transactionId: `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        operation: 'ADJUSTMENT',
        productId,
        sourceLocationId: difference < 0 ? locationId : undefined,
        destinationLocationId: difference > 0 ? locationId : undefined,
        quantity: Math.abs(difference),
        beforeQuantity: systemQuantity,
        afterQuantity: countedQuantity,
        referenceType: 'Adjustment',
        referenceId: adjustment._id,
        reason,
        performedBy: userId
      });
      await ledger.save({ session });

      await session.commitTransaction();
      session.endSession();

      return adjustment;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}


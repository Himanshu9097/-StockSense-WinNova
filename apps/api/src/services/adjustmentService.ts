import mongoose from 'mongoose';
import { Adjustment, Stock, StockLedger, Product, Warehouse, Location } from '../models';

export class AdjustmentService {
  static async getAdjustments(filters: any = {}) {
    const query: any = {};
    if (filters.productId) query.productId = filters.productId;
    if (filters.warehouseId) query.warehouseId = filters.warehouseId;
    if (filters.locationId) query.locationId = filters.locationId;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      // populate search could be complex, omitting for MVP simplicity
    }
    
    return Adjustment.find(query)
      .populate('productId', 'name sku')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'name')
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
      // 1. Fetch current stock (with lock in a real RDMS, using findOneAndUpdate in Mongo can simulate atomic update)
      // Since Mongoose doesn't have true row locks without findOneAndUpdate, we will use optimistic approach
      // or just find it and hope it's not changed in the split second, or use findOneAndUpdate with condition.
      
      const location = await Location.findById(locationId).session(session);
      if (!location) throw new Error('Location not found');
      if (location.warehouseId.toString() !== warehouseId) {
        throw new Error('Location does not belong to selected warehouse');
      }

      let stock = await Stock.findOne({ productId, locationId }).session(session);
      
      if (!stock) {
        stock = new Stock({ productId, warehouseId, locationId, quantity: 0 });
      }

      const systemQuantity = stock.quantity;
      if (systemQuantity !== expectedSystemQuantity) {
        throw new Error('Stock changed since this adjustment was started. Please refresh and recount.');
      }
      const difference = countedQuantity - systemQuantity;
      if (difference === 0) {
        throw new Error('No adjustment required');
      }

      // 5. Update inventory
      stock.quantity = countedQuantity;
      await stock.save({ session });

      // 7. Create adjustment record
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

      // 8. Create stock ledger entry
      const ledger = new StockLedger({
        operation: 'ADJUSTMENT',
        productId,
        warehouseId,
        locationId,
        previousQuantity: systemQuantity,
        change: difference,
        newQuantity: countedQuantity,
        reason,
        userId
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

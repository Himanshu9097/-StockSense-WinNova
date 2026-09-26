import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { DeliveryOrder, InventoryBalance, StockLedger } from '../models';
import mongoose from 'mongoose';

export const getDeliveries = async (req: AuthRequest, res: Response) => {
  try {
    const deliveries = await DeliveryOrder.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json(deliveries);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
};

export const getDeliveryById = async (req: AuthRequest, res: Response) => {
  try {
    const delivery = await DeliveryOrder.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('lines.productId', 'name sku')
      .populate('lines.locationId', 'code type')
      .populate('warehouseId', 'name code')
      .populate('locationId', 'code type');

    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    res.status(200).json(delivery);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch delivery' });
  }
};

export const createDelivery = async (req: AuthRequest, res: Response) => {
  try {
    const { warehouseId, locationId, customer, reference, lines, notes, draft } = req.body;

    if (!warehouseId || !lines || lines.length === 0) {
      return res.status(400).json({ error: 'Warehouse and at least one line are required.' });
    }
    for (const line of lines) {
      if (!line.productId || !line.quantity || line.quantity <= 0) {
        return res.status(400).json({ error: 'Each line must have a product and quantity greater than 0.' });
      }
    }

    const deliveryNumber = `DEL-${Date.now()}`;

    const delivery = new DeliveryOrder({
      deliveryNumber,
      warehouseId,
      locationId,
      customer,
      reference,
      lines,
      notes,
      createdBy: req.user!.userId,
      status: draft ? 'DRAFT' : 'READY'
    });

    await delivery.save();
    res.status(201).json(delivery);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create delivery' });
  }
};

// Validate delivery: check stock, decrease stock, write ledger (idempotent guard)
export const validateDelivery = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const delivery = await DeliveryOrder.findById(req.params.id)
      .populate('lines.productId', 'name sku')
      .session(session);

    if (!delivery) throw new Error('Delivery not found');

    if (delivery.status === 'DONE') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'This delivery has already been validated.' });
    }
    if (delivery.status === 'CANCELLED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Cannot validate a cancelled delivery.' });
    }

    // Phase 1: Pre-check all stock levels before modifying anything
    for (const line of delivery.lines) {
      const locationId = (line as any).locationId || (delivery as any).locationId;
      if (!locationId) {
        throw new Error(`No source location assigned for product ${(line.productId as any)?.name || line.productId}. Please select a location.`);
      }
      const balance = await InventoryBalance.findOne({
        productId: line.productId,
        locationId,
        lotId: line.lotId || null,
        serialId: line.serialId || null
      }).session(session);

      const available = balance ? balance.onHand : 0;
      if (available < line.quantity) {
        throw new Error(`Insufficient stock for ${(line.productId as any)?.name || 'product'}. Available: ${available}, Requested: ${line.quantity}.`);
      }
    }

    // Phase 2: Deduct stock and write ledger entries
    for (const line of delivery.lines) {
      const locationId = (line as any).locationId || (delivery as any).locationId;

      const balance = await InventoryBalance.findOne({
        productId: line.productId,
        locationId,
        lotId: line.lotId || null,
        serialId: line.serialId || null
      }).session(session);

      // Balance guaranteed to exist from phase 1 check
      const beforeQty = balance!.onHand;
      balance!.onHand -= line.quantity;
      await balance!.save({ session });

      const ledger = new StockLedger({
        transactionId: `DEL-TXN-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        operation: 'DELIVERY',
        productId: line.productId,
        lotId: line.lotId,
        serialId: line.serialId,
        sourceLocationId: locationId,
        quantity: line.quantity,
        beforeQuantity: beforeQty,
        afterQuantity: balance!.onHand,
        referenceType: 'DeliveryOrder',
        referenceId: delivery._id,
        reason: `Delivery validated: ${delivery.deliveryNumber}`,
        performedBy: req.user!.userId
      });
      await ledger.save({ session });

      line.pickedQuantity = line.quantity;
    }

    delivery.status = 'DONE';
    delivery.completedAt = new Date();
    await delivery.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await DeliveryOrder.findById(delivery._id)
      .populate('lines.productId', 'name sku');
    res.status(200).json({ message: 'Delivery validated. Stock deducted.', delivery: populated });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message || 'Unable to complete the operation. Please try again.' });
  }
};

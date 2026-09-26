import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Transfer } from '../models/transfer';
import { InventoryBalance, StockLedger } from '../models/inventory';

// Create a new transfer
export const createTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceLocationId, destinationLocationId, items, notes } = req.body;
    
    // Generate a simple unique transfer number
    const count = await Transfer.countDocuments();
    const transferNumber = `TRF-${(count + 1000).toString()}`;
    
    const transfer = new Transfer({
      transferNumber,
      sourceLocationId,
      destinationLocationId,
      items,
      notes,
      createdBy: (req.user as any)?.userId || (req.user as any)?._id || (req.user as any)?.id,
      status: 'Draft'
    });
    
    await transfer.save();
    res.status(201).json(transfer);
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  }
};

// Get all transfers
export const getTransfers = async (req: Request, res: Response): Promise<void> => {
  try {
    const transfers = await Transfer.find()
      .populate('sourceLocationId', 'name')
      .populate('destinationLocationId', 'name')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
};

// Get single transfer by ID
export const getTransferById = async (req: Request, res: Response): Promise<void> => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('sourceLocationId', 'name')
      .populate('destinationLocationId', 'name')
      .populate('createdBy', 'firstName lastName')
      .populate('completedBy', 'firstName lastName')
      .populate('items.productId', 'name sku');
      
    if (!transfer) {
      res.status(404).json({ error: 'Transfer not found' });
      return;
    }
    
    res.json(transfer);
  } catch (error) {
    console.error('Error fetching transfer:', error);
    res.status(500).json({ error: 'Failed to fetch transfer details' });
  }
};

// Execute transfer (moves the stock)
export const executeTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    
    if (!transfer) {
      res.status(404).json({ error: 'Transfer not found' });
      return;
    }
    
    if (transfer.status === 'Completed') {
      res.status(400).json({ error: 'Transfer is already completed' });
      return;
    }
    
    if (transfer.status === 'Cancelled') {
      res.status(400).json({ error: 'Cannot execute a cancelled transfer' });
      return;
    }

    // Process each item in the transfer
    for (const item of transfer.items) {
      // Find source balance
      const sourceQuery: any = { 
        productId: item.productId, 
        locationId: transfer.sourceLocationId 
      };
      if (item.lotId) sourceQuery.lotId = item.lotId;
      
      const sourceBalance = await InventoryBalance.findOne(sourceQuery);
      
      if (!sourceBalance || sourceBalance.available < item.quantity) {
        res.status(400).json({ 
          error: `Insufficient stock at source location for product ID ${item.productId}` 
        });
        return;
      }
      
      // Decrease source balance
      const sourceBeforeQuantity = sourceBalance.onHand;
      sourceBalance.onHand -= item.quantity;
      // .pre('save') handles available balance recalculation
      await sourceBalance.save();
      
      // Find or create destination balance
      const destQuery: any = {
        productId: item.productId,
        locationId: transfer.destinationLocationId
      };
      if (item.lotId) destQuery.lotId = item.lotId;
      
      let destBalance = await InventoryBalance.findOne(destQuery);
      let destBeforeQuantity = 0;
      
      if (destBalance) {
        destBeforeQuantity = destBalance.onHand;
        destBalance.onHand += item.quantity;
        await destBalance.save();
      } else {
        // Need the warehouseId of the destination location
        // Let's populate it or fetch the location
        const destLocation = await mongoose.model('Location').findById(transfer.destinationLocationId);
        
        destBalance = new InventoryBalance({
          productId: item.productId,
          warehouseId: destLocation.warehouseId,
          locationId: transfer.destinationLocationId,
          lotId: item.lotId,
          onHand: item.quantity
        });
        await destBalance.save();
      }
      
      const userId = (req.user as any)?._id || (req.user as any)?.id;
      
      // Create Ledger entry for source (deduction)
      const ledgerSource = new StockLedger({
        transactionId: `TRF-SRC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        operation: 'TRANSFER',
        productId: item.productId,
        lotId: item.lotId,
        sourceLocationId: transfer.sourceLocationId,
        destinationLocationId: transfer.destinationLocationId,
        quantity: -item.quantity,
        beforeQuantity: sourceBeforeQuantity,
        afterQuantity: sourceBalance.onHand,
        referenceType: 'Transfer',
        referenceId: transfer._id,
        reason: transfer.notes || 'Internal Transfer Execution',
        performedBy: userId
      });
      await ledgerSource.save();
      
      // Create Ledger entry for destination (addition)
      const ledgerDest = new StockLedger({
        transactionId: `TRF-DST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        operation: 'TRANSFER',
        productId: item.productId,
        lotId: item.lotId,
        sourceLocationId: transfer.sourceLocationId,
        destinationLocationId: transfer.destinationLocationId,
        quantity: item.quantity,
        beforeQuantity: destBeforeQuantity,
        afterQuantity: destBalance.onHand,
        referenceType: 'Transfer',
        referenceId: transfer._id,
        reason: transfer.notes || 'Internal Transfer Execution',
        performedBy: userId
      });
      await ledgerDest.save();
    }
    
    // Mark transfer as completed
    transfer.status = 'Completed';
    transfer.completedBy = ((req.user as any)?._id || (req.user as any)?.id) as any;
    await transfer.save();
    
    res.json(transfer);
  } catch (error) {
    console.error('Error executing transfer:', error);
    res.status(500).json({ error: 'Failed to execute transfer' });
  }
};

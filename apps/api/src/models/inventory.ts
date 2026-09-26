import mongoose from 'mongoose';

// --- INVENTORY BALANCE ---
const inventoryBalanceSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  
  lotId: { type: String },
  serialId: { type: String },
  
  onHand: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
  available: { type: Number, default: 0 },
  damaged: { type: Number, default: 0 },
  quarantine: { type: Number, default: 0 }
}, { timestamps: true });

inventoryBalanceSchema.index({ 
  productId: 1, 
  locationId: 1, 
  lotId: 1, 
  serialId: 1 
}, { unique: true });

inventoryBalanceSchema.pre('save', async function() {
  this.available = (this.onHand || 0) - (this.reserved || 0) - (this.damaged || 0) - (this.quarantine || 0);
});

export const InventoryBalance = mongoose.model('InventoryBalance', inventoryBalanceSchema);

// --- STOCK LEDGER ---
const stockLedgerSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true }, 
  operation: { 
    type: String, 
    enum: ['RECEIPT', 'PUTAWAY', 'TRANSFER', 'RESERVATION', 'RELEASE_RESERVATION', 'PICK', 'PACK', 'SHIP', 'RETURN', 'ADJUSTMENT', 'SCRAP', 'QUARANTINE'],
    required: true 
  },
  
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  lotId: { type: String },
  serialId: { type: String },
  
  sourceLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  destinationLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  
  quantity: { type: Number, required: true },
  beforeQuantity: { type: Number, required: true },
  afterQuantity: { type: Number, required: true },
  
  referenceType: { type: String }, 
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  
  reason: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const StockLedger = mongoose.model('StockLedger', stockLedgerSchema);

// --- ADJUSTMENT --- (Kept for compatibility and refactored logic)
const adjustmentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  
  lotId: { type: String },
  serialId: { type: String },
  
  systemQuantity: { type: Number, required: true },
  countedQuantity: { type: Number, required: true },
  difference: { type: Number, required: true },
  
  reason: { type: String, required: true },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Completed', 'Cancelled'], default: 'Completed' }
}, { timestamps: true });

export const Adjustment = mongoose.model('Adjustment', adjustmentSchema);

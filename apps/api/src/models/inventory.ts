import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String },
  description: { type: String },
}, { timestamps: true });
export const Product = mongoose.model('Product', productSchema);

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
}, { timestamps: true });
export const Warehouse = mongoose.model('Warehouse', warehouseSchema);

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
}, { timestamps: true });
export const Location = mongoose.model('Location', locationSchema);

const stockSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  quantity: { type: Number, required: true, default: 0 },
}, { timestamps: true });
// Ensure one stock record per product-location
stockSchema.index({ productId: 1, locationId: 1 }, { unique: true });
export const Stock = mongoose.model('Stock', stockSchema);

const stockLedgerSchema = new mongoose.Schema({
  operation: { type: String, required: true }, // e.g., 'ADJUSTMENT'
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  previousQuantity: { type: Number, required: true },
  change: { type: Number, required: true },
  newQuantity: { type: Number, required: true },
  reason: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
export const StockLedger = mongoose.model('StockLedger', stockLedgerSchema);

const adjustmentSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  systemQuantity: { type: Number, required: true },
  countedQuantity: { type: Number, required: true },
  difference: { type: Number, required: true },
  reason: { type: String, required: true },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Completed', 'Cancelled'], default: 'Completed' }
}, { timestamps: true });
export const Adjustment = mongoose.model('Adjustment', adjustmentSchema);

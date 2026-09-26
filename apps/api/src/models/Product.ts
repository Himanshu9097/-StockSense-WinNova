import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  uom: { type: String, default: 'PCS' }, // Unit of Measure
  weight: { type: Number, default: 0 }, // in kg
  length: { type: Number, default: 0 },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  reorderPoint: { type: Number, default: 0 },
  safetyStock: { type: Number, default: 0 },
  leadTime: { type: Number, default: 0 }, // in days
  
  // Tracking rules
  trackLot: { type: Boolean, default: false },
  trackSerial: { type: Boolean, default: false },
  trackExpiry: { type: Boolean, default: false },
  
  // Handling properties
  perishable: { type: Boolean, default: false },
  fragile: { type: Boolean, default: false },
  highValue: { type: Boolean, default: false },
  
  // Storage constraints (e.g. 'COLD_STORAGE', 'HAZARDOUS')
  storageConstraints: [{ type: String }],
  
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);

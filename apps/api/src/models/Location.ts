import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });
export const Warehouse = mongoose.model('Warehouse', warehouseSchema);

const zoneSchema = new mongoose.Schema({
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  zoneType: { type: String, enum: ['RECEIVING', 'STORAGE', 'PICKING', 'PACKING', 'DISPATCH', 'RETURNS', 'QUARANTINE'], default: 'STORAGE' }
}, { timestamps: true });
export const Zone = mongoose.model('Zone', zoneSchema);

const locationSchema = new mongoose.Schema({
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true },
  code: { type: String, required: true, unique: true }, // e.g. WH1-Z2-A04-R02-B03
  type: { type: String, enum: ['AISLE', 'RACK', 'SHELF', 'BIN', 'FLOOR'], required: true },
  parentLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }, // For nesting Rack in Aisle, etc.
  capacity: { type: Number, default: 0 }, // max items
  weightLimit: { type: Number, default: 0 }, // in kg
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'], default: 'ACTIVE' }
}, { timestamps: true });
export const Location = mongoose.model('Location', locationSchema);

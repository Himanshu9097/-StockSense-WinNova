import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function NewAdjustment() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [systemStock, setSystemStock] = useState<number | null>(null);
  const [physicalCount, setPhysicalCount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchLocations(selectedWarehouse);
    } else {
      setLocations([]);
      setSelectedLocation('');
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    if (selectedProduct && selectedWarehouse && selectedLocation) {
      fetchSystemStock();
    } else {
      setSystemStock(null);
    }
  }, [selectedProduct, selectedWarehouse, selectedLocation]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/inventory/products', { withCredentials: true });
      setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/inventory/warehouses', { withCredentials: true });
      setWarehouses(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchLocations = async (warehouseId: string) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/inventory/locations?warehouseId=${warehouseId}`, { withCredentials: true });
      setLocations(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchSystemStock = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/inventory/stock?productId=${selectedProduct}&warehouseId=${selectedWarehouse}&locationId=${selectedLocation}`, { withCredentials: true });
      setSystemStock(res.data.quantity);
    } catch (err) { console.error(err); }
  };

  const difference = (systemStock !== null && physicalCount !== '') ? parseInt(physicalCount) - systemStock : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedWarehouse || !selectedLocation || physicalCount === '' || !reason) {
      setError('Please fill in all required fields.');
      return;
    }
    if (difference === 0) {
      setError('No adjustment required. Physical count matches system stock.');
      return;
    }
    setError('');
    setShowConfirm(true);
  };

  const applyAdjustment = async () => {
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/adjustments', {
        productId: selectedProduct,
        warehouseId: selectedWarehouse,
        locationId: selectedLocation,
        countedQuantity: parseInt(physicalCount),
        expectedSystemQuantity: systemStock,
        reason,
        notes
      }, { withCredentials: true });
      
      setToast(`Stock adjusted successfully. Inventory updated from ${systemStock} to ${physicalCount} units.`);
      setTimeout(() => navigate('/adjustments'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to apply adjustment. Please try again.');
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const pName = products.find(p => p._id === selectedProduct)?.name || '';
  const wName = warehouses.find(w => w._id === selectedWarehouse)?.name || '';
  const lName = locations.find(l => l._id === selectedLocation)?.name || '';

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {toast && (
        <div className="fixed top-4 right-4 bg-success text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-fade-in z-50">
          {toast}
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">New Stock Adjustment</h1>
        <p className="text-text-secondary mt-1">Record a physical count and adjust system inventory.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-surface-elevated border border-border p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-6 border-b border-border pb-2">Location Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Warehouse *</label>
              <select 
                value={selectedWarehouse} 
                onChange={e => setSelectedWarehouse(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none"
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Location *</label>
              <select 
                value={selectedLocation} 
                onChange={e => setSelectedLocation(e.target.value)}
                disabled={!selectedWarehouse}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none disabled:opacity-50"
              >
                <option value="">Select Location</option>
                {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-surface-elevated border border-border p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-6 border-b border-border pb-2">Product & Count</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Product *</label>
              <select 
                value={selectedProduct} 
                onChange={e => setSelectedProduct(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none"
              >
                <option value="">Select Product</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">System Stock</label>
              <input 
                type="text" 
                readOnly
                value={systemStock !== null ? `${systemStock} units` : 'Select product & location'} 
                className="w-full bg-surface/50 text-text-secondary border border-border rounded-lg px-4 py-2 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Physical Count *</label>
              <input 
                type="number" 
                min="0"
                value={physicalCount} 
                onChange={e => setPhysicalCount(e.target.value)}
                placeholder="Actual counted quantity"
                className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none"
              />
            </div>
            
            <div className="flex flex-col justify-end">
              {difference !== null && (
                <div className={`px-4 py-2 rounded-lg font-medium border ${difference > 0 ? 'bg-success/10 text-success border-success/20' : difference < 0 ? 'bg-danger/10 text-danger border-danger/20' : 'bg-surface text-text-secondary border-border'}`}>
                  Difference: {difference > 0 ? '+' : ''}{difference} units
                  {difference === 0 && ' — No adjustment required'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface-elevated border border-border p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-6 border-b border-border pb-2">Reason & Notes</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Reason *</label>
              <select 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none"
              >
                <option value="">Select Reason</option>
                <option value="Damaged Stock">Damaged Stock</option>
                <option value="Missing Stock">Missing Stock</option>
                <option value="Found Stock">Found Stock</option>
                <option value="Counting Error">Counting Error</option>
                <option value="Data Entry Error">Data Entry Error</option>
                <option value="Expired Stock">Expired Stock</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Notes</label>
              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional details..."
                className="w-full bg-surface border border-border rounded-lg px-4 py-2 focus:border-primary focus:outline-none resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {error && <div className="text-danger font-medium">{error}</div>}

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 rounded-lg border border-border hover:bg-surface transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={difference === null || difference === 0} className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            Review Adjustment
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-elevated max-w-md w-full rounded-2xl shadow-xl p-6 border border-border">
            <h3 className="text-xl font-bold mb-4">Confirm Adjustment</h3>
            <p className="text-text-secondary mb-6">Are you sure you want to adjust inventory for {pName} from {systemStock} units to {physicalCount} units?</p>
            
            <div className="bg-surface p-4 rounded-xl border border-border mb-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-text-secondary">Product:</span> <span className="font-medium">{pName}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Location:</span> <span className="font-medium">{wName} / {lName}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">System Stock:</span> <span className="font-medium">{systemStock}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Physical Count:</span> <span className="font-medium">{physicalCount}</span></div>
              <div className="flex justify-between border-t border-border pt-3 mt-3">
                <span className="text-text-secondary">Difference:</span> 
                <span className={`font-bold ${difference! > 0 ? 'text-success' : 'text-danger'}`}>
                  {difference! > 0 ? '+' : ''}{difference}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-text-secondary">New Stock:</span> <span className="font-bold">{physicalCount}</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Reason:</span> <span className="font-medium">{reason}</span></div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-border hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={applyAdjustment}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Processing...' : 'Confirm Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

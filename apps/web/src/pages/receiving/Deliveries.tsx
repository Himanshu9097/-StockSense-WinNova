import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api';
import { Truck, Search, Plus, Package, Clock, CheckCircle2, X, Trash2, Loader2, AlertCircle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeliveryLine {
  productId: string;
  locationId: string;
  quantity: number;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Deliveries() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  const { data: deliveries = [], isLoading, refetch } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const res = await api.get('/deliveries');
      return res.data;
    }
  });

  const filteredDeliveries = deliveries.filter((d: any) =>
    d.deliveryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.customer && d.customer.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden relative">
      {/* Header section with search and actions */}
      <div className="p-8 border-b border-md-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Delivery Orders</h2>
          <p className="text-md-surface-variant mt-1">Manage outbound shipments and stock dispatch</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-md-surface-variant group-focus-within:text-md-primary transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search deliveries or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 bg-md-surface-container-low rounded-full py-4 pl-14 pr-6 text-md-on-background placeholder:text-md-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:bg-white transition-all duration-300 shadow-sm"
            />
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-8 py-4 bg-md-primary text-md-on-primary font-bold rounded-full shadow-md hover:shadow-lg hover:bg-md-primary/90 active:scale-95 transition-all duration-300">
            <Plus className="w-5 h-5" />
            New Delivery
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-md-primary"></div>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-md-surface-variant">
            <div className="w-24 h-24 bg-md-surface-container-low rounded-full flex items-center justify-center mb-6">
              <Truck className="w-12 h-12 text-md-outline" />
            </div>
            <p className="text-xl font-medium text-md-on-surface">No deliveries found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeliveries.map((delivery: any) => (
              <DeliveryCard key={delivery._id} delivery={delivery} onClick={() => setSelectedDelivery(delivery)} />
            ))}
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateDeliveryModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => { setIsCreateOpen(false); refetch(); }}
        />
      )}

      {selectedDelivery && (
        <DeliveryDetailModal
          deliveryId={selectedDelivery._id}
          onClose={() => setSelectedDelivery(null)}
          onSuccess={() => { setSelectedDelivery(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ─── Delivery Card ────────────────────────────────────────────────────────────

function DeliveryCard({ delivery, onClick }: { delivery: any; onClick: () => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':      return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'WAITING':    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'READY':      return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DONE':       return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':  return 'bg-red-100 text-red-800 border-red-200';
      default:           return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const Icon = delivery.status === 'DONE' ? CheckCircle2 : Clock;

  return (
    <div
      onClick={onClick}
      className="bg-md-surface-container-low rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer border border-transparent hover:border-md-primary/20 flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div className="w-14 h-14 bg-md-primary/10 text-md-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner shrink-0">
          <Truck className="w-6 h-6" />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(delivery.status)}`}>
          {delivery.status}
        </span>
      </div>

      <h3 className="text-2xl font-bold text-md-on-background tracking-tight">{delivery.deliveryNumber}</h3>
      <p className="text-md-surface-variant font-medium mt-1 truncate">{delivery.customer || 'Walk-in Customer'}</p>

      <div className="mt-auto pt-6 border-t border-md-outline/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-md-surface-variant">
          <Package className="w-4 h-4" />
          <span>{delivery.lines?.length || 0} Lines</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-md-surface-variant">
          <Icon className="w-4 h-4" />
          <span>{new Date(delivery.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Create Delivery Modal ────────────────────────────────────────────────────

function CreateDeliveryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [customer, setCustomer] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [lines, setLines] = useState<DeliveryLine[]>([{ productId: '', locationId: '', quantity: 1 }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => (await api.get('/inventory/warehouses')).data
  });
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => (await api.get('/inventory/locations')).data
  });
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/inventory/products')).data
  });

  const addLine = () => setLines([...lines, { productId: '', locationId: '', quantity: 1 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof DeliveryLine, value: any) => {
    setLines(lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const submit = async (draft: boolean) => {
    setError('');
    if (!warehouseId) { setError('Please select a warehouse.'); return; }
    if (lines.some(l => !l.productId || l.quantity < 1)) {
      setError('All lines must have a product and quantity ≥ 1.'); return;
    }
    setLoading(true);
    try {
      await api.post('/deliveries', { warehouseId, locationId: locationId || undefined, customer, reference, notes, lines, draft });
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create delivery.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-md-surface rounded-[32px] w-full max-w-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-md-on-background">New Delivery Order</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-md-surface-container transition-colors">
            <X className="w-5 h-5 text-md-surface-variant" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Warehouse */}
          <div>
            <label className="block text-sm font-medium text-md-surface-variant mb-1">Warehouse *</label>
            <select
              value={warehouseId}
              onChange={e => setWarehouseId(e.target.value)}
              className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3 text-md-on-background focus:outline-none focus:ring-2 focus:ring-md-primary/50">
              <option value="">Select warehouse</option>
              {warehouses.map((w: any) => <option key={w._id} value={w._id}>{w.name}</option>)}
            </select>
          </div>

          {/* Default Source Location */}
          <div>
            <label className="block text-sm font-medium text-md-surface-variant mb-1">Default Source Location</label>
            <select
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3 text-md-on-background focus:outline-none focus:ring-2 focus:ring-md-primary/50">
              <option value="">Select location (optional)</option>
              {locations.map((l: any) => <option key={l._id} value={l._id}>{l.code} — {l.type}</option>)}
            </select>
          </div>

          {/* Customer & Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-md-surface-variant mb-1">Customer</label>
              <input
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                placeholder="Customer name"
                className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3 text-md-on-background focus:outline-none focus:ring-2 focus:ring-md-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-md-surface-variant mb-1">SO Reference</label>
              <input
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="SO-12345"
                className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3 text-md-on-background focus:outline-none focus:ring-2 focus:ring-md-primary/50"
              />
            </div>
          </div>

          {/* Lines */}
          <div>
            <label className="block text-sm font-medium text-md-surface-variant mb-2">Product Lines *</label>
            <div className="space-y-3">
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-start">
                  <select
                    value={line.productId}
                    onChange={e => updateLine(i, 'productId', e.target.value)}
                    className="bg-md-surface-container-low rounded-2xl px-3 py-3 text-sm text-md-on-background focus:outline-none focus:ring-2 focus:ring-md-primary/50">
                    <option value="">Select product</option>
                    {products.map((p: any) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                  </select>
                  <select
                    value={line.locationId}
                    onChange={e => updateLine(i, 'locationId', e.target.value)}
                    className="bg-md-surface-container-low rounded-2xl px-3 py-3 text-sm text-md-on-background focus:outline-none focus:ring-2 focus:ring-md-primary/50">
                    <option value="">Location (uses default)</option>
                    {locations.map((l: any) => <option key={l._id} value={l._id}>{l.code}</option>)}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={e => updateLine(i, 'quantity', parseInt(e.target.value) || 1)}
                    className="w-20 bg-md-surface-container-low rounded-2xl px-3 py-3 text-sm text-md-on-background focus:outline-none focus:ring-2 focus:ring-md-primary/50"
                  />
                  <button onClick={() => removeLine(i)} disabled={lines.length === 1} className="p-3 text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addLine} className="mt-3 text-sm font-medium text-md-primary hover:underline flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Line
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-md-surface-variant mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Internal notes..."
              className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3 text-md-on-background focus:outline-none focus:ring-2 focus:ring-md-primary/50 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => submit(true)}
            disabled={loading}
            className="flex-1 py-4 border border-md-outline/30 text-md-on-background font-medium rounded-full hover:bg-md-surface-container transition-all duration-200 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save as Draft'}
          </button>
          <button
            onClick={() => submit(false)}
            disabled={loading}
            className="flex-1 py-4 bg-md-primary text-md-on-primary font-bold rounded-full hover:bg-md-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Delivery'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delivery Detail + Validate Modal ────────────────────────────────────────

function DeliveryDetailModal({ deliveryId, onClose, onSuccess }: { deliveryId: string; onClose: () => void; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', deliveryId],
    queryFn: async () => (await api.get(`/deliveries/${deliveryId}`)).data
  });

  const validateMutation = useMutation({
    mutationFn: async () => api.post(`/deliveries/${deliveryId}/validate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      onSuccess();
    },
    onError: (e: any) => setError(e.response?.data?.error || 'Validation failed.')
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':      return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'WAITING':    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'READY':      return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DONE':       return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':  return 'bg-red-100 text-red-800 border-red-200';
      default:           return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canValidate = delivery && delivery.status !== 'DONE' && delivery.status !== 'CANCELLED';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-md-surface rounded-[32px] w-full max-w-xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-md-on-background">Delivery Details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-md-surface-container transition-colors">
            <X className="w-5 h-5 text-md-surface-variant" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-md-primary" />
          </div>
        ) : delivery ? (
          <>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Header info */}
            <div className="bg-md-surface-container-low rounded-2xl p-5 mb-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-md-on-background">{delivery.deliveryNumber}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(delivery.status)}`}>
                  {delivery.status}
                </span>
              </div>
              {delivery.customer && <p className="text-sm text-md-surface-variant">Customer: <span className="text-md-on-background">{delivery.customer}</span></p>}
              {delivery.reference && <p className="text-sm text-md-surface-variant">Reference: <span className="text-md-on-background">{delivery.reference}</span></p>}
              <p className="text-sm text-md-surface-variant">Created: <span className="text-md-on-background">{new Date(delivery.createdAt).toLocaleString()}</span></p>
              {delivery.completedAt && <p className="text-sm text-md-surface-variant">Completed: <span className="text-md-on-background">{new Date(delivery.completedAt).toLocaleString()}</span></p>}
            </div>

            {/* Lines */}
            <div>
              <p className="text-sm font-semibold text-md-surface-variant mb-3">Product Lines ({delivery.lines?.length})</p>
              <div className="space-y-2">
                {delivery.lines?.map((line: any, i: number) => (
                  <div key={i} className="bg-md-surface-container-low rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-md-on-background text-sm">{line.productId?.name || 'Unknown Product'}</p>
                      <p className="text-xs text-md-surface-variant">{line.productId?.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-md-on-background">Qty: {line.quantity}</p>
                      {line.pickedQuantity > 0 && (
                        <p className="text-xs text-green-600 font-medium">Picked: {line.pickedQuantity}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {canValidate && (
              <div className="mt-6 pt-4 border-t border-md-outline/10">
                <button
                  onClick={() => { setError(''); validateMutation.mutate(); }}
                  disabled={validateMutation.isPending}
                  className="w-full py-4 bg-md-primary text-md-on-primary font-bold rounded-full hover:bg-md-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                  {validateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                  Validate Delivery & Deduct Stock
                </button>
              </div>
            )}

            {delivery.status === 'DONE' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3 text-green-700 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                This delivery has been validated and stock has been deducted.
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-md-surface-variant py-8">Delivery not found.</p>
        )}
      </div>
    </div>
  );
}

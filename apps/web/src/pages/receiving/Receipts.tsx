import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api';
import { 
  ArrowDownToLine, 
  Search, 
  Plus, 
  Package, 
  Clock, 
  CheckCircle2, 
  X, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Printer,
  Building2,
  MapPin,
  Ban,
  Check,
  Tag
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReceiptLineInput {
  productId: string;
  locationId: string;
  expectedQuantity: number;
  lotId?: string;
  serialId?: string;
}

type StatusFilter = 'ALL' | 'DRAFT' | 'EXPECTED' | 'RECEIVING' | 'COMPLETED' | 'CANCELLED';

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Receipts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const { data: receipts = [], isLoading, refetch } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const res = await api.get('/receiving');
      return res.data;
    }
  });

  // Calculate counts for filters
  const counts = {
    ALL: receipts.length,
    DRAFT: receipts.filter((r: any) => r.status === 'DRAFT').length,
    EXPECTED: receipts.filter((r: any) => r.status === 'EXPECTED' || r.status === 'ARRIVED').length,
    RECEIVING: receipts.filter((r: any) => r.status === 'RECEIVING' || r.status === 'PUTAWAY').length,
    COMPLETED: receipts.filter((r: any) => r.status === 'COMPLETED').length,
    CANCELLED: receipts.filter((r: any) => r.status === 'CANCELLED').length,
  };

  const filteredReceipts = receipts.filter((r: any) => {
    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'EXPECTED' && !(r.status === 'EXPECTED' || r.status === 'ARRIVED')) return false;
      else if (statusFilter === 'RECEIVING' && !(r.status === 'RECEIVING' || r.status === 'PUTAWAY')) return false;
      else if (statusFilter !== 'EXPECTED' && statusFilter !== 'RECEIVING' && r.status !== statusFilter) return false;
    }

    // Search query
    const term = searchTerm.toLowerCase();
    const matchNumber = r.receiptNumber?.toLowerCase().includes(term);
    const matchSupplier = r.supplier && r.supplier.toLowerCase().includes(term);
    const matchRef = r.reference && r.reference.toLowerCase().includes(term);
    const matchWarehouse = r.warehouseId?.name && r.warehouseId.name.toLowerCase().includes(term);

    return matchNumber || matchSupplier || matchRef || matchWarehouse;
  });

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden relative">
      {/* Header section with search, tabs, and actions */}
      <div className="p-8 border-b border-md-outline/10 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-md-on-background tracking-tight">Inbound Receipts</h2>
            <p className="text-md-surface-variant mt-1">Manage vendor shipments, receiving tasks, and stock intake</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-md-surface-variant group-focus-within:text-md-primary transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search receipts, suppliers, POs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 bg-md-surface-container-low rounded-full py-4 pl-14 pr-6 text-md-on-background placeholder:text-md-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:bg-white transition-all duration-300 shadow-sm"
              />
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-8 py-4 bg-md-primary text-md-on-primary font-bold rounded-full shadow-md hover:shadow-lg hover:bg-md-primary/90 active:scale-95 transition-all duration-300 shrink-0">
              <Plus className="w-5 h-5" />
              New Receipt
            </button>
          </div>
        </div>

        {/* Filter status tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(['ALL', 'DRAFT', 'EXPECTED', 'RECEIVING', 'COMPLETED', 'CANCELLED'] as StatusFilter[]).map((tab) => {
            const isActive = statusFilter === tab;
            const count = counts[tab];
            const labelMap: Record<StatusFilter, string> = {
              ALL: 'All Receipts',
              DRAFT: 'Draft',
              EXPECTED: 'Expected',
              RECEIVING: 'Receiving',
              COMPLETED: 'Completed',
              CANCELLED: 'Cancelled'
            };
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-md-secondary-container text-md-on-secondary-container shadow-sm'
                    : 'bg-md-surface-container-low text-md-surface-variant hover:bg-md-surface-container hover:text-md-on-background'
                }`}>
                <span>{labelMap[tab]}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-md-primary text-md-on-primary' : 'bg-md-outline/10 text-md-surface-variant'
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-md-primary"></div>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-md-surface-variant py-16">
            <div className="w-24 h-24 bg-md-surface-container-low rounded-full flex items-center justify-center mb-6 shadow-inner">
              <ArrowDownToLine className="w-12 h-12 text-md-outline" />
            </div>
            <p className="text-xl font-bold text-md-on-surface">No receipts found</p>
            <p className="text-sm text-md-surface-variant mt-1">
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search terms or filter selection.'
                : 'Create your first inbound receipt to get started.'}
            </p>
            {(searchTerm || statusFilter !== 'ALL') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                className="mt-4 px-6 py-2 text-sm font-semibold text-md-primary hover:underline">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReceipts.map((receipt: any) => (
              <ReceiptCard key={receipt._id} receipt={receipt} onClick={() => setSelectedReceipt(receipt)} />
            ))}
          </div>
        )}
      </div>

      {isCreateOpen && (
        <CreateReceiptModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => { setIsCreateOpen(false); refetch(); }}
        />
      )}

      {selectedReceipt && (
        <ReceiptDetailModal
          receiptId={selectedReceipt._id}
          onClose={() => setSelectedReceipt(null)}
          onSuccess={() => { setSelectedReceipt(null); refetch(); }}
        />
      )}
    </div>
  );
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getStatusStyle(status: string) {
  switch (status) {
    case 'DRAFT':     return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'EXPECTED':  return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'ARRIVED':   return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'RECEIVING': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PUTAWAY':   return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'CANCELLED': return 'bg-rose-100 text-rose-800 border-rose-200';
    default:          return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// ─── Receipt Card ─────────────────────────────────────────────────────────────

function ReceiptCard({ receipt, onClick }: { receipt: any; onClick: () => void }) {
  const Icon = receipt.status === 'COMPLETED' ? CheckCircle2 : Clock;
  const totalUnits = receipt.lines?.reduce((sum: number, l: any) => sum + (l.expectedQuantity || 0), 0) || 0;
  const totalReceived = receipt.lines?.reduce((sum: number, l: any) => sum + (l.receivedQuantity || 0), 0) || 0;

  return (
    <div
      onClick={onClick}
      className="bg-md-surface-container-low rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer border border-transparent hover:border-md-primary/20 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 bg-md-primary/10 text-md-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner shrink-0">
            <ArrowDownToLine className="w-6 h-6" />
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(receipt.status)}`}>
            {receipt.status}
          </span>
        </div>

        <h3 className="text-xl font-bold text-md-on-background tracking-tight">{receipt.receiptNumber}</h3>
        <p className="text-md-surface-variant font-medium mt-1 truncate">
          {receipt.supplier || 'No Vendor / Unknown'}
        </p>

        {receipt.reference && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-md-surface-container rounded-lg text-md-surface-variant">
            <Tag className="w-3 h-3" />
            <span>PO: {receipt.reference}</span>
          </div>
        )}

        {receipt.warehouseId?.name && (
          <p className="text-xs text-md-surface-variant/80 mt-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span className="truncate">{receipt.warehouseId.name}</span>
          </p>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-md-outline/10 flex items-center justify-between text-xs font-medium text-md-surface-variant">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          <span>{receipt.lines?.length || 0} Lines ({receipt.status === 'COMPLETED' ? totalReceived : totalUnits} units)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" />
          <span>{new Date(receipt.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Create Receipt Modal ─────────────────────────────────────────────────────

function CreateReceiptModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [supplier, setSupplier] = useState('');
  const [reference, setReference] = useState('');
  const [expectedArrivalDate, setExpectedArrivalDate] = useState('');
  const [notes, setNotes] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [lines, setLines] = useState<ReceiptLineInput[]>([{ productId: '', locationId: '', expectedQuantity: 1 }]);
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

  // Filter locations for selected warehouse if possible
  const filteredLocations = warehouseId 
    ? locations.filter((loc: any) => !loc.warehouseId || loc.warehouseId === warehouseId || loc.warehouseId?._id === warehouseId)
    : locations;

  const addLine = () => setLines([...lines, { productId: '', locationId: '', expectedQuantity: 1 }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof ReceiptLineInput, value: any) => {
    setLines(lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const submit = async (draft: boolean) => {
    setError('');
    if (!warehouseId) { setError('Please select a warehouse.'); return; }
    if (lines.length === 0 || lines.some(l => !l.productId || l.expectedQuantity < 1)) {
      setError('All lines must have a valid product and expected quantity ≥ 1.'); return;
    }
    setLoading(true);
    try {
      await api.post('/receiving', { 
        warehouseId, 
        locationId: locationId || undefined, 
        supplier, 
        reference, 
        expectedArrivalDate: expectedArrivalDate || undefined,
        notes, 
        lines, 
        draft 
      });
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create receipt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-md-surface rounded-[32px] w-full max-w-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-md-on-background">New Inbound Receipt</h2>
            <p className="text-sm text-md-surface-variant">Log an incoming delivery order from a vendor or transfer</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-md-surface-container transition-colors">
            <X className="w-5 h-5 text-md-surface-variant" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Warehouse & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-md-on-background mb-1">Destination Warehouse *</label>
              <select
                value={warehouseId}
                onChange={e => setWarehouseId(e.target.value)}
                className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3.5 text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50 text-sm font-medium">
                <option value="">Select destination warehouse</option>
                {warehouses.map((w: any) => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-md-on-background mb-1">Default Destination Bay / Bin</label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3.5 text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50 text-sm font-medium">
                <option value="">Default dock/location (optional)</option>
                {filteredLocations.map((l: any) => (
                  <option key={l._id} value={l._id}>
                    {l.code} ({l.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vendor, PO Reference, Expected Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-md-on-background mb-1">Supplier / Vendor</label>
              <input
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="e.g. Acme Supplies Ltd"
                className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3 text-sm text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-md-on-background mb-1">PO / Tracking Reference</label>
              <input
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="e.g. PO-2026-0042"
                className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3 text-sm text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-md-on-background mb-1">Expected Arrival Date</label>
              <input
                type="date"
                value={expectedArrivalDate}
                onChange={e => setExpectedArrivalDate(e.target.value)}
                className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3 text-sm text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50 font-medium"
              />
            </div>
          </div>

          {/* Product Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-md-on-background">Product Lines *</label>
              <span className="text-xs text-md-surface-variant font-medium">{lines.length} items configured</span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {lines.map((line, i) => (
                <div key={i} className="bg-md-surface-container-low rounded-2xl p-3 border border-md-outline/10 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-4">
                    <label className="text-[11px] font-bold text-md-surface-variant uppercase mb-1 block">Product</label>
                    <select
                      value={line.productId}
                      onChange={e => updateLine(i, 'productId', e.target.value)}
                      className="w-full bg-white rounded-xl px-3 py-2 text-xs font-semibold text-md-on-background border border-md-outline/20 focus:outline-none focus:ring-2 focus:ring-md-primary/50">
                      <option value="">Select product</option>
                      {products.map((p: any) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-[11px] font-bold text-md-surface-variant uppercase mb-1 block">Destination Bin</label>
                    <select
                      value={line.locationId}
                      onChange={e => updateLine(i, 'locationId', e.target.value)}
                      className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium text-md-on-background border border-md-outline/20 focus:outline-none focus:ring-2 focus:ring-md-primary/50">
                      <option value="">Uses receipt default</option>
                      {filteredLocations.map((l: any) => (
                        <option key={l._id} value={l._id}>{l.code}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-md-surface-variant uppercase mb-1 block">Expected Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={line.expectedQuantity}
                      onChange={e => updateLine(i, 'expectedQuantity', parseInt(e.target.value) || 1)}
                      className="w-full bg-white rounded-xl px-3 py-2 text-xs font-bold text-md-on-background border border-md-outline/20 focus:outline-none focus:ring-2 focus:ring-md-primary/50"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-bold text-md-surface-variant uppercase mb-1 block">Lot / Serial</label>
                    <input
                      type="text"
                      placeholder="Optional lot #"
                      value={line.lotId || ''}
                      onChange={e => updateLine(i, 'lotId', e.target.value)}
                      className="w-full bg-white rounded-xl px-3 py-2 text-xs font-medium text-md-on-background border border-md-outline/20 focus:outline-none focus:ring-2 focus:ring-md-primary/50"
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-center pt-3 md:pt-4">
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      disabled={lines.length === 1}
                      className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30 transition-colors rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLine}
              className="mt-3 text-sm font-bold text-md-primary hover:text-md-primary/80 flex items-center gap-1.5 transition-colors">
              <Plus className="w-4 h-4" /> Add Another Product Line
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-md-on-background mb-1">Dock Notes & Instructions</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Inspect temperature control packaging upon delivery, notify QA team..."
              className="w-full bg-md-surface-container-low rounded-2xl px-4 py-3 text-sm text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50 resize-none font-medium"
            />
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-4 border-t border-md-outline/10">
          <button
            onClick={() => submit(true)}
            disabled={loading}
            className="flex-1 py-4 border border-md-outline/30 text-md-on-background font-bold rounded-full hover:bg-md-surface-container transition-all duration-200 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save as Draft'}
          </button>
          <button
            onClick={() => submit(false)}
            disabled={loading}
            className="flex-1 py-4 bg-md-primary text-md-on-primary font-bold rounded-full hover:bg-md-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-50 shadow-md flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
              <>
                <Check className="w-5 h-5" />
                Confirm as Expected
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt Detail + Validation Modal ────────────────────────────────────────

function ReceiptDetailModal({ receiptId, onClose, onSuccess }: { receiptId: string; onClose: () => void; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [showPrintSlip, setShowPrintSlip] = useState(false);
  const [lineQuantities, setLineQuantities] = useState<Record<string, number>>({});

  const { data: receipt, isLoading } = useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: async () => {
      const res = await api.get(`/receiving/${receiptId}`);
      const data = res.data;
      // Prepopulate line quantities if not already set
      const initial: Record<string, number> = {};
      data.lines?.forEach((l: any) => {
        initial[l._id] = l.receivedQuantity > 0 ? l.receivedQuantity : l.expectedQuantity;
      });
      setLineQuantities(initial);
      return data;
    }
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      // Build lines payload with user-entered received quantities
      const payloadLines = receipt.lines?.map((l: any) => ({
        _id: l._id,
        productId: l.productId?._id || l.productId,
        receivedQuantity: lineQuantities[l._id] !== undefined ? lineQuantities[l._id] : l.expectedQuantity,
        locationId: l.locationId?._id || l.locationId || receipt.locationId?._id || receipt.locationId,
        lotId: l.lotId,
        serialId: l.serialId
      }));
      return api.post(`/receiving/${receiptId}/validate`, { lines: payloadLines });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', receiptId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-balance'] });
      queryClient.invalidateQueries({ queryKey: ['stock-ledger'] });
      onSuccess();
    },
    onError: (e: any) => setError(e.response?.data?.error || 'Validation failed.')
  });

  const confirmMutation = useMutation({
    mutationFn: async () => api.put(`/receiving/${receiptId}`, { status: 'EXPECTED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', receiptId] });
    },
    onError: (e: any) => setError(e.response?.data?.error || 'Failed to update status.')
  });

  const cancelMutation = useMutation({
    mutationFn: async () => api.post(`/receiving/${receiptId}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipt', receiptId] });
      onSuccess();
    },
    onError: (e: any) => setError(e.response?.data?.error || 'Failed to cancel receipt.')
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/receiving/${receiptId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      onSuccess();
    },
    onError: (e: any) => setError(e.response?.data?.error || 'Failed to delete receipt.')
  });

  const canValidate = receipt && receipt.status !== 'COMPLETED' && receipt.status !== 'CANCELLED';
  const isDraft = receipt?.status === 'DRAFT';
  const isCancelled = receipt?.status === 'CANCELLED';

  const fillAllExpected = () => {
    if (!receipt?.lines) return;
    const next: Record<string, number> = {};
    receipt.lines.forEach((l: any) => {
      next[l._id] = l.expectedQuantity;
    });
    setLineQuantities(next);
  };

  const clearAllReceived = () => {
    if (!receipt?.lines) return;
    const next: Record<string, number> = {};
    receipt.lines.forEach((l: any) => {
      next[l._id] = 0;
    });
    setLineQuantities(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-md-surface rounded-[32px] w-full max-w-3xl p-8 shadow-2xl overflow-y-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-md-primary/10 text-md-primary rounded-full flex items-center justify-center font-bold">
              <ArrowDownToLine className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-md-on-background">
                {receipt?.receiptNumber || 'Receipt Details'}
              </h2>
              <p className="text-xs text-md-surface-variant font-medium">Inbound shipment record & dock validation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-md-surface-container transition-colors">
            <X className="w-5 h-5 text-md-surface-variant" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-md-primary" />
          </div>
        ) : receipt ? (
          <>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Workflow Progress Stepper */}
            <div className="mb-6 p-4 bg-md-surface-container-low rounded-2xl border border-md-outline/10">
              <div className="flex items-center justify-between">
                {[
                  { label: 'Draft', step: 'DRAFT' },
                  { label: 'Expected', step: 'EXPECTED' },
                  { label: 'Receiving', step: 'RECEIVING' },
                  { label: 'Completed', step: 'COMPLETED' },
                ].map((s, idx, arr) => {
                  const stepIndex = ['DRAFT', 'EXPECTED', 'RECEIVING', 'COMPLETED'];
                  const currentIndex = stepIndex.indexOf(receipt.status === 'ARRIVED' ? 'EXPECTED' : receipt.status === 'PUTAWAY' ? 'RECEIVING' : receipt.status);
                  const isPassed = currentIndex >= idx;
                  const isCurrent = currentIndex === idx;

                  return (
                    <div key={s.step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            isCurrent
                              ? 'bg-md-primary text-md-on-primary ring-4 ring-md-primary/20'
                              : isPassed
                              ? 'bg-emerald-600 text-white'
                              : isCancelled
                              ? 'bg-gray-200 text-gray-500'
                              : 'bg-md-surface-container text-md-surface-variant'
                          }`}>
                          {isPassed && !isCurrent ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className={`text-[11px] mt-1 font-semibold ${isCurrent ? 'text-md-primary' : 'text-md-surface-variant'}`}>
                          {s.label}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <div
                          className={`h-1 flex-1 mx-2 rounded-full ${
                            currentIndex > idx ? 'bg-emerald-500' : 'bg-md-outline/10'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Header / Metadata details */}
            <div className="bg-md-surface-container-low rounded-2xl p-5 mb-6 border border-md-outline/10 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-bold text-md-surface-variant uppercase">Status</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(receipt.status)}`}>
                  {receipt.status}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-md-surface-variant uppercase">Supplier</p>
                <p className="text-sm font-semibold text-md-on-background mt-1 truncate">{receipt.supplier || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-md-surface-variant uppercase">PO Reference</p>
                <p className="text-sm font-semibold text-md-on-background mt-1 truncate">{receipt.reference || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-md-surface-variant uppercase">Warehouse</p>
                <p className="text-sm font-semibold text-md-on-background mt-1 truncate">
                  {receipt.warehouseId?.name || 'Main Warehouse'}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-md-surface-variant uppercase">Created By</p>
                <p className="text-sm font-semibold text-md-on-background mt-1 truncate">
                  {receipt.createdBy?.name || 'Operator'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-md-surface-variant uppercase">Created At</p>
                <p className="text-sm font-semibold text-md-on-background mt-1">
                  {new Date(receipt.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-md-surface-variant uppercase">Expected Date</p>
                <p className="text-sm font-semibold text-md-on-background mt-1">
                  {receipt.expectedArrivalDate ? new Date(receipt.expectedArrivalDate).toLocaleDateString() : 'Immediate'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-md-surface-variant uppercase">Completed At</p>
                <p className="text-sm font-semibold text-md-on-background mt-1 truncate">
                  {receipt.completedAt ? new Date(receipt.completedAt).toLocaleString() : 'Pending'}
                </p>
              </div>
            </div>

            {receipt.notes && (
              <div className="mb-6 p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-xs text-amber-900 font-medium">
                <span className="font-bold">Instructions / Notes:</span> {receipt.notes}
              </div>
            )}

            {/* Product Lines Section */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <p className="text-sm font-bold text-md-on-background flex items-center gap-2">
                  <Package className="w-4 h-4 text-md-primary" />
                  Product Intake Lines ({receipt.lines?.length || 0})
                </p>

                {canValidate && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fillAllExpected}
                      type="button"
                      className="text-xs font-semibold px-3 py-1.5 bg-md-primary/10 text-md-primary rounded-full hover:bg-md-primary/20 transition-colors">
                      Set All to Expected
                    </button>
                    <button
                      onClick={clearAllReceived}
                      type="button"
                      className="text-xs font-semibold px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
                      Clear Received
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {receipt.lines?.map((line: any, i: number) => {
                  const currentReceived = lineQuantities[line._id] !== undefined ? lineQuantities[line._id] : (line.receivedQuantity || 0);

                  return (
                    <div
                      key={line._id || i}
                      className="bg-md-surface-container-low rounded-2xl p-4 border border-md-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-md-on-background text-sm truncate">
                            {line.productId?.name || 'Unknown Product'}
                          </p>
                          {line.productId?.sku && (
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-md-surface-container rounded font-bold text-md-surface-variant">
                              {line.productId.sku}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-md-surface-variant font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-md-primary" />
                            Bin: {line.locationId?.code || receipt.locationId?.code || 'Default Inbound'}
                          </span>
                          {line.lotId && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" /> Lot: {line.lotId}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-md-surface-variant uppercase">Expected</p>
                          <p className="text-sm font-bold text-md-on-background">{line.expectedQuantity}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-bold text-md-surface-variant uppercase">Received / Done</p>
                          {canValidate ? (
                            <input
                              type="number"
                              min={0}
                              value={currentReceived}
                              onChange={e => setLineQuantities({
                                ...lineQuantities,
                                [line._id]: parseInt(e.target.value) || 0
                              })}
                              className="w-20 bg-white border border-md-outline/20 rounded-xl px-2.5 py-1 text-sm font-bold text-center text-md-primary focus:outline-none focus:ring-2 focus:ring-md-primary"
                            />
                          ) : (
                            <p className="text-sm font-bold text-emerald-600">
                              {line.receivedQuantity > 0 ? line.receivedQuantity : line.expectedQuantity}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completed state message */}
            {receipt.status === 'COMPLETED' && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm font-semibold">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Receipt validated & stock successfully updated in Inventory balances and Stock Ledger.</span>
                </div>
                <button
                  onClick={() => setShowPrintSlip(true)}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-full text-xs font-bold hover:bg-emerald-800 transition-colors flex items-center gap-1.5 shrink-0 ml-4">
                  <Printer className="w-3.5 h-3.5" />
                  Print Dock Slip
                </button>
              </div>
            )}

            {/* Cancelled state message */}
            {isCancelled && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-semibold">
                <Ban className="w-5 h-5 text-rose-600 shrink-0" />
                <span>This receipt has been cancelled. No inventory adjustments were performed.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-md-outline/10 flex flex-wrap gap-3">
              {isDraft && (
                <button
                  onClick={() => confirmMutation.mutate()}
                  disabled={confirmMutation.isPending}
                  className="py-4 px-6 border border-md-outline/30 text-md-on-background font-bold rounded-full hover:bg-md-surface-container transition-all duration-200 flex items-center justify-center gap-2">
                  {confirmMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirm Order
                </button>
              )}

              {canValidate && (
                <button
                  onClick={() => { setError(''); validateMutation.mutate(); }}
                  disabled={validateMutation.isPending}
                  className="flex-1 py-4 bg-md-primary text-md-on-primary font-bold rounded-full hover:bg-md-primary/90 active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md">
                  {validateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Validate Receipt & Update Stock
                </button>
              )}

              <button
                onClick={() => setShowPrintSlip(true)}
                className="py-4 px-6 bg-md-surface-container-low text-md-on-background font-semibold rounded-full hover:bg-md-surface-container transition-colors flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Receipt Slip
              </button>

              {canValidate && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this inbound receipt?')) {
                      cancelMutation.mutate();
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="py-4 px-6 border border-rose-200 text-rose-600 font-semibold rounded-full hover:bg-rose-50 transition-colors">
                  {cancelMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel Receipt'}
                </button>
              )}

              {(isDraft || isCancelled) && (
                <button
                  onClick={() => {
                    if (confirm('Permanently delete this receipt record?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="py-4 px-4 text-red-500 hover:text-red-700 hover:bg-red-50 font-semibold rounded-full transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Print Slip Modal */}
            {showPrintSlip && (
              <ReceiptSlipModal receipt={receipt} onClose={() => setShowPrintSlip(false)} />
            )}
          </>
        ) : (
          <p className="text-center text-md-surface-variant py-12">Receipt record not found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Printable Receipt Slip Modal ─────────────────────────────────────────────

function ReceiptSlipModal({ receipt, onClose }: { receipt: any; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-gray-900 rounded-[28px] w-full max-w-2xl p-8 shadow-2xl relative">
        <div className="flex items-center justify-between pb-6 border-b border-gray-200">
          <div>
            <h3 className="text-2xl font-black tracking-tight">StockSense Inbound Goods Slip</h3>
            <p className="text-xs text-gray-500">Warehouse Receiving & QC Inspection Document</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-colors flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="py-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="font-bold text-gray-400 uppercase">Receipt #</p>
              <p className="font-black text-base">{receipt.receiptNumber}</p>
            </div>
            <div>
              <p className="font-bold text-gray-400 uppercase">Supplier / Vendor</p>
              <p className="font-bold text-sm">{receipt.supplier || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold text-gray-400 uppercase">PO Reference</p>
              <p className="font-bold text-sm">{receipt.reference || 'N/A'}</p>
            </div>
            <div>
              <p className="font-bold text-gray-400 uppercase">Date</p>
              <p className="font-bold text-sm">{new Date(receipt.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl">
            <div>
              <p className="font-bold text-gray-400 uppercase">Warehouse</p>
              <p className="font-semibold text-gray-800">{receipt.warehouseId?.name || 'Main Warehouse'} ({receipt.warehouseId?.code || 'WH-1'})</p>
            </div>
            <div>
              <p className="font-bold text-gray-400 uppercase">Status</p>
              <p className="font-semibold text-gray-800">{receipt.status}</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2">Item Inspection Table</h4>
            <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Bin Location</th>
                  <th className="p-3 text-right">Expected</th>
                  <th className="p-3 text-right">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {receipt.lines?.map((line: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-3 font-bold">{line.productId?.name || 'Unknown'}</td>
                    <td className="p-3 font-mono text-gray-600">{line.productId?.sku || '-'}</td>
                    <td className="p-3">{line.locationId?.code || receipt.locationId?.code || 'Inbound Dock'}</td>
                    <td className="p-3 text-right font-bold">{line.expectedQuantity}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">
                      {line.receivedQuantity > 0 ? line.receivedQuantity : line.expectedQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-8 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs text-gray-500">
            <div>
              <p className="font-semibold">Receiver Signature:</p>
              <div className="h-10 border-b border-gray-300 mt-2"></div>
            </div>
            <div>
              <p className="font-semibold">QA Inspector Signature:</p>
              <div className="h-10 border-b border-gray-300 mt-2"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

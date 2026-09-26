import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import { ArrowRightLeft, Search, Plus, Filter, MapPin, Package } from 'lucide-react';

export default function Transfers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // In a real app, this would fetch from a /transfers endpoint
  // For MVP, we will just display a static empty state or list
  const { data: transfers = [], isLoading, refetch } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      // Mocking fetch until backend endpoint is ready
      return []; 
    }
  });

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden relative">
      {/* Header section with search and actions */}
      <div className="p-8 border-b border-md-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Stock Transfers</h2>
          <p className="text-md-surface-variant mt-1">Move inventory between locations</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-md-surface-variant group-focus-within:text-md-primary transition-colors duration-200" />
            <input 
              type="text" 
              placeholder="Search transfers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 bg-md-surface-container-low rounded-full py-4 pl-14 pr-6 text-md-on-background placeholder:text-md-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:bg-white transition-all duration-300 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 p-4 bg-md-surface-container-low shadow-sm rounded-full text-md-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-all duration-200 active:scale-95">
            <Filter className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-8 py-4 bg-md-primary text-md-on-primary font-bold rounded-full shadow-md hover:shadow-lg hover:bg-md-primary/90 active:scale-95 transition-all duration-300">
            <Plus className="w-5 h-5" />
            New Transfer
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-md-primary"></div>
          </div>
        ) : transfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-md-surface-variant">
            <div className="w-24 h-24 bg-md-surface-container-low rounded-full flex items-center justify-center mb-6">
              <ArrowRightLeft className="w-12 h-12 text-md-outline" />
            </div>
            <p className="text-xl font-medium text-md-on-surface">No transfers found</p>
            <p className="text-base mt-2">Create a new transfer to move stock</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {transfers.map((transfer: any) => (
              <div key={transfer._id} className="p-6 bg-md-surface-container-low rounded-[32px]">
                {/* Transfer card implementation */}
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && <TransferModal onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); refetch(); }} />}
    </div>
  );
}

function TransferModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    productId: '',
    fromLocationId: '',
    toLocationId: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(false);

  // Fetch products and locations to populate dropdowns
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get('/inventory/products')).data });
  const { data: locations = [] } = useQuery({ queryKey: ['locations'], queryFn: async () => (await api.get('/inventory/locations')).data });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/inventory/transfer', {
        ...formData,
        quantity: parseInt(formData.quantity, 10)
      });
      onSuccess();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to complete transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-md-surface rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-2xl font-bold text-md-on-background mb-6 flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-md-primary" />
          Move Stock
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-md-on-surface mb-1">Product</label>
            <select required value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})} className="w-full bg-md-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-md-primary">
              <option value="">Select a product...</option>
              {products.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-md-on-surface mb-1">From Location</label>
              <select required value={formData.fromLocationId} onChange={e => setFormData({...formData, fromLocationId: e.target.value})} className="w-full bg-md-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-md-primary">
                <option value="">Select source...</option>
                {locations.map((l: any) => (
                  <option key={l._id} value={l._id}>{l.code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-md-on-surface mb-1">To Location</label>
              <select required value={formData.toLocationId} onChange={e => setFormData({...formData, toLocationId: e.target.value})} className="w-full bg-md-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-md-primary">
                <option value="">Select destination...</option>
                {locations.map((l: any) => (
                  <option key={l._id} value={l._id}>{l.code}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-md-on-surface mb-1">Quantity</label>
            <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-md-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-md-primary" />
          </div>
          
          <div className="pt-6 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-full font-bold text-md-on-surface bg-md-surface-container-highest hover:bg-md-outline/10 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 px-4 rounded-full font-bold text-md-on-primary bg-md-primary hover:bg-md-primary/90 transition-colors disabled:opacity-50">
              {loading ? 'Processing...' : 'Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

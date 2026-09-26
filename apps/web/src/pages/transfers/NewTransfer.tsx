import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

export default function NewTransfer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 }
  ]);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', 'list'],
    queryFn: async () => {
      const res = await api.get('/inventory/locations');
      return res.data;
    }
  });

  const { data: sourceBalances = [] } = useQuery({
    queryKey: ['balances', sourceLocationId],
    queryFn: async () => {
      if (!sourceLocationId) return [];
      const res = await api.get(`/inventory/balances?locationId=${sourceLocationId}`);
      return res.data;
    },
    enabled: !!sourceLocationId
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/transfers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      navigate('/transfers');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || error.message || 'An error occurred while saving.');
    }
  });

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceLocationId || !destinationLocationId) return alert('Source and Destination locations are required.');
    if (sourceLocationId === destinationLocationId) return alert('Source and Destination cannot be the same.');
    
    const validItems = items.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) return alert('At least one valid item is required.');

    // Validate quantities against available balances
    for (const item of validItems) {
      const balance = sourceBalances.find((b: any) => b.productId._id === item.productId);
      if (!balance || item.quantity > balance.available) {
        return alert(`Cannot transfer ${item.quantity}. Max available for one or more selected products is lower.`);
      }
    }

    createMutation.mutate({
      sourceLocationId,
      destinationLocationId,
      notes,
      items: validItems
    });
  };

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden">
      {/* Header section */}
      <div className="p-8 border-b border-md-outline/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/transfers')}
            className="p-3 bg-md-surface-container-low rounded-full text-md-surface-variant hover:text-md-primary hover:bg-md-primary/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Draft New Transfer</h2>
            <p className="text-md-surface-variant mt-1">Create an internal stock movement</p>
          </div>
        </div>
        
        <button 
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-8 py-4 bg-md-primary text-md-on-primary font-bold rounded-full shadow-md hover:shadow-lg hover:bg-md-primary/90 active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {createMutation.isPending ? 'Saving...' : 'Save Draft'}
        </button>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto p-8">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-md-surface-container-low p-8 rounded-[32px] shadow-sm border border-md-outline/5">
            <div>
              <label className="block text-sm font-bold text-md-on-surface mb-2">Source Location *</label>
              <select 
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full bg-md-surface-container rounded-2xl py-4 px-5 text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50 transition-all"
                required
              >
                <option value="">Select source location...</option>
                {locations.map((loc: any) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.warehouseId ? `[${loc.warehouseId.code}] ` : ''}{loc.name || loc.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-md-on-surface mb-2">Destination Location *</label>
              <select 
                value={destinationLocationId}
                onChange={(e) => setDestinationLocationId(e.target.value)}
                className="w-full bg-md-surface-container rounded-2xl py-4 px-5 text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50 transition-all"
                required
              >
                <option value="">Select destination location...</option>
                {locations.map((loc: any) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.warehouseId ? `[${loc.warehouseId.code}] ` : ''}{loc.name || loc.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-md-surface-container-low p-8 rounded-[32px] shadow-sm border border-md-outline/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-md-on-background">Items to Transfer</h3>
              <button 
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-md-primary/10 text-md-primary font-bold rounded-full hover:bg-md-primary/20 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-end bg-md-surface-container p-4 rounded-2xl">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-md-surface-variant mb-1 uppercase tracking-wider">Product</label>
                    <select 
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      className="w-full bg-white rounded-xl py-3 px-4 text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50"
                      required
                      disabled={!sourceLocationId}
                    >
                      <option value="">{sourceLocationId ? "Select product..." : "Select source location first"}</option>
                      {sourceBalances.map((b: any) => (
                        <option key={b.productId._id} value={b.productId._id}>
                          {b.productId.name} ({b.productId.sku}) - {b.available} available
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-bold text-md-surface-variant mb-1 uppercase tracking-wider">Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      max={sourceBalances.find((b: any) => b.productId._id === item.productId)?.available || ''}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="w-full bg-white rounded-xl py-3 px-4 text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50"
                      required
                      disabled={!item.productId}
                    />
                  </div>
                  {items.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-3 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-md-surface-container-low p-8 rounded-[32px] shadow-sm border border-md-outline/5">
            <label className="block text-sm font-bold text-md-on-surface mb-2">Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-md-surface-container rounded-2xl py-4 px-5 text-md-on-background border border-md-outline/10 focus:outline-none focus:ring-2 focus:ring-md-primary/50 transition-all resize-none"
              placeholder="Add any instructions or context for this transfer..."
            />
          </div>

        </form>
      </div>
    </div>
  );
}

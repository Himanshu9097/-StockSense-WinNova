import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import { Search, Filter, Layers, Box, Building2 } from 'lucide-react';

export default function InventoryBalances() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['inventory-balances'],
    queryFn: async () => {
      const res = await api.get('/inventory/balances');
      return res.data;
    }
  });

  const filteredBalances = balances.filter((b: any) => 
    b.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.productId?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.locationId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.locationId?.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden">
      {/* Header section */}
      <div className="p-8 border-b border-md-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Inventory Balances</h2>
          <p className="text-md-surface-variant mt-1">Real-time stock across all locations</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-md-surface-variant group-focus-within:text-md-primary transition-colors duration-200" />
            <input 
              type="text" 
              placeholder="Search by product or location..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 bg-md-surface-container-low rounded-full py-4 pl-14 pr-6 text-md-on-background placeholder:text-md-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:bg-white transition-all duration-300 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 p-4 bg-md-surface-container-low shadow-sm rounded-full text-md-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-all duration-200 active:scale-95">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-md-primary"></div>
          </div>
        ) : filteredBalances.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-md-surface-variant">
            <div className="w-24 h-24 bg-md-surface-container-low rounded-full flex items-center justify-center mb-6">
              <Layers className="w-12 h-12 text-md-outline" />
            </div>
            <p className="text-xl font-medium text-md-on-surface">No inventory found</p>
            <p className="text-base mt-2">No stock balances are currently available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBalances.map((balance: any) => (
              <BalanceCard key={balance._id} balance={balance} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BalanceCard({ balance }: { balance: any }) {
  const isLowStock = balance.available < 10;
  
  return (
    <div className="bg-md-surface-container-low rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow duration-300 group border border-transparent hover:border-md-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center shadow-inner">
          <Box className="w-6 h-6" />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isLowStock ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
          {balance.available} {balance.productId?.uom || 'units'} available
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-md-on-background tracking-tight truncate">
        {balance.productId?.name || 'Unknown Product'}
      </h3>
      <p className="text-md-surface-variant font-medium mt-1 truncate">
        SKU: {balance.productId?.sku || 'N/A'}
      </p>
      
      <div className="mt-4 p-3 bg-md-surface-container rounded-2xl border border-md-outline/5 flex items-center gap-3">
        <Building2 className="w-5 h-5 text-md-primary" />
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-md-on-surface truncate">
            {balance.locationId?.name || balance.locationId?.code || 'Unknown Location'}
          </p>
          <p className="text-xs text-md-surface-variant truncate">
            {balance.warehouseId?.name || 'Unknown Warehouse'}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-md-outline/10 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-bold text-md-surface-variant uppercase tracking-wider mb-1">On Hand</p>
          <p className="text-sm font-bold text-md-on-surface">{balance.onHand}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-md-surface-variant uppercase tracking-wider mb-1">Reserved</p>
          <p className="text-sm font-bold text-md-on-surface">{balance.reserved}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-md-surface-variant uppercase tracking-wider mb-1">Available</p>
          <p className={`text-sm font-bold ${isLowStock ? 'text-red-500' : 'text-md-primary'}`}>{balance.available}</p>
        </div>
      </div>
    </div>
  );
}

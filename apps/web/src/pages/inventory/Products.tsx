import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Package, Search, Plus, Filter, ArrowUpDown } from 'lucide-react';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:5000/api/inventory/products', {
        withCredentials: true
      });
      return res.data;
    }
  });

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden">
      {/* Header section with search and actions */}
      <div className="p-8 border-b border-md-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Product Master</h2>
          <p className="text-md-surface-variant mt-1">Manage SKUs, dimensions, and storage constraints</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-md-surface-variant group-focus-within:text-md-primary transition-colors duration-200" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 bg-md-surface-container-low rounded-full py-4 pl-14 pr-6 text-md-on-background placeholder:text-md-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:bg-white transition-all duration-300 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 p-4 bg-md-surface-container-low shadow-sm rounded-full text-md-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-all duration-200 active:scale-95">
            <Filter className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 px-8 py-4 bg-md-primary text-md-on-primary font-bold rounded-full shadow-md hover:shadow-lg hover:bg-md-primary/90 active:scale-95 transition-all duration-300">
            <Plus className="w-5 h-5" />
            New Product
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-md-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-md-surface-variant">
            <div className="w-24 h-24 bg-md-surface-container-low rounded-full flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-md-outline" />
            </div>
            <p className="text-xl font-medium text-md-on-surface">No products found</p>
            <p className="text-base mt-2">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product: any) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  return (
    <div className="bg-md-surface-container-low rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer border border-transparent hover:border-md-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
          <Package className="w-6 h-6" />
        </div>
        <span className="bg-white/50 text-md-on-surface px-3 py-1 rounded-full text-xs font-bold border border-md-outline/10">
          {product.category || 'Uncategorized'}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-md-on-background tracking-tight truncate">{product.name}</h3>
      <p className="text-md-surface-variant font-medium mt-1 truncate">{product.sku}</p>
      
      <div className="mt-6 pt-6 border-t border-md-outline/10 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-md-surface-variant uppercase tracking-wider mb-1">Unit</p>
          <p className="text-base font-bold text-md-on-surface">{product.uom || 'PCS'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-md-surface-variant uppercase tracking-wider mb-1">Weight</p>
          <p className="text-base font-bold text-md-on-surface">{product.weight > 0 ? `${product.weight} kg` : '--'}</p>
        </div>
      </div>
      
      {/* Tracking Flags */}
      <div className="mt-4 flex gap-2">
        {product.trackLot && <Badge label="Lot Tracked" />}
        {product.trackSerial && <Badge label="Serial Tracked" />}
        {product.trackExpiry && <Badge label="Expiry Tracked" />}
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="bg-md-tertiary/10 text-md-tertiary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
      {label}
    </span>
  );
}

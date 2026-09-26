import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import { ArrowDownToLine, Search, Plus, Package, Clock, CheckCircle2 } from 'lucide-react';

export default function Receipts() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const res = await api.get('/receiving');
      return res.data;
    }
  });

  const filteredReceipts = receipts.filter((r: any) => 
    r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.supplier && r.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden">
      {/* Header section with search and actions */}
      <div className="p-8 border-b border-md-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Inbound Receipts</h2>
          <p className="text-md-surface-variant mt-1">Manage expected shipments and receiving tasks</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-md-surface-variant group-focus-within:text-md-primary transition-colors duration-200" />
            <input 
              type="text" 
              placeholder="Search receipts or suppliers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 bg-md-surface-container-low rounded-full py-4 pl-14 pr-6 text-md-on-background placeholder:text-md-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:bg-white transition-all duration-300 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-8 py-4 bg-md-primary text-md-on-primary font-bold rounded-full shadow-md hover:shadow-lg hover:bg-md-primary/90 active:scale-95 transition-all duration-300">
            <Plus className="w-5 h-5" />
            New Receipt
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-md-primary"></div>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-md-surface-variant">
            <div className="w-24 h-24 bg-md-surface-container-low rounded-full flex items-center justify-center mb-6">
              <ArrowDownToLine className="w-12 h-12 text-md-outline" />
            </div>
            <p className="text-xl font-medium text-md-on-surface">No receipts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReceipts.map((receipt: any) => (
              <ReceiptCard key={receipt._id} receipt={receipt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReceiptCard({ receipt }: { receipt: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EXPECTED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'RECEIVING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const Icon = receipt.status === 'COMPLETED' ? CheckCircle2 : Clock;

  return (
    <div className="bg-md-surface-container-low rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer border border-transparent hover:border-md-primary/20 flex flex-col">
      <div className="flex items-start justify-between mb-6">
        <div className="w-14 h-14 bg-md-primary/10 text-md-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner shrink-0">
          <ArrowDownToLine className="w-6 h-6" />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(receipt.status)}`}>
          {receipt.status}
        </span>
      </div>
      
      <h3 className="text-2xl font-bold text-md-on-background tracking-tight">{receipt.receiptNumber}</h3>
      <p className="text-md-surface-variant font-medium mt-1 truncate">{receipt.supplier || 'Unknown Supplier'}</p>
      
      <div className="mt-auto pt-6 border-t border-md-outline/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-md-surface-variant">
          <Package className="w-4 h-4" />
          <span>{receipt.lines?.length || 0} Lines</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-md-surface-variant">
          <Icon className="w-4 h-4" />
          <span>{new Date(receipt.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

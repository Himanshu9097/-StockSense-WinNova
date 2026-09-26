import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowRightLeft, Search, Plus, Filter, PackageOpen, CheckCircle, Clock } from 'lucide-react';

export default function TransferList() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const res = await axios.get('http://localhost:5000/api/transfers', {
        withCredentials: true
      });
      return res.data;
    }
  });

  const executeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.post(`http://localhost:5000/api/transfers/${id}/execute`, {}, {
        withCredentials: true
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    }
  });

  const filteredTransfers = transfers.filter((t: any) => 
    t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden">
      {/* Header section with search and actions */}
      <div className="p-8 border-b border-md-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Internal Transfers</h2>
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
          <button className="flex items-center gap-2 px-8 py-4 bg-md-primary text-md-on-primary font-bold rounded-full shadow-md hover:shadow-lg hover:bg-md-primary/90 active:scale-95 transition-all duration-300">
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
        ) : filteredTransfers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-md-surface-variant">
            <div className="w-24 h-24 bg-md-surface-container-low rounded-full flex items-center justify-center mb-6">
              <PackageOpen className="w-12 h-12 text-md-outline" />
            </div>
            <p className="text-xl font-medium text-md-on-surface">No transfers found</p>
            <p className="text-base mt-2">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTransfers.map((transfer: any) => (
              <TransferCard 
                key={transfer._id} 
                transfer={transfer} 
                onExecute={() => executeMutation.mutate(transfer._id)}
                isExecuting={executeMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransferCard({ transfer, onExecute, isExecuting }: { transfer: any, onExecute: () => void, isExecuting: boolean }) {
  const isCompleted = transfer.status === 'Completed';

  return (
    <div className="bg-md-surface-container-low rounded-[32px] p-6 shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-pointer border border-transparent hover:border-md-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div className="w-14 h-14 bg-md-secondary-container text-md-on-secondary-container rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
          <ArrowRightLeft className="w-6 h-6" />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isCompleted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
          {transfer.status}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-md-on-background tracking-tight truncate">{transfer.transferNumber}</h3>
      
      <div className="mt-4 pt-4 border-t border-md-outline/10 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-md-surface-variant uppercase">Source</span>
          <span className="text-sm font-bold">{transfer.sourceLocationId?.name || 'Unknown'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-md-surface-variant uppercase">Destination</span>
          <span className="text-sm font-bold">{transfer.destinationLocationId?.name || 'Unknown'}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-md-outline/10">
        {!isCompleted && (
          <button 
            onClick={(e) => { e.stopPropagation(); onExecute(); }}
            disabled={isExecuting}
            className="w-full py-3 bg-md-primary text-white rounded-full font-bold hover:bg-md-primary/90 disabled:opacity-50"
          >
            Execute Transfer
          </button>
        )}
      </div>
    </div>
  );
}

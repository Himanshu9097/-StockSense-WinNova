import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Package, Search, MapPin, CheckCircle2 } from 'lucide-react';

export default function Putaway() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // For MVP, we might just fetch tasks directly or use a mock. 
  // We'd need an endpoint for `GET /api/receiving/tasks` which wasn't built yet, so I'll mock the UI structure based on the schema.
  
  const mockTasks = [
    {
      _id: 'PTW-1001',
      productId: { name: 'Steel Rod', sku: 'SR-100' },
      quantity: 50,
      suggestedLocationId: { code: 'WH1-ZA-R1-S1-B1' },
      status: 'PENDING'
    },
    {
      _id: 'PTW-1002',
      productId: { name: 'Copper Wire', sku: 'CW-200' },
      quantity: 20,
      suggestedLocationId: { code: 'WH1-ZA-R1-S1-B2' },
      status: 'PENDING'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden">
      <div className="p-8 border-b border-md-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Putaway Tasks</h2>
          <p className="text-md-surface-variant mt-1">Execute system-directed putaway tasks</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-md-surface-variant group-focus-within:text-md-primary transition-colors duration-200" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 bg-md-surface-container-low rounded-full py-4 pl-14 pr-6 text-md-on-background placeholder:text-md-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:bg-white transition-all duration-300 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockTasks.map((task: any) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  return (
    <div className="bg-md-surface-container-low rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer border border-transparent hover:border-md-primary/20 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-md-primary/10 text-md-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
          <Package className="w-5 h-5" />
        </div>
        <span className="bg-white/50 text-md-on-surface px-3 py-1 rounded-full text-xs font-bold border border-md-outline/10">
          {task.status}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-md-on-background tracking-tight">{task.productId.name}</h3>
      <p className="text-md-surface-variant font-medium mt-1">{task.productId.sku}</p>
      
      <div className="mt-4 pt-4 border-t border-md-outline/10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-md-surface-variant uppercase tracking-wider mb-1">Quantity</p>
          <p className="text-lg font-bold text-md-on-surface">{task.quantity}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-md-surface-variant uppercase tracking-wider mb-1 flex items-center gap-1 justify-end">
            <MapPin className="w-3 h-3" /> Suggested Bin
          </p>
          <p className="text-lg font-bold text-md-primary">{task.suggestedLocationId.code}</p>
        </div>
      </div>
      
      <button className="mt-6 w-full h-12 flex items-center justify-center gap-2 bg-md-primary text-md-on-primary font-bold rounded-full shadow-md hover:bg-md-primary/90 active:scale-95 transition-all duration-300">
        <CheckCircle2 className="w-5 h-5" />
        Confirm Putaway
      </button>
    </div>
  );
}

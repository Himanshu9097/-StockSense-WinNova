import { AlertTriangle, MapPin, Package, Clock } from 'lucide-react';

export default function Exceptions() {
  const exceptions = [
    {
      id: 1,
      title: 'Missing Inventory',
      description: 'System expects 50 units of SR-100 at WH1-ZA-R1-S1-B1, but physically verified as 0.',
      status: 'UNRESOLVED',
      priority: 'HIGH',
      date: 'Just now'
    },
    {
      id: 2,
      title: 'Damaged Goods',
      description: 'Receipt RC-001 reported damaged packaging for 5 units of ELC-MK-01.',
      status: 'INVESTIGATING',
      priority: 'MEDIUM',
      date: '2 hours ago'
    },
    {
      id: 3,
      title: 'Location Blocked',
      description: 'Location WH1-ZA-R1-S1-B2 is blocked due to safety hazard.',
      status: 'UNRESOLVED',
      priority: 'CRITICAL',
      date: 'Yesterday'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden">
      <div className="p-8 border-b border-md-outline/10">
        <h2 className="text-2xl font-medium text-md-on-background tracking-tight">System Exceptions</h2>
        <p className="text-md-surface-variant mt-1">Review and resolve warehouse discrepancies</p>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 gap-4">
          {exceptions.map(exception => (
            <div key={exception.id} className="bg-md-surface-container-low rounded-[32px] p-6 shadow-sm border border-transparent hover:border-md-error/30 transition-all flex items-start gap-6">
              <div className="w-14 h-14 bg-md-error/10 text-md-error rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-md-on-background">{exception.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    exception.priority === 'CRITICAL' ? 'bg-md-error text-md-on-error' : 
                    exception.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {exception.priority}
                  </span>
                </div>
                <p className="text-md-on-surface mb-4">{exception.description}</p>
                <div className="flex items-center gap-4 text-sm font-medium text-md-surface-variant">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {exception.date}</span>
                  <span className="bg-md-surface-container-highest px-3 py-1 rounded-full text-xs font-bold">{exception.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

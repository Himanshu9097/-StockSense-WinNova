import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api';
import { Map, Search, Plus, Filter, Warehouse, MapPin } from 'lucide-react';

export default function Locations() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await api.get('/inventory/locations');
      return res.data;
    }
  });

  const filteredLocations = locations.filter((l: any) => 
    l.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.name && l.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-md-surface-container rounded-[40px] shadow-sm overflow-hidden">
      {/* Header section with search and actions */}
      <div className="p-8 border-b border-md-outline/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-medium text-md-on-background tracking-tight">Location Hierarchy</h2>
          <p className="text-md-surface-variant mt-1">Manage zones, aisles, racks, and bins</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-md-surface-variant group-focus-within:text-md-primary transition-colors duration-200" />
            <input 
              type="text" 
              placeholder="Search locations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-80 bg-md-surface-container-low rounded-full py-4 pl-14 pr-6 text-md-on-background placeholder:text-md-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:bg-white transition-all duration-300 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-8 py-4 bg-md-primary text-md-on-primary font-bold rounded-full shadow-md hover:shadow-lg hover:bg-md-primary/90 active:scale-95 transition-all duration-300">
            <Plus className="w-5 h-5" />
            New Location
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-md-primary"></div>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-md-surface-variant">
            <div className="w-24 h-24 bg-md-surface-container-low rounded-full flex items-center justify-center mb-6">
              <Map className="w-12 h-12 text-md-outline" />
            </div>
            <p className="text-xl font-medium text-md-on-surface">No locations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredLocations.map((location: any) => (
              <LocationCard key={location._id} location={location} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LocationCard({ location }: { location: any }) {
  return (
    <div className="bg-md-surface-container-low rounded-[32px] p-6 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer border border-transparent hover:border-md-primary/20">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-md-tertiary/10 text-md-tertiary rounded-full flex items-center justify-center group-hover:bg-md-tertiary group-hover:text-white transition-colors duration-300">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-md-on-background tracking-tight truncate">{location.code}</h3>
          <p className="text-xs font-medium text-md-surface-variant uppercase tracking-wider">{location.type}</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-md-outline/10 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold text-md-surface-variant uppercase tracking-wider mb-1">Capacity</p>
          <p className="text-sm font-bold text-md-on-surface">{location.capacity > 0 ? location.capacity : '∞'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-md-surface-variant uppercase tracking-wider mb-1">Status</p>
          <span className="bg-md-secondary-container text-md-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-bold">
            {location.status}
          </span>
        </div>
      </div>
    </div>
  );
}

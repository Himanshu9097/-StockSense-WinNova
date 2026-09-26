import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Map, 
  ArrowRightLeft, 
  AlertTriangle, 
  BarChart2, 
  Settings, 
  LogOut,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  Menu,
  ArrowDownToLine
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-md-background text-md-on-background font-sans overflow-hidden relative">
      
      {/* Material You Organic Background Blur Shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-md-secondary-container/40 rounded-full blur-3xl mix-blend-multiply pointer-events-none -translate-y-1/3 translate-x-1/3" aria-hidden="true" />
      <div className="absolute bottom-0 left-64 w-[500px] h-[500px] bg-md-tertiary/10 rounded-full blur-3xl mix-blend-multiply pointer-events-none translate-y-1/3 -translate-x-1/4" aria-hidden="true" />

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-md-surface-container border-r border-md-outline/10 flex flex-col z-10 rounded-r-[40px] shadow-sm my-2 ml-2 h-[calc(100vh-16px)] overflow-hidden">
        <div className="h-24 flex items-center px-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-md-primary rounded-full flex items-center justify-center shadow-sm">
              <Package className="w-6 h-6 text-md-on-primary" />
            </div>
            <span className="font-bold tracking-tight text-2xl text-md-on-background">StockSense</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <NavItem icon={<BarChart2 />} label="Overview" active onClick={() => navigate('/dashboard')} />
          <NavItem icon={<Package />} label="Inventory" onClick={() => navigate('/products')} />
          <NavItem icon={<Map />} label="Locations" onClick={() => navigate('/locations')} />
          <NavItem icon={<ArrowDownToLine />} label="Receipts" onClick={() => navigate('/receipts')} />
          <NavItem icon={<Package />} label="Putaway" onClick={() => navigate('/putaway')} />
          <NavItem icon={<ArrowRightLeft />} label="Transfers" onClick={() => navigate('/transfers')} />
          
          <div className="pt-8 pb-3 px-4 text-xs font-bold text-md-surface-variant uppercase tracking-wider">
            Management
          </div>
          <NavItem icon={<AlertTriangle />} label="Exceptions" badge="3" />
          <NavItem icon={<Settings />} label="Settings" />
        </nav>

        <div className="p-6">
          <div className="bg-md-surface-container-low rounded-full p-3 pr-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-md-secondary-container flex items-center justify-center font-bold text-md-on-secondary-container text-lg shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-md-on-background truncate group-hover:text-md-primary transition-colors duration-200">{user?.name || 'Operator'}</div>
              <div className="text-xs font-medium text-md-surface-variant truncate">{user?.role || 'SYS_ADMIN'}</div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
              className="w-10 h-10 rounded-full flex items-center justify-center text-md-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-colors duration-200 active:scale-95"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden z-10 relative">
        
        {/* APP BAR */}
        <header className="h-24 flex items-center justify-between px-10 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-md-on-background">Overview</h1>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Pill Shaped Search Bar */}
            <div className="relative group">
              <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-md-surface-variant group-focus-within:text-md-primary transition-colors duration-200" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-80 bg-md-surface-container-low rounded-full py-4 pl-14 pr-6 text-md-on-background placeholder:text-md-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:bg-white transition-all duration-300 shadow-sm"
              />
            </div>
            <button className="relative p-4 bg-md-surface-container-low shadow-sm rounded-full text-md-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-all duration-200 active:scale-95">
              <Bell className="w-6 h-6" />
              <span className="absolute top-3 right-3 w-3 h-3 bg-md-tertiary rounded-full border-2 border-md-background shadow-sm" />
            </button>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto px-10 pb-12 pt-4">
          
          {/* WELCOME HERO */}
          <div className="mb-12 bg-md-surface-container rounded-[48px] p-12 flex items-center justify-between shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 w-80 h-80 bg-md-primary/10 rounded-full blur-3xl transform translate-x-1/4 translate-y-1/4 group-hover:bg-md-primary/20 transition-colors duration-500" />
            
            <div className="relative z-10">
              <h2 className="text-5xl font-medium mb-4 tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Operator'}</h2>
              <p className="text-xl text-md-surface-variant max-w-2xl leading-relaxed">
                System is online and operational. There are 23 pending exceptions requiring your attention today.
              </p>
            </div>
            <div className="relative z-10 hidden lg:block">
              <button className="bg-md-primary text-md-on-primary px-10 h-16 rounded-full font-medium text-lg shadow-md hover:shadow-xl hover:bg-md-primary/90 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]">
                Review Exceptions
              </button>
            </div>
          </div>

          {/* METRICS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <MetricCard label="Active Warehouses" value="12" trend="+2 this month" />
            <MetricCard label="Inventory Accuracy" value="98.7%" trend="Target: 99.0%" />
            <MetricCard label="Open Tasks" value="1,284" trend="15% above average" />
            <MetricCard label="Exceptions" value="23" trend="Needs attention" isTertiary />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* WAREHOUSE MAP */}
            <div className="xl:col-span-2 bg-md-surface-container rounded-[40px] p-10 flex flex-col min-h-[450px] shadow-sm hover:shadow-md transition-shadow duration-300 group">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-medium text-md-on-background tracking-tight">Fulfillment Network</h3>
                <button className="text-md-primary font-bold px-6 h-12 rounded-full hover:bg-md-primary/10 active:scale-95 transition-all duration-200">
                  View Map
                </button>
              </div>
              <div className="flex-1 bg-md-surface-container-low rounded-[32px] flex items-center justify-center relative overflow-hidden group-hover:bg-md-surface-container-low/80 transition-colors duration-300 shadow-inner">
                <div className="text-center p-10">
                  <div className="w-20 h-20 bg-md-secondary-container text-md-primary rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] shadow-sm">
                    <Map className="w-10 h-10" />
                  </div>
                  <p className="text-xl font-bold text-md-on-background">Map Visualization</p>
                  <p className="text-base text-md-surface-variant mt-2">Connect to the logistics API to render real-time nodes.</p>
                </div>
              </div>
            </div>

            {/* PRIORITY TASKS */}
            <div className="bg-md-surface-container rounded-[40px] flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden p-6">
              <div className="px-6 pb-6 pt-4">
                <h3 className="text-2xl font-medium text-md-on-background tracking-tight">Priority Tasks</h3>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 px-2">
                <TaskItem type="PICK" id="TSK-8992" loc="A-12-04" time="2m ago" />
                <TaskItem type="PUTAWAY" id="TSK-8991" loc="RECV-01" time="15m ago" />
                <TaskItem type="COUNT" id="TSK-8990" loc="C-04-12" time="1h ago" />
                <TaskItem type="REPLENISH" id="TSK-8989" loc="B-08-01" time="2h ago" />
              </div>
              <div className="pt-6 pb-2 px-2">
                <button className="w-full h-14 rounded-full bg-md-secondary-container text-md-on-secondary-container font-bold text-base hover:bg-md-secondary-container/80 hover:shadow-md active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]">
                  View All Tasks
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-components

function NavItem({ icon, label, active = false, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-6 h-16 !rounded-full text-lg transition-all duration-300 active:scale-95 outline-none focus:outline-none border-none ${
      active 
        ? 'bg-md-secondary-container text-md-on-secondary-container font-bold shadow-sm' 
        : 'text-md-surface-variant hover:text-md-on-background hover:bg-md-on-background/5'
    }`}>
      <div className="flex items-center gap-5">
        {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${active ? 'text-md-primary' : ''}` })}
        {label}
      </div>
      {badge && (
        <span className="bg-md-tertiary text-white text-sm font-bold px-3 py-1 !rounded-full shadow-sm">
          {badge}
        </span>
      )}
    </button>
  );
}

function MetricCard({ label, value, trend, isTertiary }: { label: string, value: string, trend: string, isTertiary?: boolean }) {
  return (
    <div className={`rounded-[32px] p-8 shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] cursor-pointer group ${
      isTertiary ? 'bg-md-tertiary text-white' : 'bg-md-surface-container'
    }`}>
      <div className={`text-base font-bold mb-6 tracking-wide ${isTertiary ? 'text-white/80' : 'text-md-surface-variant'}`}>
        {label}
      </div>
      <div className={`text-5xl font-medium mb-3 tracking-tight ${isTertiary ? 'text-white' : 'text-md-on-background'}`}>
        {value}
      </div>
      <div className={`text-base font-medium ${isTertiary ? 'text-white/90' : 'text-md-primary'} group-hover:translate-x-2 transition-transform duration-300`}>
        {trend}
      </div>
    </div>
  );
}

function TaskItem({ type, id, loc, time }: { type: string, id: string, loc: string, time: string }) {
  let Icon = Clock;
  let bgClass = "bg-md-surface-container-low";
  let textClass = "text-md-on-background";
  let iconClass = "text-md-surface-variant";

  if (type === 'PICK') {
    Icon = ArrowRightLeft;
    bgClass = "bg-md-secondary-container";
    textClass = "text-md-on-secondary-container";
    iconClass = "text-md-primary";
  } else if (type === 'COUNT') {
    Icon = CheckCircle2;
  } else if (type === 'PUTAWAY') {
    Icon = Package;
  }

  return (
    <div className="flex items-center gap-5 p-4 rounded-full hover:bg-md-surface-container-low hover:shadow-sm transition-all duration-300 cursor-pointer group">
      <div className={`w-14 h-14 rounded-full ${bgClass} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] shadow-inner`}>
        <Icon className={`w-7 h-7 ${iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-lg font-bold ${textClass} mb-1 tracking-tight`}>{id}</div>
        <div className="flex items-center gap-3 text-sm font-medium text-md-surface-variant">
          <span className="bg-white/40 px-2 py-0.5 rounded-full">{type}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-md-outline/40" />
          <span>{loc}</span>
        </div>
      </div>
      <div className="text-sm font-medium text-md-surface-variant whitespace-nowrap pr-2">
        {time}
      </div>
    </div>
  );
}

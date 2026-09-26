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
  ArrowDownToLine
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

export default function MaterialLayout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const navItems = [
    { icon: <BarChart2 />, label: 'Overview', path: '/dashboard' },
    { icon: <Package />, label: 'Inventory', path: '/products' },
    { icon: <Map />, label: 'Locations', path: '/locations' },
    { icon: <ArrowDownToLine />, label: 'Receipts', path: '/receipts' },
    { icon: <Package />, label: 'Putaway', path: '/putaway' },
    { icon: <ArrowRightLeft />, label: 'Transfers', path: '/transfers' },
  ];

  // Map current path to header title
  const currentItem = navItems.find(item => location.pathname.startsWith(item.path)) || { label: 'StockSense' };

  return (
    <div className="flex h-screen bg-md-background text-md-on-background font-sans overflow-hidden relative">
      
      {/* Material You Organic Background Blur Shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-md-secondary-container/40 rounded-full blur-3xl mix-blend-multiply pointer-events-none -translate-y-1/3 translate-x-1/3" aria-hidden="true" />
      <div className="absolute bottom-0 left-64 w-[500px] h-[500px] bg-md-tertiary/10 rounded-full blur-3xl mix-blend-multiply pointer-events-none translate-y-1/3 -translate-x-1/4" aria-hidden="true" />

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-md-surface-container border-r border-md-outline/10 flex flex-col z-10 rounded-r-[40px] shadow-sm my-2 ml-2 h-[calc(100vh-16px)] overflow-hidden">
        <div className="h-24 flex items-center px-8 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-md-primary rounded-full flex items-center justify-center shadow-sm">
              <Package className="w-6 h-6 text-md-on-primary" />
            </div>
            <span className="font-bold tracking-tight text-2xl text-md-on-background">StockSense</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {navItems.map((item) => (
            <NavItem 
              key={item.path}
              icon={item.icon} 
              label={item.label} 
              active={location.pathname.startsWith(item.path)} 
              onClick={() => navigate(item.path)}
            />
          ))}
          
          <div className="pt-8 pb-3 px-4 text-xs font-bold text-md-surface-variant uppercase tracking-wider">
            Management
          </div>
          <NavItem icon={<AlertTriangle />} label="Exceptions" badge="3" onClick={() => {}} />
          <NavItem icon={<Settings />} label="Settings" onClick={() => {}} />
        </nav>

        <div className="p-6">
          <div className="bg-md-surface-container-low rounded-[24px] p-3 pr-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-12 h-12 rounded-full bg-md-secondary-container flex items-center justify-center font-bold text-md-on-secondary-container text-lg shadow-inner shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-md-on-background truncate group-hover:text-md-primary transition-colors duration-200">{user?.name || 'Operator'}</div>
              <div className="text-xs font-medium text-md-surface-variant truncate">{user?.role || 'SYS_ADMIN'}</div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
              className="w-10 h-10 rounded-full flex items-center justify-center text-md-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-colors duration-200 active:scale-95 shrink-0"
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
            <h1 className="text-3xl font-bold tracking-tight text-md-on-background">{currentItem.label}</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-md-surface-variant group-focus-within:text-md-primary transition-colors duration-200" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-80 bg-md-surface-container-low rounded-full py-4 pl-14 pr-6 text-md-on-background placeholder:text-md-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:bg-white transition-all duration-300 shadow-sm"
              />
            </div>
            <button className="relative p-4 bg-md-surface-container-low shadow-sm rounded-full text-md-surface-variant hover:bg-md-primary/10 hover:text-md-primary transition-all duration-200 active:scale-95">
              <Bell className="w-6 h-6" />
              <span className="absolute top-3 right-3 w-3 h-3 bg-md-tertiary rounded-full border-2 border-md-background shadow-sm" />
            </button>
          </div>
        </header>

        {/* OUTLET FOR PAGES */}
        <div className="flex-1 overflow-y-auto px-10 pb-12 pt-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-6 h-16 !rounded-full text-lg transition-all duration-300 active:scale-95 outline-none focus:outline-none border-none ${
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

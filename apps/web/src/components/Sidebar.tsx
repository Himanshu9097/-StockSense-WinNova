import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Products', path: '/products', icon: 'Package' },
    { name: 'Inventory Balances', path: '/balances', icon: 'Layers' },
    { name: 'Receipts', path: '/receipts', icon: 'ArrowDownToLine' },
    { name: 'Delivery Orders', path: '/deliveries', icon: 'ArrowUpFromLine' },
    { name: 'Internal Transfers', path: '/transfers', icon: 'ArrowRightLeft' },
    { name: 'Stock Adjustments', path: '/adjustments', icon: 'SlidersHorizontal' },
    { name: 'Move History', path: '/history', icon: 'History' },
    { name: 'Warehouse', path: '/warehouse', icon: 'Warehouse' },
  ];

  return (
    <aside className="w-64 bg-background border-r border-border min-h-screen flex flex-col">
      <div className="p-6 font-bold text-xl text-primary tracking-tight border-b border-border">
        StockSense
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${isActive ? 'bg-surface-elevated text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-border/50' : 'text-text-secondary hover:text-primary hover:bg-surface'}`}
            >
              <span className="font-medium text-sm">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border text-sm text-text-secondary">
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full text-left px-4 py-2 hover:text-primary transition-colors">
          Log Out
        </button>
      </div>
    </aside>
  );
}

import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, Menu as MenuIcon, QrCode, BarChart3, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function SidebarLayout() {
  const { token, admin, logout } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Menu Manager', path: '/menu', icon: MenuIcon },
    { name: 'QR Codes', path: '/qr', icon: QrCode },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background flex text-text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary border-r border-border flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <span className="text-primary font-sora font-bold">AR</span>
          </div>
          <div>
            <h2 className="font-sora font-bold text-sm truncate">{admin?.restaurant_name || 'Restaurant'}</h2>
            <p className="text-xs text-text-muted truncate">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-12 transition-all duration-150 font-medium text-sm",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-text-muted hover:bg-surface hover:text-text-primary"
                )}
              >
                <item.icon size={18} className={isActive ? "text-primary" : "text-text-muted"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-12 text-text-muted hover:bg-surface hover:text-error transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

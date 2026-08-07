import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CreditCard, DollarSign, FileText, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuthStore();

  const navItems = [
    { path: '/dashboard', label: 'Restaurants', icon: LayoutDashboard },
    { path: '/plans', label: 'Plans & Pricing', icon: CreditCard },
    { path: '/billing', label: 'Billing', icon: DollarSign },
    { path: '/audit-logs', label: 'Audit Logs', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-900 min-h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white">Platform Admin</h1>
        <p className="text-gray-400 text-sm mt-1">Restaurant POS Management</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

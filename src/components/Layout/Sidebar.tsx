import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Home, 
  ShoppingCart, 
  Users, 
  Package, 
  CreditCard,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'manager', 'salesman'] },
    { id: 'sales', label: 'Sales POS', icon: ShoppingCart, roles: ['admin', 'manager', 'salesman'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['admin', 'manager'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'manager'] },
    { id: 'cards', label: 'Card Management', icon: CreditCard, roles: ['admin'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  const availableItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-gradient-to-b from-amber-800 to-amber-900 text-white flex flex-col shadow-xl">
      {/* Fixed Header */}
      <div className="p-6 border-b border-amber-700/50 flex-shrink-0">
        <h1 className="text-xl font-bold">Cafe D Revenue</h1>
        <p className="text-sm text-amber-200">FBR Department</p>
      </div>
      
      {/* User Info - Fixed */}
      <div className="px-6 py-4 border-b border-amber-700/50 flex-shrink-0">
        <div className="bg-amber-700/30 rounded-lg p-3">
          <p className="text-sm text-amber-200">Logged in as:</p>
          <p className="font-semibold">{user?.name}</p>
          <p className="text-xs text-amber-300 capitalize">{user?.role}</p>
        </div>
      </div>
      
      {/* Navigation - Scrollable */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {availableItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-700 text-white shadow-lg scale-105'
                    : 'text-amber-200 hover:bg-amber-700/50 hover:text-white hover:scale-105'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Logout - Fixed at bottom */}
      <div className="p-4 border-t border-amber-700/50 flex-shrink-0">
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-amber-200 hover:bg-amber-700/50 hover:text-white rounded-lg transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
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
  LogOut,
  Clock,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeView, onViewChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user, logout } = useAuth();

  // Define menu items with role-based access
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'manager'] },
    { id: 'sales', label: 'Sales POS', icon: ShoppingCart, roles: ['admin', 'manager', 'salesman'] },
    { id: 'pending-sales', label: 'Pending Sales', icon: Clock, roles: ['admin', 'manager'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['admin', 'manager'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'manager'] },
    { id: 'cards', label: 'Card Management', icon: CreditCard, roles: ['admin'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-slate-50 to-slate-100 text-gray-800 flex flex-col shadow-xl transition-all duration-300 ease-in-out relative hidden md:flex border-r border-gray-200`}>
      {/* Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-6 bg-white hover:bg-gray-50 text-gray-700 rounded-full p-1.5 shadow-lg transition-colors z-10 border border-gray-200"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <Menu size={16} /> : <X size={16} />}
      </button>

      {/* Fixed Header */}
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b border-gray-300 flex-shrink-0 bg-white`}>
        {isCollapsed ? (
          <div className="text-center">
            <img 
              src="/logo.svg" 
              alt="Cafe D Revenue Logo" 
              className="w-10 h-10 object-contain mx-auto"
            />
          </div>
        ) : (
          <div className="text-center">
            <img 
              src="/logo.svg" 
              alt="Cafe D Revenue Logo" 
              className="w-24 h-24 object-contain mx-auto"
            />
          </div>
        )}
      </div>
      
      {/* Navigation - Scrollable */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className={`space-y-1 ${isCollapsed ? 'px-1' : 'px-2'}`}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg text-left transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gray-800 text-white shadow-lg scale-105'
                    : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900 hover:scale-105'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Logout - Fixed at bottom */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-300 flex-shrink-0 bg-white`}>
        <button
          onClick={logout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-all duration-200 group relative`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-medium truncate">Logout</span>}
          
          {/* Tooltip for collapsed state */}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
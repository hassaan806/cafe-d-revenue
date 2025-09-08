import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ProductProvider } from './contexts/ProductContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { RechargeProvider } from './contexts/RechargeContext';
import { SalesProvider } from './contexts/SalesContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SalesPOS } from './components/Sales/SalesPOS';
import { ProductManagement } from './components/Products/ProductManagement';
import { CustomerManagement } from './components/Customers/CustomerManagement';
import { CardManagement } from './components/Cards/CardManagement';
import { PendingSalesManagement } from './components/PendingSales/PendingSalesManagement';
import { Reports } from './components/Reports/Reports';

import { Settings } from './components/Settings/Settings';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { isAuthenticated, loading, user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsedState !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsedState));
    }
  }, []);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  // Get initial view from URL or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view');
    const viewFromStorage = localStorage.getItem('activeView');
    
    // For salesman role, always redirect to sales
    if (user?.role === 'salesman') {
      setActiveView('sales');
      localStorage.setItem('activeView', 'sales');
      return;
    }
    
    // Priority: URL parameter > localStorage > default dashboard
    const initialView = viewFromUrl || viewFromStorage || 'dashboard';
    
    // Validate the view exists and user has access
    const validViews = ['dashboard', 'sales', 'pending-sales', 'products', 'customers', 'cards', 'reports', 'settings'];
    if (validViews.includes(initialView)) {
      setActiveView(initialView);
    } else {
      setActiveView('dashboard');
    }
  }, [user?.role]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const viewFromUrl = urlParams.get('view');
      const validViews = ['dashboard', 'sales', 'pending-sales', 'products', 'customers', 'cards', 'reports', 'settings'];
      
      if (viewFromUrl && validViews.includes(viewFromUrl)) {
        setActiveView(viewFromUrl);
        localStorage.setItem('activeView', viewFromUrl);
      } else {
        setActiveView('dashboard');
        localStorage.setItem('activeView', 'dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL and localStorage when view changes
  const handleViewChange = (newView: string) => {
    // Prevent salesman from accessing other views
    if (user?.role === 'salesman' && newView !== 'sales') {
      return; // Block navigation for salesman
    }
    
    setActiveView(newView);
    localStorage.setItem('activeView', newView);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.pushState({}, '', url.toString());
  };

  console.log('App render - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user?.username);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, showing login form');
    return <LoginForm />;
  }

  console.log('Authenticated, showing main app');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onViewChange={handleViewChange} />;
      case 'sales':
        return <SalesPOS />;
      case 'pending-sales':
        return <PendingSalesManagement />;
      case 'products':
        return <ProductManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'cards':
        return <CardManagement />;
      case 'reports':
        return <Reports />;

      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onViewChange={handleViewChange} />;
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-slate-50 to-slate-100 text-gray-800 p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.svg" 
            alt="Cafe D Revenue Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <p className="text-sm text-gray-700">Welcome, {user?.name}</p>
          </div>
        </div>
        <button
          onClick={toggleSidebar}
          className="bg-white hover:bg-gray-50 p-2 rounded-lg border border-gray-200 text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Overlay Sidebar */}
      {sidebarCollapsed === false && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black opacity-50" onClick={toggleSidebar}></div>
          <div className="relative w-64 bg-gradient-to-b from-slate-50 to-slate-100 text-gray-800 flex flex-col shadow-xl border-r border-gray-200">
            <div className="p-6 border-b border-gray-300 bg-white">
              <div className="text-center">
                <img 
                  src="/logo.svg" 
                  alt="Cafe D Revenue Logo" 
                  className="w-20 h-20 object-contain mx-auto"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-2">
                {/* Add navigation items here - simplified version */}
                <button
                  onClick={() => { handleViewChange('sales'); toggleSidebar(); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m4.5-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
                  </svg>
                  <span>Sales POS</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Collapsible Sidebar */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={handleViewChange} 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      
      {/* Main Content Area - Adjusts based on sidebar state */}
      <main className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out">
        {renderView()}
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProductProvider>
          <CategoryProvider>
            <CustomerProvider>
              <RechargeProvider>
                <SalesProvider>
                  <AppContent />
                </SalesProvider>
              </RechargeProvider>
            </CustomerProvider>
          </CategoryProvider>
        </ProductProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
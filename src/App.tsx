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
import { Reports } from './components/Reports/Reports';
import { Settings } from './components/Settings/Settings';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { isAuthenticated, loading, user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Load contexts only when authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <ProductProvider>
      <CategoryProvider>
        <CustomerProvider>
          <RechargeProvider>
            <SalesProvider>
              <AppMainContent activeView={activeView} setActiveView={setActiveView} user={user} />
            </SalesProvider>
          </RechargeProvider>
        </CustomerProvider>
      </CategoryProvider>
    </ProductProvider>
  );
}

function AppMainContent({ activeView, setActiveView, user }: { activeView: string; setActiveView: (view: string) => void; user: any }) {

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view');
    const viewFromStorage = localStorage.getItem('activeView');
    
    const initialView = viewFromUrl || viewFromStorage || 'dashboard';
    
    const validViews = ['dashboard', 'sales', 'products', 'customers', 'cards', 'reports', 'settings'];
    if (validViews.includes(initialView)) {
      setActiveView(initialView);
    } else {
      setActiveView('dashboard');
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const viewFromUrl = urlParams.get('view');
      const validViews = ['dashboard', 'sales', 'products', 'customers', 'cards', 'reports', 'settings'];
      
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
    setActiveView(newView);
    localStorage.setItem('activeView', newView);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.pushState({}, '', url.toString());
  };

  console.log('App render - user:', user?.username);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onViewChange={handleViewChange} />;
      case 'sales':
        return <SalesPOS />;
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
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      
      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
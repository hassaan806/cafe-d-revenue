import { useState } from 'react';
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

  console.log('App render - loading:', loading, 'isAuthenticated:', isAuthenticated, 'user:', user?.username);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mx-auto mb-4"></div>
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
        return <Dashboard onViewChange={setActiveView} />;
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
        return <Dashboard onViewChange={setActiveView} />;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
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
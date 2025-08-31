import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginForm } from './components/Auth/LoginForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SalesPOS } from './components/Sales/SalesPOS';
import { ProductManagement } from './components/Products/ProductManagement';
import { CustomerManagement } from './components/Customers/CustomerManagement';
import { CardManagement } from './components/Cards/CardManagement';
import { Reports } from './components/Reports/Reports';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
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
      default:
        return <Dashboard />;
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
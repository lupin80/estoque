import React, { useState, useEffect } from 'react';
import { Sidebar, MobileNav, TopBar, View } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InventoryList } from './components/InventoryList';
import { ProductCatalog } from './components/ProductCatalog';
import { MovementForm } from './components/MovementForm';
import { Suppliers } from './components/Suppliers';
import { ABCAnalysis } from './components/ABCAnalysis';
import { Reports } from './components/Reports';
import { DeletedItems } from './components/DeletedItems';
import { Settings } from './components/Settings';
import { Support } from './components/Support';
import { ProductDetail } from './components/ProductDetail';
import { Login } from './components/Login';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';



// ─── App interno (dentro do AuthProvider) ────────────────────────────────────
function AppInner() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Restaura a última view salva
  useEffect(() => {
    const saved = localStorage.getItem('vault_last_view') as View | null;
    if (saved) setCurrentView(saved);
  }, []);

  // Salva a view atual
  useEffect(() => {
    localStorage.setItem('vault_last_view', currentView);
  }, [currentView]);

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setSearchQuery('');
  };

  const handleProductDetail = (id: string) => {
    setSelectedProductId(id);
    setCurrentView('product-detail');
  };

  const handleLogin = (userData: any) => {
    // AuthProvider já gerencia o estado — apenas força re-render
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
            <Dashboard
            onViewChange={handleViewChange}
            onViewProduct={handleProductDetail}
          />
        );
      case 'inventory':
        return (
          <InventoryList
            searchQuery={searchQuery}
            onViewProduct={handleProductDetail}
          />
        );
      case 'products':
        return (
          <ProductCatalog
            searchQuery={searchQuery}
            onViewProduct={handleProductDetail}
          />
        );
      case 'movements':
        return <MovementForm />;
      case 'suppliers':
        return <Suppliers searchQuery={searchQuery} />;
      case 'abc-analysis':
        return <ABCAnalysis />;
      case 'reports':
        return <Reports searchQuery={searchQuery} />;
      case 'deleted-items':
        return <DeletedItems searchQuery={searchQuery} />;
      case 'settings':
      case 'users':
        // Usuários está embutido no Settings (seção admin)
        return <Settings />;
      case 'support':
        return <Support />;
      case 'product-detail':
        return selectedProductId ? (
          <ProductDetail
            productId={selectedProductId}
            onBack={() => setCurrentView('products')}
          />
        ) : null;
      default:
        return <Dashboard onViewChange={handleViewChange} onViewProduct={handleProductDetail} />;
    }
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      <div className="flex-1 flex flex-col md:ml-64 overflow-hidden">
        <TopBar
          onViewChange={handleViewChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <ErrorBoundary>
            {renderView()}
          </ErrorBoundary>
        </main>
      </div>
      <MobileNav currentView={currentView} onViewChange={handleViewChange} />
    </div>
  );
}

// ─── App raiz ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

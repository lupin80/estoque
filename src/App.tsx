/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Sidebar, MobileNav, TopBar } from './components/Layout';
import type { View } from './components/Layout';
import { Login } from './components/Login';
import { useAuth } from './components/AuthProvider';
import { Dashboard } from './components/Dashboard';
import { InventoryList } from './components/InventoryList';
import { ProductCatalog } from './components/ProductCatalog';
import { MovementForm } from './components/MovementForm';
import { Suppliers } from './components/Suppliers';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Support } from './components/Support';
import { DeletedItems } from './components/DeletedItems';
import { ProductDetail } from './components/ProductDetail';
import { ABCAnalysis } from './components/ABCAnalysis';
import { UserManagement } from './components/UserManagement';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App ErrorBoundary capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-tertiary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-on-surface mb-4">Algo deu errado</h1>
              <p className="text-on-surface-variant text-sm md:text-base leading-relaxed mb-8">
                Um erro inesperado ocorreu. A página principal falhou ao carregar.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-secondary text-on-secondary px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all"
              >
                Recarregar Página
              </button>
              <a 
                href="/" 
                className="border border-outline-variant px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-surface-container transition-colors"
              >
                Voltar ao Início
              </a>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs bg-surface-container-low p-4 rounded-lg mt-8">
                <summary className="cursor-pointer font-bold mb-2">Detalhes do Erro (Dev)</summary>
                <pre className="text-on-surface-variant whitespace-pre-wrap">{this.state.error!.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleViewProduct = (id: string) => {
    setSelectedProductId(id);
    setCurrentView('product-detail');
  };

  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  const renderAuthenticatedView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} onViewProduct={handleViewProduct} />;
      case 'inventory':
        return <InventoryList onViewProduct={handleViewProduct} searchQuery={searchQuery} />;
      case 'products':
        return <ProductCatalog onViewProduct={handleViewProduct} searchQuery={searchQuery} />;
      case 'movements':
        return <MovementForm />;
case 'abc-analysis':
        return <ABCAnalysis />;
      case 'users':
        return <UserManagement />;
      case 'suppliers':
        return <Suppliers searchQuery={searchQuery} />;
      case 'reports':
        return <Reports searchQuery={searchQuery} />;
      case 'deleted-items':
        return <DeletedItems searchQuery={searchQuery} />;
      case 'settings':
        return <Settings />;
      case 'support':
        return <Support />;
      case 'product-detail':
        return selectedProductId ? (
          <ProductDetail 
            productId={selectedProductId} 
            onBack={() => setCurrentView('products')} 
          />
        ) : <ProductCatalog onViewProduct={handleViewProduct} />;
      default:
        return <Dashboard />;
    }
  };

  const renderView = () => {
    if (!user) {
      return <Login onLogin={(userData) => {
        // onLogin from Login calls setUser from context
        window.location.reload(); // Reload to re-render with auth state
      }} />;
    }
    return renderAuthenticatedView();
  };

  return (
    <ErrorBoundary>
      {!user ? (
        renderView()
      ) : (
        <div className="min-h-screen bg-surface flex flex-col md:flex-row">
          <Sidebar currentView={currentView} onViewChange={setCurrentView} />

          <main className="flex-1 md:ml-64 min-h-screen flex flex-col pb-20 md:pb-0">
            <TopBar
              onViewChange={setCurrentView}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <div className="flex-1 overflow-y-auto">
              {renderView()}
            </div>
          </main>

          <MobileNav currentView={currentView} onViewChange={setCurrentView} />
        </div>
      )}
    </ErrorBoundary>
  );
}


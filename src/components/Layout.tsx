import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  ArrowLeftRight,
  FileText,
  Settings,
  HelpCircle,
  Plus,
  Search,
  Bell,
  History,
  Factory,
  LogOut,
  Trash2,
  TrendingUp,
  Calendar,
  X,
  AlertTriangle,
  PackagePlus,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';

export type View = 'dashboard' | 'inventory' | 'products' | 'movements' | 'suppliers' | 'product-detail' | 'deleted-items' | 'settings' | 'support' | 'reports' | 'abc-analysis';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

/* user passed as prop if needed */

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'products', label: 'Produtos', icon: Layers },
    { id: 'movements', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'suppliers', label: 'Fornecedores', icon: Factory },
    { id: 'abc-analysis', label: 'Curva ABC', icon: TrendingUp },
    { id: 'reports', label: 'Relatórios', icon: FileText },
{ id: 'deleted-items', label: 'Excluídos', icon: Trash2 },
  ] as const;

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-low py-6 border-r border-outline-variant/10 fixed left-0 top-0 z-50">
      <div className="px-6 mb-8">
        <h1 className="text-lg font-black text-on-surface tracking-tight font-headline uppercase">Vault Inventory</h1>
        <div className="mt-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-surface-container-highest flex items-center justify-center">
            <Package className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <p className="text-on-surface font-bold text-sm">Ops Global</p>
            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest">Cofre Central</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-300 rounded-lg group relative overflow-hidden",
              currentView === item.id 
                ? "text-secondary bg-secondary/10 font-bold shadow-[inset_0_0_20px_rgba(102,221,139,0.05)]" 
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            )}
          >
            {currentView === item.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_10px_rgba(102,221,139,0.5)]" />
            )}
            <item.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", currentView === item.id ? "fill-secondary/20" : "")} />
            <span className="text-sm tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-2 space-y-1">
        <button 
          onClick={() => onViewChange('settings')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2 transition-all rounded-md",
            currentView === 'settings' 
              ? "text-secondary bg-secondary/10 font-bold" 
              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">Configurações</span>
        </button>
        <button 
          onClick={() => onViewChange('support')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2 transition-all rounded-md",
            currentView === 'support' 
              ? "text-secondary bg-secondary/10 font-bold" 
              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          )}
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-sm">Suporte</span>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ currentView, onViewChange }: SidebarProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel h-16 flex items-center justify-around px-4 z-[100] border-t border-white/5">
      <button 
        onClick={() => onViewChange('dashboard')}
        className={cn("flex flex-col items-center gap-1", currentView === 'dashboard' ? "text-secondary" : "text-on-surface-variant")}
      >
        <LayoutDashboard className="w-6 h-6" />
      </button>
      <button 
        onClick={() => onViewChange('inventory')}
        className={cn("flex flex-col items-center gap-1", currentView === 'inventory' ? "text-secondary" : "text-on-surface-variant")}
      >
        <Package className="w-6 h-6" />
      </button>
      <button 
        onClick={() => onViewChange('movements')}
        className={cn("flex flex-col items-center gap-1", currentView === 'movements' ? "text-secondary" : "text-on-surface-variant")}
      >
        <ArrowLeftRight className="w-6 h-6" />
      </button>
      <button 
        onClick={() => onViewChange('products')}
        className={cn("flex flex-col items-center gap-1", currentView === 'products' ? "text-secondary" : "text-on-surface-variant")}
      >
        <Layers className="w-6 h-6" />
      </button>
      <button 
        onClick={() => onViewChange('suppliers')}
        className={cn("flex flex-col items-center gap-1", currentView === 'suppliers' ? "text-secondary" : "text-on-surface-variant")}
      >
        <Factory className="w-6 h-6" />
      </button>
      <button 
        onClick={() => onViewChange('reports')}
        className={cn("flex flex-col items-center gap-1", currentView === 'reports' ? "text-secondary" : "text-on-surface-variant")}
      >
        <FileText className="w-6 h-6" />
      </button>
    </nav>
  );
}

export function TopBar({ onViewChange, searchQuery, onSearchChange }: {
  onViewChange?: (view: View) => void,
  searchQuery?: string,
  onSearchChange?: (query: string) => void
}) {
  const { user, logout } = useAuth();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({ lowStock: 0, criticalStock: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/products');
      const products = await response.json();

      const lowStock = products.filter((p: any) => {
        const pct = (p.stock / p.maxStock) * 100;
        return pct > 0 && pct <= 20;
      }).length;

      const criticalStock = products.filter((p: any) => {
        const pct = (p.stock / p.maxStock) * 100;
        return pct > 0 && pct <= 5;
      }).length;

      setStats({
        lowStock,
        criticalStock,
        totalProducts: products.length
      });

      // Create notifications from low stock items
        const notifs = products.filter((p: any) => {
          const pct = (p.stock / p.maxStock) * 100;
          return pct > 0 && pct <= 20;
        }).slice(0, 5).map((p: any) => {
          const pct2 = (p.stock / p.maxStock) * 100;
          return ({
            id: p.id,
            type: pct2 <= 5 ? 'critical' : 'warning',
            message: pct2 <= 5 ? 'Estoque crítico' : 'Estoque baixo',
            product: p.name,
            stock: p.stock,
            maxStock: p.maxStock
          });
        });

      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const clearSearch = () => {
    onSearchChange?.('');
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-outline-variant/10">
      {/* Top Bar Container */}
      <div className="flex flex-col">
        {/* Main Row */}
        <div className="flex items-center justify-between w-full px-4 md:px-6 py-3 h-16">
          <div className="flex items-center md:hidden">
            <h1 className="text-sm font-black text-on-surface tracking-tight uppercase font-headline">Vault</h1>
          </div>

          {/* Date Display (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 text-on-surface-variant">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">{formatDate()}</span>
          </div>

          {/* Search Field */}
          <div className="flex items-center bg-surface-container-low rounded-lg px-3 py-1.5 w-full max-w-[200px] md:max-w-72 border border-white/5 focus-within:border-secondary/30 transition-all">
            <Search className="w-4 h-4 text-on-surface-variant mr-2" />
            <input
              type="text"
              placeholder="Pesquisar produtos, SKU..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs md:text-sm text-on-surface w-full placeholder:text-on-surface-variant/50"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="ml-1 hover:text-on-surface">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 md:p-2 text-on-surface-variant hover:bg-surface-bright transition-colors rounded-full relative"
              >
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
                {stats.criticalStock > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-tertiary rounded-full animate-pulse"></span>
                )}
                {stats.lowStock > 0 && stats.criticalStock === 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-surface-container rounded-xl border border-outline-variant/20 shadow-xl overflow-hidden z-50">
                  <div className="p-4 border-b border-outline-variant/10">
                    <h3 className="text-sm font-bold text-on-surface">Notificações</h3>
                    <p className="text-xs text-on-surface-variant">
                      {loading ? 'Carregando...' : `${stats.lowStock} produto(s) com estoque baixo`}
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-on-surface-variant text-xs">
                        Nenhuma notificação
                      </div>
                    ) : (
                      notifications.map((notif: any) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-3 border-b border-outline-variant/5 hover:bg-surface-container/50 transition-colors cursor-pointer",
                            notif.type === 'critical' ? "bg-tertiary/5" : "bg-surface-container/30"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle className={cn(
                              "w-4 h-4 mt-0.5",
                              notif.type === 'critical' ? "text-tertiary" : "text-yellow-500"
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-on-surface truncate">{notif.product}</p>
                              <p className="text-[10px] text-on-surface-variant">
                                {notif.message} • {notif.stock}/{notif.maxStock} unidades
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {stats.lowStock > 0 && (
                    <button
                      onClick={() => {
                        onViewChange?.('inventory');
                        setShowNotifications(false);
                      }}
                      className="w-full p-3 text-center text-xs font-bold text-secondary hover:bg-surface-container/50 transition-colors border-t border-outline-variant/10"
                    >
                      VER TODOS OS({stats.lowStock})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Deleted Items */}
            <button
              onClick={() => onViewChange?.('deleted-items')}
              className="hidden md:block p-2 text-on-surface-variant hover:bg-surface-bright transition-colors rounded-full"
              title="Itens Excluídos"
            >
              <History className="w-6 h-6" />
            </button>

            {/* Divider */}
            <div className="h-6 md:h-8 w-px bg-outline-variant/20 mx-1 md:mx-2"></div>

            {/* User Section */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end">
<p className="text-xs font-bold text-on-surface">{user?.name || 'Usuário'}</p>
<p className="text-[10px] text-on-surface-variant uppercase tracking-tighter">{user?.email || ''}</p>
              </div>
              <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-surface-container-highest overflow-hidden ring-2 ring-surface-container-highest">
                <img
src={user ? `https://picsum.photos/seed/${user.email}/100/100` : "https://picsum.photos/seed/user/100/100"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 md:p-2 text-on-surface-variant hover:text-tertiary transition-colors rounded-full"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="hidden md:flex items-center justify-between px-4 md:px-6 py-2 bg-surface-container/30 border-t border-outline-variant/5">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-on-surface-variant">
              <Package className="w-3 h-3 inline mr-1" />
              {stats.totalProducts} produtos
            </span>
            <span className="text-yellow-600">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {stats.lowStock} baixo estoque
            </span>
            <span className="text-tertiary">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              {stats.criticalStock} crítico
            </span>
          </div>
          <button
            onClick={() => onViewChange?.('products')}
            className="flex items-center gap-1 text-xs text-secondary hover:underline"
          >
            <PackagePlus className="w-3 h-3" />
            Novo Produto
          </button>
        </div>
      </div>
    </header>
  );
}

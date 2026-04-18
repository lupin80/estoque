import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Truck, 
  Filter, 
  PlusCircle, 
  MoreVertical,
  ChevronLeft,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ProductModal } from './ProductModal';
import { ConfirmationModal } from './ConfirmationModal';

interface InventoryListProps {
  onViewProduct?: (id: string) => void;
  searchQuery?: string;
}

export function InventoryList({ onViewProduct, searchQuery }: InventoryListProps) {
  // Simulação de usuário logado conforme definido no banco de dados
  const currentUser = { role: 'operator' }; 
  const isAdmin = currentUser.role === 'admin';
  const canEdit = ['admin', 'operator'].includes(currentUser.role);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [pendingEntriesCount, setPendingEntriesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/products');
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
        
        // Simplificado: buscar movimentos para contar entradas recentes
        const moveRes = await fetch('http://localhost:3000/api/movements');
        const movements = await moveRes.json();
        const moveArray = Array.isArray(movements) ? movements : [];
        setPendingEntriesCount(moveArray.filter((m: any) => m.type === 'entry').length);
      } catch (error) {
        console.error("Erro ao carregar inventário:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    setProductToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const product = products.find(p => p.id === productToDelete);
    if (!product) return;

    try {
      await fetch(`http://localhost:3000/api/products/${productToDelete}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, status: 'excluido' })
      });
      
      setProducts(prev => prev.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const totalValuation = products.reduce((acc, p) => {
    const base = (Number(p.price) || 0) * (Number(p.stock) || 0);
    const taxes = 1 + (Number(p.icms || 0) + Number(p.ipi || 0)) / 100;
    return acc + (base * taxes);
  }, 0);
  const lowStockAlerts = products.filter(p => (Number(p.stock) || 0) <= ((Number(p.maxStock) || 0) * 0.2)).length;

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      (p.name?.toLowerCase() || '').includes(term) ||
      (p.sku?.toLowerCase() || '').includes(term) ||
      (p.category?.toLowerCase() || '').includes(term)
    );
  });

  const formatValuation = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}K`;
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  if (!loading && products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-4 relative">
          <Package className="w-12 h-12 text-on-surface-variant opacity-20" />
          <div className="absolute inset-0 border-2 border-dashed border-outline-variant/30 rounded-full animate-[spin_15s_linear_infinite]"></div>
        </div>
        
        <div className="max-w-md space-y-3">
          <h2 className="text-3xl md:text-4xl font-black font-headline tracking-tighter text-on-surface uppercase">Inventário Zerado.</h2>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            Não há ativos registrados no sistema. O monitoramento de precisão começará assim que você adicionar itens ao seu catálogo.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-secondary to-secondary-container text-on-secondary px-10 py-4 rounded-lg font-black text-xs md:text-sm flex items-center justify-center gap-3 shadow-xl shadow-secondary/10 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest"
        >
          <PlusCircle className="w-5 h-5" />
          Adicionar Primeiro Ativo
        </button>

        <ProductModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          initialData={editingProduct}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <nav className="flex items-center gap-2 text-on-surface-variant text-[10px] md:text-xs font-medium mb-2 uppercase tracking-widest">
            <span>Cofre</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-secondary font-bold">Inventário</span>
          </nav>
          <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter text-on-surface">Ativos de Precisão.</h2>
          <p className="text-on-surface-variant mt-3 text-sm md:text-lg max-w-lg leading-relaxed">
            Uma visão curada da sua distribuição global de estoque. Monitore a avaliação e métricas de saúde em todos os nós.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "px-6 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all border border-white/5",
              showFilters ? "bg-secondary text-on-secondary" : "bg-surface-container-high text-on-surface hover:bg-surface-bright"
            )}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Valoração Total" value={formatValuation(totalValuation)} trend="+12% vs mês anterior" color="border-secondary" trendIcon={<TrendingUp className="w-3 h-3" />} />
        <StatCard title="SKUs Ativos" value={products.length.toString()} subtitle="Em tempo real" color="border-primary" />
        <StatCard title="Alertas de Estoque Baixo" value={lowStockAlerts.toString()} subtitle="Ação imediata necessária" color="border-tertiary" valueColor="text-tertiary" />
        <div className="bg-surface-container-low p-5 md:p-6 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors shadow-sm border border-white/5">
          <div>
            <p className="text-[10px] md:text-xs text-on-surface-variant uppercase tracking-widest mb-2 font-bold">Entradas Recentes</p>
            <h3 className="text-2xl md:text-3xl font-black font-headline text-on-surface">{pendingEntriesCount}</h3>
          </div>
          <Truck className="w-8 h-8 text-on-surface-variant group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center gap-4 md:gap-6 border border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[10px] md:text-xs text-on-surface-variant uppercase font-black">Categoria:</span>
            <select className="bg-transparent border-none text-xs md:text-sm text-secondary font-bold focus:ring-0 cursor-pointer p-0 pr-6">
              <option>Todas as Categorias</option>
              <option>Eletrônicos</option>
              <option>Vestuário</option>
              <option>Hardware</option>
            </select>
          </div>
          <div className="hidden md:block h-4 w-px bg-outline-variant/30"></div>
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <span className="text-[10px] md:text-xs text-on-surface-variant uppercase font-black shrink-0">Status:</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase whitespace-nowrap">Em Estoque</button>
              <button className="px-3 py-1 rounded-full hover:bg-white/5 text-on-surface-variant text-[10px] font-black uppercase whitespace-nowrap">Baixo Estoque</button>
              <button className="px-3 py-1 rounded-full hover:bg-white/5 text-on-surface-variant text-[10px] font-black uppercase whitespace-nowrap">Esgotado</button>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
            <span className="text-[10px] md:text-xs text-on-surface-variant font-medium">1-{products.length} de {products.length}</span>
            <div className="flex gap-1">
              <button className="p-1 text-on-surface-variant hover:text-on-surface transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 text-on-surface-variant hover:text-on-surface transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] md:min-w-0">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] uppercase tracking-[0.2em] font-bold">
                <th className="px-6 md:px-8 py-5">SKU</th>
                <th className="px-6 py-5">Nome do Produto</th>
                <th className="px-4 md:px-6 py-5 hidden lg:table-cell">Categoria</th>
                <th className="px-6 py-5">Nível de Estoque</th>
                <th className="px-6 py-5">Preço Unit.</th>
                <th className="px-6 py-5">Valor Total (c/ Imp.)</th>
                <th className="px-6 py-5 hidden sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-on-surface-variant font-bold uppercase tracking-widest">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item, idx) => {
                  // Cálculo dinâmico do Rank para a Curva ABC
                  const sorted = [...products].sort((a, b) => 
                    ((Number(b.price) || 0) * (Number(b.stock) || 0)) - ((Number(a.price) || 0) * (Number(a.stock) || 0))
                  );
                  const totalStockVal = sorted.reduce((acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);
                  const pos = sorted.findIndex(p => p.id === item.id);
                  const cumVal = sorted.slice(0, pos + 1).reduce((acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 0), 0);
                  const cumPercent = cumVal / (totalStockVal || 1);
                  const rank = cumPercent <= 0.8 ? 'A' : cumPercent <= 0.95 ? 'B' : 'C';

                  return (
                  <tr 
                    key={item.id || idx} 
                    onClick={() => setSelectedProductId(item.id === selectedProductId ? null : item.id)}
                    className={cn(
                      "transition-all duration-300 border-b border-white/5 last:border-0 group cursor-pointer relative",
                      selectedProductId === item.id 
                        ? "bg-secondary/10 shadow-[inset_0_0_30px_rgba(102,221,139,0.05)]" 
                        : "hover:bg-surface-container/50"
                    )}
                  >
                    {selectedProductId === item.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_15px_rgba(102,221,139,0.6)] z-10" />
                    )}
                    <td className="px-6 md:px-8 py-6 font-mono text-[10px] md:text-xs text-on-surface-variant">{item.sku}</td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <span className={cn(
                          "w-5 h-5 flex items-center justify-center rounded text-[8px] font-black shrink-0 border",
                          rank === 'A' ? "bg-secondary/20 text-secondary border-secondary/30" :
                          rank === 'B' ? "bg-primary/20 text-primary border-primary/30" :
                          "bg-tertiary/20 text-tertiary border-tertiary/30"
                        )} title={`Classe ${rank}`}>{rank}</span>
                        <div className="w-12 h-12 aspect-square rounded-lg bg-surface-container-highest flex items-center justify-center overflow-hidden shrink-0 border border-outline-variant/10 shadow-sm">
                          <img src={item.image || 'https://picsum.photos/seed/product/100/100'} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex flex-col">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewProduct?.(item.id);
                            }}
                            className="font-bold text-on-surface hover:text-secondary transition-colors leading-tight text-left"
                          >
                            {item.name}
                          </button>
                          <span className="text-[10px] text-on-surface-variant lg:hidden mt-0.5">{item.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-6 text-on-surface-variant hidden lg:table-cell">{item.category}</td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className={cn("font-bold", (Number(item.stock) || 0) <= ((Number(item.maxStock) || 0) * 0.2) ? "text-tertiary" : "")}>{(Number(item.stock) || 0)}</span>
                        <div className="w-16 h-1 bg-surface-bright rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full", (Number(item.stock) || 0) <= ((Number(item.maxStock) || 0) * 0.2) ? "bg-tertiary" : "bg-secondary")} 
                            style={{ width: `${Math.min(100, ((Number(item.stock) || 0) / (Number(item.maxStock) || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-bold text-on-surface-variant">R$ {Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-6 font-black text-secondary">
                      R$ {((Number(item.price) || 0) * (Number(item.stock) || 0) * (1 + ((Number(item.icms) || 0) + (Number(item.ipi) || 0)) / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-6 hidden sm:table-cell">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                          (Number(item.stock) || 0) > ((Number(item.maxStock) || 0) * 0.2) ? "bg-secondary/10 text-secondary" : "bg-tertiary/10 text-tertiary"
                      )}>
                          {(Number(item.stock) || 0) > ((Number(item.maxStock) || 0) * 0.2) ? 'Estável' : 'Baixo Estoque'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-on-surface-variant hover:text-tertiary transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        initialData={editingProduct}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita e removerá todos os registros associados."
        confirmText="Excluir"
        cancelText="Manter"
      />
    </div>
  );
}

function StatCard({ title, value, trend, subtitle, color, trendIcon, valueColor = "text-on-surface" }: any) {
  return (
    <div className={cn("bg-surface-container-low p-5 md:p-6 rounded-xl border-l-4 shadow-sm", color)}>
      <p className="text-[10px] md:text-xs text-on-surface-variant uppercase tracking-widest mb-2 font-bold">{title}</p>
      <h3 className={cn("text-2xl md:text-3xl font-black font-headline", valueColor)}>{value}</h3>
      {trend && (
        <div className="flex items-center gap-1 text-secondary mt-2 text-xs">
          {trendIcon}
          <span>{trend}</span>
        </div>
      )}
      {subtitle && <p className="text-on-surface-variant mt-2 text-xs">{subtitle}</p>}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Grid, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash2, 
  ArrowRight,
  TrendingUp,
  MoreVertical,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ProductModal } from './ProductModal';
import { ConfirmationModal } from './ConfirmationModal';
import { CategoryManagementModal } from './CategoryManagementModal';

interface ProductCatalogProps {
  onViewProduct?: (id: string) => void;
  searchQuery?: string;
}

export function ProductCatalog({ onViewProduct, searchQuery }: ProductCatalogProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const isAdmin = true;
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/products');
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          console.error("API de produtos não retornou um array:", data);
          setProducts([]);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos do SQLite:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
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

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      (p.name?.toLowerCase() || '').includes(term) ||
      (p.sku?.toLowerCase() || '').includes(term) ||
      (p.category?.toLowerCase() || '').includes(term)
    );
  });

  if (!loading && products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-4 relative">
          <Grid className="w-12 h-12 text-on-surface-variant opacity-20" />
          <div className="absolute inset-0 border-2 border-dashed border-outline-variant/30 rounded-full animate-[spin_15s_linear_infinite]"></div>
        </div>
        
        <div className="max-w-md space-y-3">
          <h2 className="text-3xl md:text-4xl font-black font-headline tracking-tighter text-on-surface uppercase">Catálogo Inexistente.</h2>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            Sua biblioteca de SKUs está vazia. Defina seus produtos mestres para habilitar a gestão de estoque e movimentações.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-surface-container-high text-on-surface px-6 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-white/5 hover:bg-surface-bright transition-all"
          >
            <List className="w-4 h-4" />
            Gerenciar Categorias
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-secondary to-secondary-container text-on-secondary px-6 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-secondary/10 transition-all hover:scale-[1.01] active:scale-95 uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Produto
          </button>
        </div>

        <ProductModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          initialData={editingProduct}
        />
        <CategoryManagementModal 
          isOpen={isCategoryModalOpen} 
          onClose={() => setIsCategoryModalOpen(false)} 
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-7xl mx-auto w-full">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-none mb-2 font-headline">Catálogo de Produtos</h1>
          <p className="text-on-surface-variant font-body text-lg max-w-xl">Gerencie definições mestres de ativos e hierarquias de SKU.</p>
        </div>
        <button 
          onClick={() => setIsCategoryModalOpen(true)}
          className="bg-surface-container-high text-on-surface px-5 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border border-white/5 hover:bg-surface-bright transition-all"
        >
          <List className="w-4 h-4" />
          Gerenciar Categorias
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-secondary text-on-secondary px-6 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-secondary/10 transition-all hover:scale-[1.01] active:scale-95 uppercase tracking-widest w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-surface-container-low p-6 flex flex-col justify-between min-h-[160px] border-l-4 border-secondary">
          <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Total de SKUs Ativos</span>
          <div className="flex items-baseline gap-4 mt-2">
            <span className="text-6xl font-black text-on-surface tracking-tighter">{products.length}</span>
            <span className="text-secondary text-sm flex items-center gap-1 font-bold">
              <TrendingUp className="w-4 h-4" /> +12%
            </span>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 flex flex-col justify-between min-h-[160px] border-l-4 border-tertiary">
          <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Alertas de Estoque Baixo</span>
          <span className="text-6xl font-black text-tertiary tracking-tighter">
            {products.filter(p => (Number(p.stock) || 0) <= ((Number(p.maxStock) || 0) * 0.2)).length}
          </span>
        </div>
        <div className="bg-surface-container-low p-6 flex flex-col justify-between min-h-[160px] border-l-4 border-primary">
          <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Sincronização Pendente</span>
          <span className="text-6xl font-black text-primary tracking-tighter">00</span>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-6 pb-8 snap-x scrollbar-thin scrollbar-thumb-secondary/20 scrollbar-track-transparent px-2 -mx-2">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-on-surface-variant font-bold uppercase tracking-widest">
              Nenhum produto encontrado para "{searchQuery}"
            </div>
          ) : (
            filteredProducts.map((p) => (
              <div 
                key={p.id} 
                className={cn(
                  "group bg-surface-container overflow-hidden flex flex-col relative transition-all duration-300 border-l-4 cursor-pointer min-w-[200px] sm:min-w-[220px] max-w-[220px] snap-start shrink-0",
                  selectedProductId === p.id 
                    ? "border-secondary bg-secondary/5 shadow-[0_0_30px_rgba(102,221,139,0.1)] scale-[1.02] z-10" 
                    : "border-transparent hover:border-secondary/50"
                )}
                onClick={() => setSelectedProductId(p.id === selectedProductId ? null : p.id)}
              >
                <div className={cn(
                  "absolute top-3 right-3 z-20 transition-opacity flex gap-1",
                  selectedProductId === p.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(p);
                    }}
                    className="bg-surface-container-highest/90 hover:bg-secondary hover:text-on-secondary p-2 rounded-full text-on-surface-variant transition-all backdrop-blur-sm shadow-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(p.id);
                      }}
                      className="bg-surface-container-highest/90 hover:bg-tertiary hover:text-on-tertiary p-2 rounded-full text-on-surface-variant transition-all backdrop-blur-sm shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Rank Badge Logic */}
                {(() => {
                  const sorted = [...products].sort((a,b) => (b.price*b.stock) - (a.price*a.stock));
                  const pos = sorted.findIndex(item => item.id === p.id);
                  const cumVal = sorted.slice(0, pos + 1).reduce((acc, item) => acc + (item.price*item.stock), 0);
                  const rank = (cumVal / (sorted.reduce((acc, item) => acc + (item.price*item.stock), 0) || 1)) <= 0.8 ? 'A' : (cumVal / (sorted.reduce((acc, item) => acc + (item.price*item.stock), 0) || 1)) <= 0.95 ? 'B' : 'C';
                  return (
                    <div className={cn(
                      "absolute top-3 left-3 z-20 px-2 py-0.5 rounded font-black text-[9px] shadow-lg border backdrop-blur-sm",
                      rank === 'A' ? "bg-secondary/80 text-on-secondary border-secondary" :
                      rank === 'B' ? "bg-primary/80 text-on-primary border-primary" :
                      "bg-tertiary/80 text-on-tertiary border-tertiary"
                    )}>CLASSE {rank}</div>
                  );
                })()}
                <div className="aspect-[3/4] max-h-32 bg-surface-container-highest overflow-hidden relative flex items-center justify-center border-b border-outline-variant/5">
                  <img src={p.image || 'https://picsum.photos/seed/product/400/400'} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                  {(Number(p.stock) || 0) <= ((Number(p.maxStock) || 0) * 0.2) && (
                    <div className="absolute top-3 left-3 bg-tertiary-container/80 backdrop-blur-md text-on-tertiary-container px-3 py-1 rounded-full text-[10px] font-bold z-10 uppercase">
                      Estoque Baixo
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-on-surface group-hover:text-secondary transition-colors font-headline truncate">{p.name}</h3>
                      <p className="text-[9px] text-on-surface-variant font-medium tracking-tight">SKU: {p.sku}</p>
                    </div>
                    <span className="bg-secondary-container/20 text-secondary px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ml-2">{p.category || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 bg-surface-container-highest/30 px-3 rounded-lg border border-outline-variant/5">
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1.5"><Package className="w-3 h-3" /> Saldo em Estoque</span>
                    <span className={cn("text-sm font-black", (Number(p.stock) || 0) < ((Number(p.maxStock) || 0) * 0.2) ? "text-tertiary" : "text-secondary")}>
                      {(Number(p.stock) || 0)} UN
                    </span>
                  </div>
                  <div className="items-center justify-between pt-2 border-t border-outline-variant/20 flex">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-on-surface-variant uppercase">Valor Total (c/ Impostos)</span>
                      <span className="text-xl font-black text-secondary">
                        R$ {((Number(p.price) || 0) * (Number(p.stock) || 0) * (1 + ((Number(p.icms) || 0) + (Number(p.ipi) || 0)) / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProduct?.(p.id);
                      }}
                      className="text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-1 text-sm font-semibold group/btn"
                    >
                      Detalhes <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <ProductModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        initialData={editingProduct}
      />
      <CategoryManagementModal 
        isOpen={isCategoryModalOpen} 
        onClose={() => setIsCategoryModalOpen(false)} 
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto do catálogo? Esta ação removerá o ativo permanentemente."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}

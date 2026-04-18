import { useState, useEffect } from 'react';
import { 
  Trash2, 
  RefreshCcw, 
  Search, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';

interface DeletedItemsProps {
  searchQuery?: string;
}

export function DeletedItems({ searchQuery }: DeletedItemsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeleted = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/products/deleted');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching deleted products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeleted();
  }, []);

  const handleRestore = (product: any) => {
    setSelectedProduct(product);
    setIsRestoreModalOpen(true);
  };

  const handleDeletePermanent = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedProduct) return;
    try {
      await fetch(`http://localhost:3000/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedProduct, status: 'ativo' })
      });
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      setIsRestoreModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error restoring product:", error);
    }
  };

  const confirmDeletePermanent = async () => {
    if (!selectedProduct) return;
    try {
      await fetch(`http://localhost:3000/api/products/${selectedProduct.id}`, {
        method: 'DELETE'
      });
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  });

  if (!loading && products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-4 relative">
          <Trash2 className="w-12 h-12 text-on-surface-variant opacity-20" />
          <div className="absolute inset-0 border-2 border-dashed border-outline-variant/30 rounded-full"></div>
        </div>
        
        <div className="max-w-md space-y-3">
          <h2 className="text-3xl md:text-4xl font-black font-headline tracking-tighter text-on-surface uppercase">Lixeira Vazia.</h2>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            Não há produtos marcados como excluídos no momento. Todos os seus ativos estão ativos ou foram removidos permanentemente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-7xl mx-auto w-full">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-none mb-2 font-headline">Itens Excluídos</h1>
          <p className="text-on-surface-variant font-body text-lg max-w-xl">Gerencie produtos removidos e restaure ativos se necessário.</p>
        </div>
      </section>

      <section className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <Search className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">
            {searchQuery ? `Resultados na lixeira para: ${searchQuery}` : 'Todos os Itens Excluídos'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          <AlertTriangle className="w-4 h-4 text-tertiary" />
          <span>Itens nesta lista não aparecem no Dashboard</span>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-highest/20">
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Produto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">SKU</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Categoria</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Data de Exclusão</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest/10">
                {filteredProducts.map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedRowId(p.id === selectedRowId ? null : p.id)}
                    className={cn(
                      "transition-all duration-300 group cursor-pointer relative",
                      selectedRowId === p.id 
                        ? "bg-secondary/10 shadow-[inset_0_0_30px_rgba(102,221,139,0.05)]" 
                        : "hover:bg-surface-container"
                    )}
                  >
                    {selectedRowId === p.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_15px_rgba(102,221,139,0.6)] z-10" />
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-surface-container-highest rounded-lg overflow-hidden grayscale opacity-60">
                          <img src={p.image || 'https://picsum.photos/seed/product/100/100'} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <span className="font-bold text-on-surface">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant font-mono">{p.sku}</td>
                    <td className="px-6 py-4">
                      <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{p.category}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleString('pt-BR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleRestore(p)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded bg-secondary/10 text-secondary hover:bg-secondary hover:text-on-secondary transition-all text-[10px] font-bold uppercase tracking-widest"
                          title="Restaurar Produto"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" /> Restaurar
                        </button>
                        <button
                          onClick={() => handleDeletePermanent(p)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded bg-tertiary/10 text-tertiary hover:bg-tertiary hover:text-on-tertiary transition-all text-[10px] font-bold uppercase tracking-widest"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={confirmRestore}
        title="Restaurar Produto"
        message={`Deseja restaurar "${selectedProduct?.name}" para o catálogo ativo?`}
        confirmText="Restaurar"
        cancelText="Cancelar"
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeletePermanent}
        title="Excluir Permanentemente"
        message={`AVISO: Esta ação excluirá "${selectedProduct?.name}" permanentemente do banco de dados. Esta ação não pode ser desfeita.`}
        confirmText="Excluir Permanentemente"
        cancelText="Cancelar"
      />
    </div>
  );
}

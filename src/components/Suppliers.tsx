import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  PlusCircle,
  Truck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';
import { SupplierModal } from './SupplierModal';

interface SuppliersProps {
  searchQuery?: string;
}

export function Suppliers({ searchQuery }: SuppliersProps) {
  const isAdmin = true; // Autenticação removida, liberando acesso total
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/suppliers');
        const data = await response.json();
        setSuppliers(data);
      } catch (error) {
        console.error("Erro ao carregar fornecedores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  const handleDelete = async (id: string) => {
    setSupplierToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await fetch(`http://localhost:3000/api/suppliers/${supplierToDelete}`, {
        method: 'DELETE'
      });
      setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete));
      setSupplierToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      (s.name?.toLowerCase() || '').includes(term) ||
      (s.code?.toLowerCase() || '').includes(term) ||
      (s.cnpj?.toLowerCase() || '').includes(term) ||
      (s.city?.toLowerCase() || '').includes(term)
    );
  });

  if (!loading && suppliers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-4 relative">
          <Truck className="w-12 h-12 text-on-surface-variant opacity-20" />
          <div className="absolute inset-0 border-2 border-dashed border-outline-variant/30 rounded-full animate-[spin_15s_linear_infinite]"></div>
        </div>
        
        <div className="max-w-md space-y-3">
          <h2 className="text-3xl md:text-4xl font-black font-headline tracking-tighter text-on-surface uppercase">Sem Parceiros.</h2>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            Sua rede de fornecedores está vazia. Cadastre seus parceiros logísticos para habilitar o rastreamento de origem e destino.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-secondary to-secondary-container text-on-secondary px-10 py-4 rounded-lg font-black text-xs md:text-sm flex items-center justify-center gap-3 shadow-xl shadow-secondary/10 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest"
        >
          <PlusCircle className="w-5 h-5" />
          Adicionar Primeiro Fornecedor
        </button>

        <SupplierModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          initialData={editingSupplier}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 max-w-7xl mx-auto w-full space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight uppercase mb-2 font-headline">Gestão de Fornecedores</h1>
          <p className="text-on-surface-variant">Visualize e gerencie seu ecossistema de parceiros logísticos e industriais.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-secondary to-secondary-container text-on-secondary px-8 py-4 rounded-sm font-headline font-extrabold text-sm tracking-widest uppercase transition-transform hover:scale-[1.02] active:scale-95 shadow-lg flex items-center gap-3"
          >
            <PlusCircle className="w-5 h-5" />
            ADICIONAR NOVO FORNECEDOR
          </button>
        )}
      </header>
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatItem label="Ativos (30 dias)" value={suppliers.length.toString()} />
        <StatItem label="Aguardando Revisão" value="0" accent="bg-tertiary" valueColor="text-tertiary" />
        <StatItem label="Novos Fornecedores" value="0" />
      </section>

      <section className="bg-surface-container-low rounded-sm overflow-hidden border border-outline-variant/10 shadow-xl">
        <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-outline-variant/10">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <Search className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {searchQuery ? `Resultados para: ${searchQuery}` : 'Todos os Fornecedores'}
            </span>
          </div>
          <div className="flex gap-4">
            <button className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <Filter className="w-4 h-4" /> Filtros
            </button>
            <button className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container/50">
                <th className="px-6 py-4 text-left text-[10px] text-on-surface-variant uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-left text-[10px] text-on-surface-variant uppercase tracking-widest">Razão Social</th>
                <th className="px-6 py-4 text-left text-[10px] text-on-surface-variant uppercase tracking-widest">COD</th>
                <th className="px-6 py-4 text-left text-[10px] text-on-surface-variant uppercase tracking-widest">CNPJ</th>
                <th className="px-6 py-4 text-left text-[10px] text-on-surface-variant uppercase tracking-widest">Cidade/UF</th>
                <th className="px-6 py-4 text-center text-[10px] text-on-surface-variant uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-on-surface-variant font-bold uppercase tracking-widest">
                    Nenhum fornecedor encontrado
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr 
                    key={s.id} 
                    onClick={() => setSelectedSupplierId(s.id === selectedSupplierId ? null : s.id)}
                    className={cn(
                      "transition-all duration-300 group cursor-pointer relative",
                      selectedSupplierId === s.id 
                        ? "bg-secondary/10 shadow-[inset_0_0_30px_rgba(102,221,139,0.05)]" 
                        : "hover:bg-surface-container"
                    )}
                  >
                    {selectedSupplierId === s.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_15px_rgba(102,221,139,0.6)] z-10" />
                    )}
                    <td className="px-6 py-5 text-xs text-on-surface-variant truncate max-w-[100px]">{s.id}</td>
                    <td className="px-6 py-5 text-sm font-semibold text-on-surface">{s.name}</td>
                    <td className="px-6 py-5 text-xs text-secondary font-mono">{s.code}</td>
                    <td className="px-6 py-5 text-xs text-on-surface-variant">{s.cnpj}</td>
                    <td className="px-6 py-5 text-xs text-on-surface-variant">{s.city}</td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(s)}
                          className="text-on-surface-variant hover:text-primary transition-colors p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(s.id)}
                            className="text-on-surface-variant hover:text-tertiary transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-6 flex justify-between items-center bg-surface-container-low border-t border-outline-variant/10">
          <span className="text-xs text-on-surface-variant">Exibindo {suppliers.length} fornecedores</span>
          <div className="flex items-center gap-2">
            <button className="p-1 text-on-surface-variant hover:text-on-surface"><ChevronLeft className="w-4 h-4" /></button>
            <button className="w-8 h-8 flex items-center justify-center rounded-sm bg-primary text-on-primary text-xs font-bold">1</button>
            <button className="p-1 text-on-surface-variant hover:text-on-surface"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </section>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Fornecedor"
        message="Tem certeza que deseja excluir este fornecedor? Esta ação removerá o parceiro do ecossistema de ativos."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
      <SupplierModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        initialData={editingSupplier}
      />
    </div>
  );
}

function StatItem({ label, value, color = "text-on-surface", accent, valueColor = color }: any) {
  return (
    <div className="bg-surface-container-low p-6 rounded-sm flex flex-col gap-4 border border-outline-variant/10 relative overflow-hidden">
      {accent && <div className={cn("absolute right-0 top-0 h-full w-1", accent)}></div>}
      <span className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">{label}</span>
      <span className={cn("text-4xl font-headline font-black", valueColor)}>{value}</span>
    </div>
  );
}

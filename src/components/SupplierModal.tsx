import React, { useState, useEffect } from 'react';
import { X, Info, Truck, MapPin, Building2, Phone, Mail } from 'lucide-react';
import { cn } from '../lib/utils';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function SupplierModal({ isOpen, onClose, initialData }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    cnpj: '',
    city: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        cnpj: initialData.cnpj || '',
        city: initialData.city || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || ''
      });
    } else {
      setFormData({
        name: '',
        code: '',
        cnpj: '',
        city: '',
        email: '',
        phone: '',
        address: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = initialData?.id 
        ? `http://localhost:3000/api/suppliers/${initialData.id}` 
        : 'http://localhost:3000/api/suppliers';
      
      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Falha ao salvar fornecedor');

      onClose();
      // Recarrega a página para atualizar a lista de fornecedores e o dropdown do modal de produtos
      window.location.reload(); 
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      alert("Erro ao salvar fornecedor no banco local. Verifique se o servidor está rodando.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface-container-low w-full max-w-2xl rounded-xl border border-outline-variant/20 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 my-8">
        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center sticky top-0 bg-surface-container-low z-10">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight font-headline">
              {initialData ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </h2>
            <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">Gestão de Parceiros Logísticos</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-bright rounded-full text-on-surface-variant transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="p-8 space-y-10" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2">
              <Building2 className="w-5 h-5 text-secondary" />
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Dados Cadastrais</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Razão Social / Nome</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all" 
                  placeholder="ex: Indústrias Titan S.A." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Código Interno (COD)</label>
                <input 
                  type="text" 
                  name="code"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all" 
                  placeholder="FORN-001" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">CNPJ</label>
                <input 
                  type="text" 
                  name="cnpj"
                  required
                  value={formData.cnpj}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all" 
                  placeholder="00.000.000/0000-00" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2">
              <MapPin className="w-5 h-5 text-secondary" />
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Localização e Contato</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Cidade / UF</label>
                <input 
                  type="text" 
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all" 
                  placeholder="São Paulo / SP" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 pl-10 pr-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all" 
                    placeholder="(11) 99999-9999" 
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">E-mail de Contato</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 pl-10 pr-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all" 
                    placeholder="contato@fornecedor.com" 
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Endereço Completo</label>
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all resize-none" 
                  placeholder="Rua Exemplo, 123 - Bairro - CEP 00000-000" 
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant/10 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-md bg-secondary text-on-secondary font-black tracking-tighter shadow-lg shadow-secondary/10 transition-transform active:scale-95 duration-150 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></div>}
              {initialData ? 'ATUALIZAR PARCEIRO' : 'CADASTRAR PARCEIRO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

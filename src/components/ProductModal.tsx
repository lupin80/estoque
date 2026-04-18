import React, { useState, useEffect, useRef } from 'react';
import { X, Info, Receipt, Truck, Package, Upload, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function ProductModal({ isOpen, onClose, initialData }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Componentes',
    price: '',
    stock: '',
    maxStock: '1000',
    location: 'Almoxarifado Geral',
    ncm: '',
    icms: '',
    ipi: '',
    pis: '',
    invoiceNumber: '',
    supplierId: '',
    image: ''
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/suppliers');
        const data = await response.json();
        setSuppliers(data);
      } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      }
    };

    fetchSuppliers();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        category: initialData.category || 'Componentes',
        price: initialData.price?.toString() || '',
        stock: initialData.stock?.toString() || '',
        maxStock: initialData.maxStock?.toString() || '1000',
        location: initialData.location || 'Almoxarifado Geral',
        ncm: initialData.ncm || '',
        icms: initialData.icms?.toString() || '',
        ipi: initialData.ipi?.toString() || '',
        pis: initialData.pis?.toString() || '',
        invoiceNumber: initialData.invoiceNumber || '',
        supplierId: initialData.supplierId || '',
        image: initialData.image || ''
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: 'Componentes',
        price: '',
        stock: '',
        maxStock: '1000',
        location: 'Almoxarifado Geral',
        ncm: '',
        icms: '',
        ipi: '',
        pis: '',
        invoiceNumber: '',
        supplierId: '',
        image: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newStock = Number(formData.stock) || 0;
    const oldStock = initialData ? (Number(initialData.stock) || 0) : 0;
    const stockDiff = newStock - oldStock;

    const data = {
      ...formData,
      price: Number(formData.price) || 0,
      stock: oldStock,
      maxStock: Number(formData.maxStock) || 0,
      icms: Number(formData.icms) || 0,
      ipi: Number(formData.ipi) || 0,
      pis: Number(formData.pis) || 0,
    };

    try {
      const isUpdate = !!initialData?.id;
      const url = isUpdate 
        ? `http://localhost:3000/api/products/${initialData.id}` 
        : 'http://localhost:3000/api/products';
      
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Falha ao salvar produto');

      const productId = isUpdate ? initialData.id : result.id;

      if (stockDiff !== 0) {
        await fetch('http://localhost:3000/api/movements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: stockDiff > 0 ? 'entry' : 'exit',
            productId,
            quantity: Math.abs(stockDiff),
            origin: isUpdate ? 'Edição de Cadastro' : 'Fornecedor',
            destination: 'Almoxarifado Geral',
            note: isUpdate ? `Ajuste manual via editor (De ${oldStock} para ${newStock})` : 'Entrada inicial'
          })
        });
      }

      onClose();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem é muito grande. Máximo 5MB.");
      return;
    }

    const fd = new FormData();
    fd.append('image', file);

    try {
      const response = await fetch('http://localhost:3000/api/products/upload-image', {
        method: 'POST',
        body: fd
      });
      const result = await response.json();
      if (response.ok) {
        setFormData(prev => ({ ...prev, image: result.url }));
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (err) {
      alert("Erro no upload");
    }
  };

  const calculateTotal = () => {
    const price = Number(formData.price) || 0;
    const stock = Number(formData.stock) || 0;
    const icms = Number(formData.icms) || 0;
    const ipi = Number(formData.ipi) || 0;
    
    const base = price * stock;
    return base * (1 + (icms + ipi) / 100);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-surface-container-low w-full max-w-[95vw] sm:max-w-2xl rounded-xl border border-outline-variant/20 shadow-2xl overflow-y-auto animate-in fade-in zoom-in duration-300 my-8 max-h-[calc(100vh-2rem)]">
        <div className="px-6 sm:px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center sticky top-0 bg-surface-container-low z-10">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight font-headline">
              {initialData ? 'Editar Produto' : 'Definição do Produto'}
            </h2>
            <p className="text-[10px] text-on-surface-variant font-bold tracking-widest uppercase">Registro de Ativos do Cofre</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-bright rounded-full text-on-surface-variant transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form className="p-6 sm:p-8 space-y-10" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2">
              <Info className="w-5 h-5 text-secondary" />
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Informações Gerais</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nome do Produto</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all" 
                  placeholder="ex: Sensor Titan X1" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">ID de SKU</label>
                <input 
                  type="text" 
                  name="sku"
                  required
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all" 
                  placeholder="TX-1002-BL" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Categoria</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                >
                  {categories.length === 0 ? (
                    <option value={formData.category}>{formData.category || 'Selecione'}</option>
                  ) : (
                    categories.map((c: any) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Fornecedor</label>
                <select
                  name="supplierId"
                  value={formData.supplierId}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                >
                  <option value="">Sem fornecedor</option>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Localização</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                  placeholder="ex: Sala TI / Almoxarifado"
                />
              </div>

              {/* Visualização de imagem */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Imagem do Ativo</label>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="relative w-20 h-20 aspect-square rounded-xl bg-surface-container-highest border-2 border-dashed border-outline-variant/30 overflow-hidden shrink-0 flex items-center justify-center group/img transition-all hover:border-secondary/50 shadow-inner">
                    {formData.image ? (
                      <>
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                            className="p-2 bg-tertiary text-on-tertiary rounded-full hover:scale-110 transition-transform"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-on-surface-variant/40">
                        <Package className="w-6 h-6" />
                        <span className="text-[8px] font-bold uppercase">Sem Foto</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2.5 rounded-lg bg-surface-container-high text-on-surface font-bold text-xs uppercase tracking-widest flex items-center gap-2 border border-white/5 hover:bg-surface-bright transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Enviar imagem
                      </button>
                      {formData.image && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                          className="px-4 py-2.5 rounded-lg bg-tertiary/10 text-tertiary font-bold text-xs uppercase tracking-widest flex items-center gap-2 border border-tertiary/20 hover:bg-tertiary/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      PNG/JPG/WebP, até 5MB. A imagem é usada no catálogo e nos detalhes do ativo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2">
              <Truck className="w-5 h-5 text-secondary" />
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Estoque & Precificação</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Preço Unitário (R$)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Estoque Atual</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Estoque Máximo</label>
                <input
                  type="number"
                  name="maxStock"
                  value={formData.maxStock}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                  placeholder="1000"
                />
              </div>
              <div className="md:col-span-3 rounded-xl border border-white/5 bg-surface-container-highest/30 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Valoração total estimada (c/ impostos)</p>
                  <p className="text-lg font-black text-secondary tracking-tight">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-xs text-on-surface-variant text-right">
                  <p>ICMS + IPI aplicados automaticamente</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2">
              <Receipt className="w-5 h-5 text-secondary" />
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Fiscal & Tributos</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">NCM</label>
                <input
                  type="text"
                  name="ncm"
                  value={formData.ncm}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                  placeholder="ex: 8471.30.12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nota Fiscal</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                  placeholder="ex: 123456"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">ICMS (%)</label>
                <input
                  type="number"
                  name="icms"
                  value={formData.icms}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">IPI (%)</label>
                <input
                  type="number"
                  name="ipi"
                  value={formData.ipi}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">PIS (%)</label>
                <input
                  type="number"
                  name="pis"
                  value={formData.pis}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-3 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-surface-container-high text-on-surface font-bold text-sm border border-white/10 hover:bg-surface-bright transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={cn(
                'px-6 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all',
                loading
                  ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                  : 'bg-secondary text-on-secondary hover:brightness-110 shadow-secondary/10'
              )}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

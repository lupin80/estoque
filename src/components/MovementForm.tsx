import React, { useState, useEffect } from 'react';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCcw, 
  Package, 
  MapPin, 
  Navigation, 
  Calendar, 
  Info, 
  ArrowRight,
  ChevronDown,
  Plus,
  ArrowRightLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

export function MovementForm() {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [newDestName, setNewDestName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'exit',
    productId: '',
    targetProductId: '',
    origin: 'Almoxarifado Geral',
    destination: 'Almoxarifado Geral',
    quantity: ''
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [filter, setFilter] = useState<'all' | 'entry' | 'exit' | 'transfer' | 'product_transfer'>('all');

  useEffect(() => {
    // Update defaults when type changes
    setFormData(prev => {
      if (prev.type === 'exit') {
        const currentDestValid = destinations.some(d => d.name === prev.destination);
        if (!prev.destination || !currentDestValid) {
          return { ...prev, origin: 'Almoxarifado Geral', destination: destinations[0]?.name || '', targetProductId: '' };
        }
        return { ...prev, origin: 'Almoxarifado Geral', targetProductId: '' };
      } else if (prev.type === 'transfer') {
        return { ...prev, origin: 'Almoxarifado Geral', targetProductId: '' };
      } else if (prev.type === 'product_transfer') {
        return { ...prev, origin: 'Almoxarifado Geral', destination: 'Almoxarifado Geral' };
      }
      return prev;
    });
  }, [formData.type, destinations.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, moveRes, destRes] = await Promise.all([
          fetch('http://localhost:3000/api/products'),
          fetch('http://localhost:3000/api/movements'),
          fetch('http://localhost:3000/api/destinations')
        ]);

        const prods = await prodRes.json();
        const moves = await moveRes.json();
        const dests = await destRes.json();

        setProducts(prods);
        setMovements(moves);
        setDestinations(dests);
      } catch (error) {
        console.error("Erro ao conectar com a API SQLite:", error);
        setStatus({ type: 'error', message: 'Não foi possível conectar ao servidor local.' });
      }
    };

    fetchData();
    // Opcional: Polling simples a cada 5 segundos para simular tempo real
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestName.trim()) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDestName.trim() })
      });
      if (response.ok) {
        setNewDestName('');
        setIsDestModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao salvar destino:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!formData.productId || !formData.quantity) {
      setStatus({ type: 'error', message: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    if (!product) {
      setStatus({ type: 'error', message: 'Produto não encontrado.' });
      return;
    }

    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setStatus({ type: 'error', message: 'Quantidade inválida.' });
      return;
    }

    setLoading(true);
    try {
      // Sanitização básica antes do envio
      const response = await fetch('http://localhost:3000/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity: qty,
          // Garante que campos vazios sejam nulos para o SQLite
          targetProductId: formData.targetProductId || null,
          origin: formData.origin || 'Almoxarifado Geral',
          destination: formData.destination || 'Almoxarifado Geral'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar movimentação');
      }

      setStatus({ type: 'success', message: 'Movimentação registrada e estoque atualizado com sucesso!' });
      setFormData(prev => ({ ...prev, quantity: '', productId: '', targetProductId: '' }));
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredMovements = movements
    .filter(m => filter === 'all' || m.type === filter)
    .filter(m => products.some(p => p.id === m.productId));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <section className="flex-1 overflow-y-auto pb-24 md:pb-6 p-4 md:p-8 lg:p-12 bg-surface">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 gap-8 lg:gap-12 items-start">
          {/* Left Column: Header and Form */}
          <div className="lg:col-span-full space-y-8">
            <div className="animate-in fade-in slide-in-from-left duration-700">
              <span className="text-secondary font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] block mb-2">Registro de Inventário</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black font-headline text-on-surface leading-tight tracking-tighter">Movimentação de Estoque</h2>
              <p className="text-on-surface-variant mt-4 text-sm md:text-base max-w-md leading-relaxed">Registre entradas e saídas de armazém com precisão cirúrgica.</p>
            </div>

            <form className="space-y-6 animate-in fade-in slide-in-from-bottom duration-700 delay-200" onSubmit={handleSubmit}>
              <div className="bg-surface-container-low p-6 md:p-8 rounded-2xl relative overflow-hidden border border-white/5 shadow-2xl lg:col-span-full">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary shadow-[0_0_15px_rgba(102,221,139,0.5)]"></div>
                <h3 className="text-lg font-bold font-headline mb-6 flex items-center gap-2">
                  <Info className="w-5 h-5 text-secondary" />
                  Detalhes da Operação
                </h3>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Tipo de Movimento</label>
                    <div className="flex flex-row bg-surface-container-highest p-1 rounded-xl gap-1">
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'exit' }))}
                        className={cn(
                          "flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all duration-300 flex items-center justify-center gap-2",
                          formData.type === 'exit' 
                            ? "bg-tertiary text-on-tertiary shadow-[0_0_15px_rgba(255,180,171,0.3)] scale-[1.02]" 
                            : "text-on-surface-variant hover:bg-surface-bright"
                        )}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        Saída
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'transfer' }))}
                        className={cn(
                          "flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all duration-300 flex items-center justify-center gap-2",
                          formData.type === 'transfer' 
                            ? "bg-primary text-on-primary shadow-[0_0_15px_rgba(169,199,255,0.3)] scale-[1.02]" 
                            : "text-on-surface-variant hover:bg-surface-bright"
                        )}
                      >
                        <RefreshCcw className="w-4 h-4" />
                        Transf.
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'product_transfer' }))}
                        className={cn(
                          "flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all duration-300 flex items-center justify-center gap-2",
                          formData.type === 'product_transfer' 
                            ? "bg-on-surface text-surface shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-[1.02]" 
                            : "text-on-surface-variant hover:bg-surface-bright"
                        )}
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        Entre Prods.
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                    <div className={cn(
                      "space-y-2",
                      formData.type === 'product_transfer' ? "lg:col-span-3" : "lg:col-span-4"
                    )}>
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Produto de Origem</label>
                      <div className="relative">
                        <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                        <select 
                          name="productId"
                          required
                          value={formData.productId}
                          onChange={handleChange}
                          className="w-full bg-surface-container-highest border-none rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface appearance-none focus:ring-1 focus:ring-secondary/40"
                        >
                          <option value="">Selecionar produto...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Est: {p.stock}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none w-4 h-4" />
                      </div>
                    </div>

                    {formData.type === 'product_transfer' && (
                      <div className="space-y-2 lg:col-span-3 animate-in fade-in zoom-in duration-300">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Produto de Destino</label>
                        <div className="relative">
                          <ArrowRight className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                          <select 
                            name="targetProductId"
                            required
                            value={formData.targetProductId}
                            onChange={handleChange}
                            className="w-full bg-surface-container-highest border-secondary/20 border rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface appearance-none focus:ring-1 focus:ring-secondary/40"
                          >
                            <option value="">Selecionar produto destino...</option>
                            {products.filter(p => p.id !== formData.productId).map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none w-4 h-4" />
                        </div>
                      </div>
                    )}

                    <div className={cn(
                      "grid grid-cols-2 gap-4",
                      formData.type === 'product_transfer' ? "lg:col-span-4" : "lg:col-span-5"
                    )}>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Origem</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                          <input 
                            type="text" 
                            name="origin"
                            disabled={formData.type === 'entry' || formData.type === 'product_transfer'}
                            value={formData.origin}
                            onChange={handleChange}
                            className="w-full bg-surface-container-highest/50 border-none rounded-lg pl-12 pr-4 py-3 text-sm text-on-surface-variant disabled:cursor-not-allowed" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Destino</label>
                        <div className="relative">
                          <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                          <select 
                            name="destination"
                            disabled={formData.type === 'entry' || formData.type === 'product_transfer'}
                            value={formData.destination}
                            onChange={handleChange}
                            className={cn(
                              "w-full bg-surface-container-highest border-none rounded-lg pl-12 pr-10 py-3 text-sm text-on-surface appearance-none focus:ring-1 focus:ring-secondary/40",
                              (formData.type === 'entry' || formData.type === 'product_transfer') && "text-on-surface-variant cursor-not-allowed"
                            )}
                          >
                            {formData.type === 'entry' || formData.type === 'product_transfer' ? (
                              <option value="Almoxarifado Geral">Almoxarifado Geral</option>
                            ) : (
                              <>
                                <option value="">Selecionar destino...</option>
                                <option value="Almoxarifado Geral">Almoxarifado Geral</option>
                                {destinations.filter(d => d.name !== 'Almoxarifado Geral').map(d => (
                                  <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                              </>
                            )}
                          </select>
                          {formData.type !== 'entry' && formData.type !== 'product_transfer' && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      "space-y-2",
                      formData.type === 'product_transfer' ? "lg:col-span-2" : "lg:col-span-3"
                    )}>
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Quantidade</label>
                      <input 
                        type="number" 
                        name="quantity"
                        required
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="0" 
                        className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-4 text-on-surface focus:ring-1 focus:ring-secondary/40 text-right font-headline text-2xl font-black" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-container p-5 rounded-2xl border border-white/5 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-secondary" /> Registro Temporal
                  </h3>
                  <div className="p-3 bg-surface-container-highest/50 rounded-xl border border-white/5">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.15em] flex items-center gap-2 mb-1">
                      <Info className="w-3 h-3" /> Sincronismo Ativo
                    </p>
                    <div className="text-lg font-mono font-black text-on-surface flex items-baseline gap-2">
                      <span>{currentTime.toLocaleDateString('pt-BR')}</span>
                      <span className="text-secondary opacity-50">|</span>
                      <span className="text-xl">{currentTime.toLocaleTimeString('pt-BR')}</span>
                    </div>
                    <p className="text-[9px] text-on-surface-variant mt-2 italic uppercase tracking-tighter">Horário de referência para auditoria.</p>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-4">
                  {status && (
                    <div className={cn(
                      "p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in zoom-in",
                      status.type === 'success' ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-tertiary/10 text-tertiary border border-tertiary/20"
                    )}>
                      {status.type === 'success' ? <Package className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                      {status.message}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-5 bg-gradient-to-r from-secondary to-secondary-container text-on-secondary font-black font-headline text-sm rounded-xl hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-3 group disabled:opacity-50 shadow-xl shadow-secondary/10"
                  >
                    {loading ? 'PROCESSANDO...' : 'EXECUTAR MOVIMENTO'}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Movement History Section */}
          <div className="lg:col-span-full space-y-6 animate-in fade-in slide-in-from-right duration-700 delay-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-xl md:text-2xl font-black font-headline tracking-tight text-on-surface">Histórico de Movimentações</h3>
              <div className="flex bg-surface-container p-1 rounded-xl gap-1 w-full sm:w-auto overflow-x-auto border border-white/5">
                {(['all', 'entry', 'exit', 'transfer', 'product_transfer'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap",
                      filter === f ? "bg-secondary text-on-secondary shadow-lg" : "text-on-surface-variant hover:bg-surface-container-highest"
                    )}
                  >
                    {f === 'all' ? 'Todos' : f === 'entry' ? 'Entradas' : f === 'exit' ? 'Saídas' : f === 'transfer' ? 'Transf.' : 'Entre Prods.'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
              <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-surface-container-low border-b border-white/5">
                    <tr className="bg-surface-container-highest/20">
                      <th className="px-6 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Data/Hora</th>
                      <th className="px-6 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Operação</th>
                      <th className="px-6 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Ativo</th>
                      <th className="px-6 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Qtd</th>
                      <th className="px-6 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Fluxo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredMovements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-on-surface-variant text-sm italic">
                          Nenhuma movimentação encontrada para este filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredMovements.map((m) => {
                        const product = products.find(p => p.id === m.productId);
                        return (
                          <tr key={m.id} className="hover:bg-surface-container/50 transition-colors group">
                            <td className="px-6 py-3 text-[10px] font-bold text-on-surface-variant whitespace-nowrap">
                              {m.createdAt ? new Date(m.createdAt).toLocaleString('pt-BR') : 'Processando...'}
                            </td>
                            <td className="px-6 py-3">
                              <span className={cn(
                                "px-2.5 py-1.5 text-[9px] font-black uppercase rounded-lg flex items-center gap-1.5 w-fit border",
                                m.type === 'entry' ? "bg-secondary/10 text-secondary border-secondary/20" :
                                m.type === 'exit' ? "bg-tertiary/10 text-tertiary border-tertiary/20" :
                                m.type === 'transfer' ? "bg-primary/10 text-primary border-primary/20" :
                                "bg-on-surface/10 text-on-surface border-white/10"
                              )}>
                                {m.type === 'entry' ? <ArrowDownRight className="w-3 h-3" /> :
                                 m.type === 'exit' ? <ArrowUpRight className="w-3 h-3" /> :
                                 m.type === 'transfer' ? <RefreshCcw className="w-3 h-3" /> :
                                 <ArrowRightLeft className="w-3 h-3" />}
                                {m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : m.type === 'transfer' ? 'Transf.' : 'Entre Prods.'}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex flex-col">
                                <p className="font-bold text-sm text-on-surface leading-tight">{product?.name || 'Produto Excluído'}</p>
                                {m.type === 'product_transfer' && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <ArrowRight className="w-3 h-3 text-secondary" />
                                    <p className="font-bold text-[9px] text-secondary uppercase tracking-tighter">
                                      {products.find(p => p.id === m.targetProductId)?.name || 'Produto Excluído'}
                                    </p>
                                  </div>
                                )}
                                <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{product?.sku || 'N/A'}</p>
                              </div>
                            </td>
                            <td className="px-6 py-3 font-mono text-sm font-black text-on-surface text-right">
                              {m.quantity}
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant">
                                <span className="truncate max-w-[80px]">{m.origin}</span>
                                {m.destination && (
                                  <>
                                    <ArrowRight className="w-3 h-3 text-secondary shrink-0" />
                                    <span className="text-secondary truncate max-w-[80px]">{m.destination}</span>
                                  </>
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
          </div>
        </div>
      </div>

      {/* Destination Modal */}
      {isDestModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-low w-full max-w-md rounded-2xl shadow-2xl border border-white/5 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container">
              <h3 className="text-lg font-bold font-headline">Cadastrar Novo Destino</h3>
              <button onClick={() => setIsDestModalOpen(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleAddDestination} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Nome do Destino</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newDestName}
                  onChange={(e) => setNewDestName(e.target.value)}
                  placeholder="Ex: Ribeira, Expedição..."
                  className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-on-surface focus:ring-1 focus:ring-secondary/40"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsDestModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-lg font-bold text-sm text-on-surface-variant hover:bg-surface-container-highest transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-lg font-bold text-sm bg-secondary text-on-secondary hover:brightness-110 transition-all shadow-lg shadow-secondary/10"
                >
                  CADASTRAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

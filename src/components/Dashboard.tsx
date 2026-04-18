import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, Package, AlertTriangle, ChevronRight, ArrowDownRight, ArrowUpRight, RefreshCcw, PlusCircle, LayoutDashboard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import type { Product, Movement } from '../types/api';
import type { View } from './Layout';

interface DashboardProps {
  onViewChange?: (view: View) => void;
  onViewProduct?: (id: string) => void;
}

const mockChartData = [
  { name: 'JAN', entradas: 40, saidas: 30 },
  { name: 'FEV', entradas: 60, saidas: 45 },
  { name: 'MAR', entradas: 55, saidas: 70 },
  { name: 'ABR', entradas: 85, saidas: 60 },
  { name: 'MAI', entradas: 45, saidas: 35 },
  { name: 'JUN', entradas: 50, saidas: 40 },
];

const API_URL = 'http://localhost:3000/api';

export function Dashboard({ onViewChange, onViewProduct }: DashboardProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setServerError(false);
        const [prodRes, moveRes] = await Promise.all([
          fetch(`${API_URL}/products`),
          fetch(`${API_URL}/movements`)
        ]);
        
        if (!prodRes.ok || !moveRes.ok) throw new Error('API Response Error');

        const productsData = await prodRes.json();
        const movementsData = await moveRes.json();
        
        setProducts(Array.isArray(productsData) ? productsData : []);
        setMovements(Array.isArray(movementsData) ? movementsData : []);
      } catch (error) {
        console.error("Erro ao carregar dados do Dashboard:", error);
        setServerError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalValuation = products.reduce((acc, p) => {
    const base = (Number(p.price) || 0) * (Number(p.stock) || 0);
    const taxes = 1 + (Number(p.icms || 0) + Number(p.ipi || 0)) / 100;
    return acc + (base * taxes);
  }, 0);

  const formatValuation = (val: number) => {
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}K`;
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const totalItems = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const stockAlerts = products.filter(p => (Number(p.stock) || 0) <= ((Number(p.maxStock) || 0) * 0.2));
  const itemsNeedingAttention = stockAlerts.slice(0, 5);

  // Filter movements to only include those for active products
  const activeMovements = movements.filter(m => products.some(p => p.id === m.productId));

  // Calculate dynamic chart data from movements
  const chartData = activeMovements.reduce((acc: any[], m) => {
    const date = m.createdAt ? new Date(m.createdAt) : null;
    if (!date || isNaN(date.getTime())) return acc;
    
    // Use a key that includes year and month for correct sorting
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
    
    let monthData = acc.find(d => d.key === yearMonth);
    
    if (!monthData) {
      monthData = { key: yearMonth, name: monthLabel, entradas: 0, saidas: 0 };
      acc.push(monthData);
    }
    
    if (m.type === 'entry' || m.type === 'product_transfer') monthData.entradas += m.quantity;
    if (m.type === 'exit' || m.type === 'product_transfer') monthData.saidas += m.quantity;
    
    return acc;
  }, []);

  // Sort by key (YYYY-MM) and take last 6
  const displayChartData = chartData
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6);

  if (serverError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-tertiary animate-pulse" />
        <h2 className="text-xl font-bold text-on-surface">Servidor Offline</h2>
        <p className="text-on-surface-variant text-sm">Não foi possível conectar à API na porta 3000. Certifique-se de que o backend está rodando.</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-xs font-bold uppercase tracking-widest">Tentar Novamente</button>
      </div>
    );
  }

  if (!loading && products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-4 relative">
          <LayoutDashboard className="w-12 h-12 text-on-surface-variant opacity-20" />
          <div className="absolute inset-0 border-2 border-dashed border-outline-variant/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
        </div>
        
        <div className="max-w-md space-y-3">
          <h2 className="text-3xl md:text-4xl font-black font-headline tracking-tighter text-on-surface uppercase">Seu Cofre está Vazio.</h2>
          <p className="text-on-surface-variant text-sm md:text-base leading-relaxed">
            O dashboard de ativos de precisão requer dados para gerar insights. 
            Comece cadastrando seu primeiro produto no catálogo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => onViewChange?.('products')}
            className="bg-secondary text-on-secondary px-8 py-4 rounded-lg font-black text-xs md:text-sm flex items-center justify-center gap-3 shadow-xl shadow-secondary/10 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-widest"
          >
            <PlusCircle className="w-5 h-5" />
            Cadastrar Primeiro Produto
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl pt-12 opacity-40 grayscale">
          <div className="p-4 border border-outline-variant/10 rounded-xl bg-surface-container-low">
            <div className="w-8 h-1 bg-secondary/30 mb-3"></div>
            <div className="h-4 w-2/3 bg-surface-container-highest rounded mb-2"></div>
            <div className="h-8 w-full bg-surface-container-highest rounded"></div>
          </div>
          <div className="p-4 border border-outline-variant/10 rounded-xl bg-surface-container-low">
            <div className="w-8 h-1 bg-primary/30 mb-3"></div>
            <div className="h-4 w-2/3 bg-surface-container-highest rounded mb-2"></div>
            <div className="h-8 w-full bg-surface-container-highest rounded"></div>
          </div>
          <div className="p-4 border border-outline-variant/10 rounded-xl bg-surface-container-low">
            <div className="w-8 h-1 bg-tertiary/30 mb-3"></div>
            <div className="h-4 w-2/3 bg-surface-container-highest rounded mb-2"></div>
            <div className="h-8 w-full bg-surface-container-highest rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6 md:space-y-8">
      {/* Hero KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="md:col-span-2 bg-surface-container-low p-6 md:p-8 rounded-xl flex flex-col justify-between min-h-[160px] md:min-h-[220px] border-l-4 border-secondary">
          <div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant">Valor Total em Ativos (c/ Impostos)</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-on-surface mt-1 md:mt-2 font-headline">
              {formatValuation(totalValuation)}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-secondary text-xs md:text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Atualizado em tempo real</span>
          </div>
        </div>

        <div className="bg-surface-container p-5 md:p-6 rounded-xl border-l-4 border-secondary relative overflow-hidden">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant">Total de Itens</span>
          <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2 font-headline">{totalItems.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] md:text-xs text-on-surface-variant mt-1">Em {products.length} SKUs ativos</p>
          <div className="absolute -bottom-2 -right-2 opacity-5">
             <Package className="w-16 h-16" />
          </div>
        </div>

        <div className="bg-surface-container p-5 md:p-6 rounded-xl border-l-4 border-tertiary relative overflow-hidden">
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant">Alertas de Estoque</span>
          <p className="text-2xl md:text-4xl font-bold mt-1 md:mt-2 font-headline text-tertiary">{stockAlerts.length}</p>
          <p className="text-[10px] md:text-xs text-on-surface-variant mt-1">Abaixo de 20% da capacidade</p>
          <div className="absolute -bottom-2 -right-2 opacity-5">
             <AlertTriangle className="w-16 h-16" />
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Movements Chart */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0">
            <div>
              <h3 className="text-lg md:text-xl font-bold font-headline">Movimentações de Inventário</h3>
              <p className="text-xs md:text-sm text-on-surface-variant">Ciclos e fluxo de estoque mensal</p>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-on-surface-variant">
                <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-secondary rounded-sm"></span> Entradas
              </span>
              <span className="flex items-center gap-1.5 text-[10px] md:text-xs text-on-surface-variant">
                <span className="w-2.5 h-2.5 md:w-3 md:h-3 bg-primary rounded-sm"></span> Saídas
              </span>
            </div>
          </div>
          
          <div className="bg-surface-container-low p-4 md:p-6 rounded-xl h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#353534" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#c3c6d4', fontSize: 10 }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#2a2a2a' }}
                  contentStyle={{ backgroundColor: '#1c1b1b', border: 'none', borderRadius: '8px', color: '#e5e2e1' }}
                />
                <Bar dataKey="entradas" fill="#66dd8b" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="saidas" fill="#a9c7ff" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg md:text-xl font-bold font-headline">Atividade Recente</h3>
          <div className="bg-surface-container p-5 md:p-6 rounded-xl flex flex-col">
            <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-outline-variant/30">
              {activeMovements.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-10">Nenhuma movimentação recente registrada.</p>
              ) : (
                activeMovements.slice(0, 20).map((m) => {
                  const product = products.find(p => p.id === m.productId);
                  return (
                    <ActivityItem 
                      key={m.id}
                      onClick={() => onViewProduct?.(m.productId)}
                      icon={
                        m.type === 'entry' ? <ArrowDownRight className="w-4 h-4 text-secondary" /> :
                        m.type === 'exit' ? <ArrowUpRight className="w-4 h-4 text-tertiary" /> :
                        <RefreshCcw className="w-4 h-4 text-primary" />
                      }
                      title={`${m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : 'Transferência'}: ${product?.name || 'Produto'}`}
                      description={`${m.quantity} unidades ${m.type === 'transfer' ? `de ${m.origin} para ${m.destination}` : `em ${m.origin}`}.`}
                      time={m.createdAt ? new Date(m.createdAt).toLocaleString('pt-BR') : 'Processando...'}
                      bgColor={
                        m.type === 'entry' ? "bg-secondary/10" :
                        m.type === 'exit' ? "bg-tertiary/10" :
                        "bg-primary/10"
                      }
                    />
                  );
                })
              )}
            </div>
            <button 
              onClick={() => onViewChange?.('movements')}
              className="w-full mt-6 py-2.5 text-[10px] font-bold text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/20 rounded-md uppercase tracking-widest shrink-0"
            >
              Ver Log Completo
            </button>
          </div>
        </div>
      </div>

      {/* Items Needing Attention */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg md:text-xl font-bold font-headline">Itens que Exigem Atenção</h3>
          <button 
            onClick={() => onViewChange?.('inventory')}
            className="text-secondary text-xs md:text-sm font-medium flex items-center gap-1 hover:underline"
          >
            Ver Todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/20">
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Produto / SKU</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Vol. Atual</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Capacidade</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest/10">
              {itemsNeedingAttention.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant text-sm">
                    Todos os itens estão com níveis de estoque saudáveis.
                  </td>
                </tr>
              ) : (
                itemsNeedingAttention.map((p) => (
                  <TableRow 
                    key={p.id}
                    image={p.image || "https://picsum.photos/seed/product/100/100"}
                    name={p.name}
                    sku={p.sku}
                    status={(Number(p.stock) || 0) === 0 ? "Esgotado" : "Estoque Baixo"}
                    statusColor={(Number(p.stock) || 0) === 0 ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-container-highest text-on-surface-variant"}
                    vol={p.stock}
                    reorder={p.maxStock}
                    action="Reabastecer"
                    actionColor="text-secondary"
                    onAction={() => onViewChange?.('movements')}
                    onView={() => onViewProduct?.(p.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ActivityItem({ icon, title, description, time, bgColor, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex gap-4 p-2 -mx-2 rounded-lg transition-all duration-300",
        onClick ? "cursor-pointer hover:bg-surface-container-highest/50" : ""
      )}
    >
      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-on-surface-variant">{description}</p>
        <p className="text-[10px] text-on-surface-variant/60 mt-1 uppercase tracking-tighter">{time}</p>
      </div>
    </div>
  );
}

function TableRow({ image, name, sku, status, statusColor, vol, reorder, action, actionColor, onAction, onView }: any) {
  return (
    <tr className="hover:bg-surface-container transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 aspect-square bg-surface-container-highest rounded-lg flex items-center justify-center overflow-hidden border border-outline-variant/10 shadow-sm">
            <img src={image} alt={name} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
          </div>
          <div>
            <button 
              onClick={onView}
              className="font-semibold text-sm text-on-surface hover:text-secondary transition-colors text-left"
            >
              {name}
            </button>
            <p className="text-xs text-on-surface-variant">{sku}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 ${statusColor} text-[10px] font-bold uppercase rounded-full`}>{status}</span>
      </td>
      <td className="px-6 py-4 font-mono text-sm">{vol}</td>
      <td className="px-6 py-4 font-mono text-sm">{reorder}</td>
      <td className="px-6 py-4">
        <button 
          onClick={onAction}
          className={`${actionColor} text-sm font-bold hover:underline transition-all`}
        >
          {action}
        </button>
      </td>
    </tr>
  );
}

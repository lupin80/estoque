import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { TrendingUp, Info, Package, AlertTriangle, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export function ABCAnalysis() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/products');
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar dados para Curva ABC:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Lógica de Classificação ABC
  const productsWithRank = [...products]
    .map(p => {
      const base = (Number(p.price) || 0) * (Number(p.stock) || 0);
      const taxes = 1 + (Number(p.icms || 0) + Number(p.ipi || 0)) / 100;
      return { ...p, totalVal: base * taxes };
    })
    .sort((a, b) => b.totalVal - a.totalVal);

  const grandTotal = productsWithRank.reduce((sum, p) => sum + p.totalVal, 0);
  let cumulativeVal = 0;

  const classified = productsWithRank.map(p => {
    cumulativeVal += p.totalVal;
    const cumPercent = (cumulativeVal / (grandTotal || 1)) * 100;
    let rank: 'A' | 'B' | 'C' = 'C';
    
    if (cumPercent <= 80) rank = 'A';
    else if (cumPercent <= 95) rank = 'B';
    
    return { ...p, rank, cumPercent };
  });

  const stats = {
    A: classified.filter(p => p.rank === 'A'),
    B: classified.filter(p => p.rank === 'B'),
    C: classified.filter(p => p.rank === 'C'),
  };

  const pieData = [
    { name: 'Classe A', value: stats.A.length, color: '#66dd8b' },
    { name: 'Classe B', value: stats.B.length, color: '#a9c7ff' },
    { name: 'Classe C', value: stats.C.length, color: '#ffb4ab' },
  ];

  if (loading) return <div className="p-20 text-center animate-pulse text-on-surface-variant font-bold">CALCULANDO RELEVÂNCIA FINANCEIRA...</div>;

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      <section>
        <nav className="flex items-center gap-2 text-on-surface-variant text-[10px] uppercase tracking-widest mb-2">
          <span>Inteligência</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-secondary font-bold">Curva ABC</span>
        </nav>
        <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter text-on-surface">Classificação de Ativos.</h2>
        <p className="text-on-surface-variant mt-2 text-sm md:text-base max-w-2xl leading-relaxed">
          Os produtos são ranqueados pelo valor total em estoque. A Classe A detém 80% do seu capital investido.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPIs */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RankCard label="Classe A" count={stats.A.length} value={stats.A.reduce((s,p)=>s+p.totalVal,0)} color="border-secondary" text="Alto Valor" />
          <RankCard label="Classe B" count={stats.B.length} value={stats.B.reduce((s,p)=>s+p.totalVal,0)} color="border-primary" text="Médio Valor" />
          <RankCard label="Classe C" count={stats.C.length} value={stats.C.reduce((s,p)=>s+p.totalVal,0)} color="border-tertiary" text="Baixo Valor" />
        </div>

        {/* Pie Chart Distribution */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Distribuição por Quantidade</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1c1b1b', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-surface-container">
          <h3 className="font-bold font-headline flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-secondary" />
            Ranking de Impacto Financeiro
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase">
            <Info className="w-4 h-4" />
            Cálculo baseado no saldo atual
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black bg-surface-container-highest/20">
                <th className="px-8 py-4">Posição</th>
                <th className="px-8 py-4">Ativo / SKU</th>
                <th className="px-8 py-4">Classe</th>
                <th className="px-8 py-4 text-right">Valor em Estoque</th>
                <th className="px-8 py-4 text-right">% Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {classified.map((p, index) => (
                <tr key={p.id} className="hover:bg-surface-container transition-colors group">
                  <td className="px-8 py-4 font-mono text-xs text-on-surface-variant">#{(index + 1).toString().padStart(2, '0')}</td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface">{p.name}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono">{p.sku}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-md text-[10px] font-black border",
                      p.rank === 'A' ? "bg-secondary/10 text-secondary border-secondary/20" :
                      p.rank === 'B' ? "bg-primary/10 text-primary border-primary/20" :
                      "bg-tertiary/10 text-tertiary border-tertiary/20"
                    )}>
                      CLASSE {p.rank}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right font-mono text-sm font-bold text-on-surface">
                    R$ {p.totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-on-surface-variant">{p.cumPercent.toFixed(1)}%</span>
                      <div className="w-24 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-secondary opacity-40" style={{ width: `${p.cumPercent}%` }}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RankCard({ label, count, value, color, text }: any) {
  return (
    <div className={cn("bg-surface-container-low p-6 rounded-xl border-l-4 shadow-lg flex flex-col justify-between min-h-[140px]", color)}>
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">{label}</span>
        <span className="text-[9px] font-bold px-2 py-0.5 bg-surface-container-highest rounded-full text-on-surface-variant uppercase">{text}</span>
      </div>
      <div>
        <h4 className="text-3xl font-black font-headline text-on-surface">{count} <span className="text-xs font-medium text-on-surface-variant tracking-normal">SKUs</span></h4>
        <p className="text-xs font-bold text-secondary mt-1">R$ {value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em ativos</p>
      </div>
    </div>
  );
}
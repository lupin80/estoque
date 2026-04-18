import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  Package, 
  ArrowDownRight, 
  ArrowUpRight, 
  RefreshCcw,
  Search,
  ChevronDown,
  FileDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  searchQuery?: string;
}

export function Reports({ searchQuery }: ReportsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery || '');
  
  useEffect(() => {
    setSearchTerm(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    // Fetch products for the dropdown
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/products');
        const productsList = await response.json();
        setProducts(productsList);
      } catch (error) {
        console.error("Error fetching products for report:", error);
      }
    };
    
    fetchProducts();
  }, []);

  useEffect(() => {
    setLoading(true);
    
    const fetchMovements = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/movements');
        let movementsList = await response.json();
        
        // Client-side filtering
        if (selectedProductId !== 'all') {
          movementsList = movementsList.filter((m: any) => m.productId === selectedProductId);
        }
        
        if (selectedType !== 'all') {
          movementsList = movementsList.filter((m: any) => m.type === selectedType);
        }
        
        if (startDate) {
          const start = new Date(startDate);
          movementsList = movementsList.filter((m: any) => new Date(m.createdAt) >= start);
        }
        
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          movementsList = movementsList.filter((m: any) => new Date(m.createdAt) <= end);
        }

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          movementsList = movementsList.filter((m: any) => {
            const product = products.find(p => p.id === m.productId);
            return (
              product?.name?.toLowerCase().includes(term) ||
              product?.sku?.toLowerCase().includes(term) ||
              m.origin?.toLowerCase().includes(term) ||
              m.destination?.toLowerCase().includes(term)
            );
          });
        }
        
        setMovements(movementsList);
      } catch (error) {
        console.error("Error fetching movements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [selectedProductId, selectedType, startDate, endDate, searchTerm, products]);

  const stats = {
    entries: movements.filter(m => m.type === 'entry').reduce((acc, m) => acc + (m.quantity || 0), 0),
    exits: movements.filter(m => m.type === 'exit').reduce((acc, m) => acc + (m.quantity || 0), 0),
    transfers: movements.filter(m => m.type === 'transfer').reduce((acc, m) => acc + (m.quantity || 0), 0),
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch (error) {
      console.error("Print failed:", error);
      alert("Não foi possível abrir o diálogo de impressão. Tente usar o atalho Ctrl+P.");
    }
  };

  const generatePDF = () => {
    try {
      if (movements.length === 0) {
        alert("Não há dados para gerar o PDF com os filtros selecionados.");
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header Background
      doc.setFillColor(19, 19, 19);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Title
      doc.setFontSize(22);
      doc.setTextColor(102, 221, 139); // Secondary color
      doc.setFont('helvetica', 'bold');
      doc.text('VAULT INVENTORY', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text('RELATÓRIO DE AUDITORIA - COFRE CENTRAL', 14, 28);

      // Metadata (Right aligned)
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const dateStr = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
      doc.text(dateStr, pageWidth - 14 - doc.getTextWidth(dateStr), 20); // This will be always available now
      const userStr = `Operador: Sistema`;
      doc.text(userStr, pageWidth - 14 - doc.getTextWidth(userStr), 25);

      // Filters Info
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('PARÂMETROS DO RELATÓRIO:', 14, 50);
      doc.setFont('helvetica', 'normal');
      
      const productLabel = selectedProductId === 'all' ? 'Todos os Ativos' : products.find(p => p.id === selectedProductId)?.name || 'N/A';
      const typeLabel = selectedType === 'all' ? 'Todas as Operações' : 
                        selectedType === 'entry' ? 'Entradas' : 
                        selectedType === 'exit' ? 'Saídas' : 'Transferências';
      const periodLabel = (startDate || endDate) ? `${startDate || 'Início'} até ${endDate || 'Hoje'}` : 'Todo o período';

      doc.text(`Ativo: ${productLabel}`, 14, 56);
      doc.text(`Operação: ${typeLabel}`, 14, 61);
      doc.text(`Período: ${periodLabel}`, 14, 66);

      // Stats Cards (Simulated)
      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(248, 249, 250);
      
      // Entries Card
      doc.roundedRect(14, 75, 58, 20, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.text('TOTAL ENTRADAS', 18, 81);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(stats.entries.toString(), 18, 90);

      // Exits Card
      doc.roundedRect(76, 75, 58, 20, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL SAÍDAS', 80, 81);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(stats.exits.toString(), 80, 90);

      // Transfers Card
      doc.roundedRect(138, 75, 58, 20, 2, 2, 'FD');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL TRANSFERÊNCIAS', 142, 81);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(stats.transfers.toString(), 142, 90);

      // Table
      const tableData = movements.map(m => {
        const product = products.find(p => p.id === m.productId);
        const mDate = m.createdAt ? new Date(m.createdAt).toLocaleString('pt-BR') : 'N/A';
        const mType = m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : 'Transferência';

        return [
          mDate,
          product?.name || 'N/A',
          mType,
          m.quantity?.toString() || '0',
          m.origin || '-',
          m.destination || '-'
        ];
      });

      // Add totals row
      const totalsRow = [
        '',
        '',
        'TOTAIS',
        (stats.entries + stats.exits + stats.transfers).toString(),
        `Ent: ${stats.entries}`,
        `Saí: ${stats.exits} | Trans: ${stats.transfers}`
      ];

      autoTable(doc, {
        startY: 105,
        head: [['Data/Hora', 'Ativo', 'Operação', 'Qtd', 'Origem', 'Destino']],
        body: [...tableData, totalsRow],
        headStyles: { 
          fillColor: [19, 19, 19], 
          textColor: [102, 221, 139], 
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center'
        },
        bodyStyles: { 
          fontSize: 8,
          textColor: [50, 50, 50]
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        willDrawRow: (data) => {
          if (data.row.index === tableData.length) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [230, 240, 230];
            data.cell.styles.textColor = [19, 19, 19];
          }
        },
        columnStyles: {
          0: { cellWidth: 35 },
          3: { halign: 'center' }
        },
        margin: { top: 20 },
        didDrawPage: (data) => {
          // Footer
          const str = `Página ${data.pageNumber}`;
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(str, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }
      });

      doc.save(`auditoria_vault_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Falha ao gerar o arquivo PDF.");
    }
  };

  const exportToCSV = () => {
    try {
      if (movements.length === 0) {
        alert("Não há dados para exportar com os filtros selecionados.");
        return;
      }

      const headers = ['Data', 'Produto', 'Tipo', 'Quantidade', 'Origem', 'Destino'];
      const rows = movements.map(m => {
        const product = products.find(p => p.id === m.productId);
        const dateStr = m.createdAt ? new Date(m.createdAt).toLocaleString('pt-BR') : 'N/A';
        const typeStr = m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : 'Transferência';
        
        return [
          `"${dateStr}"`,
          `"${product?.name || 'N/A'}"`,
          `"${typeStr}"`,
          m.quantity,
          `"${m.origin || ''}"`,
          `"${m.destination || '-'}"`
        ];
      });
      
      const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_vault_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Falha ao gerar o arquivo CSV.");
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500 print:p-0">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 print:hidden bg-surface-container-low p-6 rounded-2xl border border-white/5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <FileText className="w-6 h-6 text-secondary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tighter text-on-surface uppercase">Relatórios de Auditoria</h2>
          </div>
          <p className="text-on-surface-variant text-sm max-w-md">Gere logs detalhados de movimentação para conformidade e controle de ativos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={exportToCSV}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-bright transition-all border border-white/5"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button 
            onClick={generatePDF}
            className="px-6 py-3 bg-surface-container-high text-on-surface rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-surface-bright transition-all border border-white/5"
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>
          <button 
            onClick={handlePrint}
            className="px-6 py-3 bg-secondary text-on-secondary rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-secondary/10"
          >
            <FileText className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 shadow-sm space-y-6 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-on-surface uppercase tracking-wider text-sm">Filtros de Auditoria</h3>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text"
              placeholder="Pesquisar produto, SKU ou local..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-2 pl-10 pr-4 text-xs text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ativo Específico</label>
            <div className="relative">
              <select 
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-2.5 px-4 text-sm text-on-surface appearance-none focus:ring-1 focus:ring-secondary/40 transition-all"
              >
                <option value="all">Todos os Ativos</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Tipo de Operação</label>
            <div className="relative">
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-2.5 px-4 text-sm text-on-surface appearance-none focus:ring-1 focus:ring-secondary/40 transition-all"
              >
                <option value="all">Todas as Operações</option>
                <option value="entry">Entradas</option>
                <option value="exit">Saídas</option>
                <option value="transfer">Transferências</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Data Inicial</label>
            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-2.5 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Data Final</label>
            <div className="relative">
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-surface-container-highest border-outline-variant/20 border rounded-md py-2.5 px-4 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40 transition-all"
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-secondary shadow-sm">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">Total Entradas</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black font-headline text-on-surface">{stats.entries}</h3>
            <ArrowDownRight className="w-8 h-8 text-secondary opacity-20" />
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-tertiary shadow-sm">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">Total Saídas</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black font-headline text-on-surface">{stats.exits}</h3>
            <ArrowUpRight className="w-8 h-8 text-tertiary opacity-20" />
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl border-l-4 border-primary shadow-sm">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 font-bold">Total Transferências</p>
          <div className="flex items-center justify-between">
            <h3 className="text-3xl font-black font-headline text-on-surface">{stats.transfers}</h3>
            <RefreshCcw className="w-8 h-8 text-primary opacity-20" />
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Ativo</th>
                <th className="px-6 py-4">Operação</th>
                <th className="px-6 py-4">Qtd</th>
                <th className="px-6 py-4">Origem</th>
                <th className="px-6 py-4">Destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant text-sm italic">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const product = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-surface-container/50 transition-colors group">
                      <td className="px-6 py-4 text-xs font-mono text-on-surface-variant">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-3 h-3 text-secondary" />
                          <span className="text-sm font-bold text-on-surface">{product?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 text-[10px] font-bold uppercase rounded-full flex items-center gap-1 w-fit",
                          m.type === 'entry' ? "bg-secondary/10 text-secondary" :
                          m.type === 'exit' ? "bg-tertiary/10 text-tertiary" :
                          "bg-primary/10 text-primary"
                        )}>
                          {m.type === 'entry' ? <ArrowDownRight className="w-3 h-3" /> :
                           m.type === 'exit' ? <ArrowUpRight className="w-3 h-3" /> :
                           <RefreshCcw className="w-3 h-3" />}
                          {m.type === 'entry' ? 'Entrada' : m.type === 'exit' ? 'Saída' : 'Transferência'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold text-on-surface">
                        {m.quantity}
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">
                        {m.origin}
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">
                        {m.destination || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Print-only Footer */}
      <div className="hidden print:block pt-12 border-t border-black mt-12">
        <div className="flex justify-between text-[10px] uppercase font-bold text-black">
          <span>Relatório Gerado em: {new Date().toLocaleString('pt-BR')}</span>
          <span>Vault Inventory System - Cofre Central</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
}

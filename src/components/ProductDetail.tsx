import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import React from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  AlertTriangle, 
  Truck, 
  History,
  Edit,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCcw,
  ArrowRightLeft,
  MapPin,
  Receipt,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';

const CheckMemo = React.memo(Check);
const CopyMemo = React.memo(Copy);
import { ProductModal } from './ProductModal';
import { ConfirmationModal } from './ConfirmationModal';

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
}

function DetailSkeleton() {
  return (
    <div className="p-4 md:p-10 space-y-8 max-w-screen-2xl mx-auto w-full animate-pulse" aria-busy="true" aria-label="Carregando detalhes do ativo">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container-high" />
          <div className="space-y-2">
            <div className="h-3 w-32 rounded bg-surface-container-high" />
            <div className="h-8 w-64 rounded-lg bg-surface-container-high" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-11 w-28 rounded-lg bg-surface-container-high" />
          <div className="h-11 w-28 rounded-lg bg-surface-container-high" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden h-80" />
          <div className="h-48 rounded-2xl bg-surface-container-low border border-white/5" />
        </div>
        <div className="space-y-8">
          <div className="h-56 rounded-2xl bg-surface-container border border-white/5" />
          <div className="h-64 rounded-2xl bg-surface-container border border-white/5" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetail({ productId, onBack }: ProductDetailProps) {
  const [product, setProduct] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [copiedSku, setCopiedSku] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const prevModalOpen = useRef(false);
  const isAdmin = true;

  const fetchData = useCallback(async () => {
    if (!productId) return;
    setLoadError(null);
    setLoading(true);
    try {
      const [prodRes, moveRes, allProdsRes, suppliersRes] = await Promise.all([
        fetch(`http://localhost:3000/api/products/${productId}`),
        fetch(`http://localhost:3000/api/movements`),
        fetch(`http://localhost:3000/api/products`),
        fetch(`http://localhost:3000/api/suppliers`)
      ]);

      if (!prodRes.ok) {
        const errBody = await prodRes.json().catch(() => ({}));
        setProduct(null);
        setLoadError(
          prodRes.status === 404
            ? 'Este ativo não foi encontrado ou foi removido.'
            : (errBody as { message?: string }).message || 'Não foi possível carregar o ativo.'
        );
        return;
      }

      const prodData = await prodRes.json();
      const moveData = await moveRes.json();
      const allProdsData = await allProdsRes.json();
      const suppliersData = await suppliersRes.json();

      setProduct(prodData);
      setAllProducts(allProdsData);
      setAllSuppliers(suppliersData);
      setMovements(moveData.filter((m: any) => m.productId === productId || m.targetProductId === productId));
      setImageFailed(false);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      setLoadError('Falha de conexão. Verifique se o servidor está em execução e tente novamente.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (prevModalOpen.current && !isModalOpen) {
      fetchData();
    }
    prevModalOpen.current = isModalOpen;
  }, [isModalOpen, fetchData]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isModalOpen && !isDeleteModalOpen) {
        onBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack, isModalOpen, isDeleteModalOpen]);

  const sortedMovements = useMemo(() => {
    return [...movements].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [movements]);

  const handleDelete = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await fetch(`http://localhost:3000/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, status: 'excluido' })
      });
      onBack();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

const copySku = useCallback(async () => {
    if (!product?.sku) return;
    try {
      await navigator.clipboard.writeText(String(product.sku));
      setCopiedSku(true);
      window.setTimeout(() => setCopiedSku(false), 2000);
    } catch {
      setCopiedSku(false);
    }
  }, [product?.sku]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (loadError || !product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-tertiary/10 flex items-center justify-center border border-tertiary/20">
          <Package className="w-8 h-8 text-tertiary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-headline text-on-surface">Não foi possível exibir o ativo</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {loadError || 'Dados indisponíveis.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => fetchData()}
            className="px-5 py-2.5 rounded-lg bg-secondary text-on-secondary font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-lg bg-surface-container-high text-on-surface font-bold text-sm border border-white/10 hover:bg-surface-bright transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Voltar ao catálogo
          </button>
        </div>
      </div>
    );
  }

  const totalValuation = ((Number(product.price) || 0) * (Number(product.stock) || 0)) * (1 + ((Number(product.icms) || 0) + (Number(product.ipi) || 0)) / 100);
  const stockNum = Number(product.stock) || 0;
  const maxStockNum = Number(product.maxStock) || 0;
  const stockLow = maxStockNum > 0 && stockNum < maxStockNum * 0.2;
  const imgSrc =
    imageFailed || !product.image
      ? 'https://picsum.photos/seed/product/600/600'
      : product.image.startsWith('data:')
        ? product.image
        : product.image.startsWith('http')
          ? product.image
          : `http://localhost:3000${product.image.startsWith('/') ? '' : '/'}${product.image}`;

  const renderMovementRow = (m: any) => {
    const isOutgoing = m.productId === productId;
    const otherProductId = isOutgoing ? m.targetProductId : m.productId;
    const otherProduct = allProducts.find(p => p.id === otherProductId);

    return (
      <tr
        key={m.id}
        onClick={() => setSelectedMovementId(m.id === selectedMovementId ? null : m.id)}
        className={cn(
          'transition-all duration-300 group cursor-pointer',
          selectedMovementId === m.id
            ? 'bg-secondary/10 shadow-[inset_4px_0_0_rgb(102,221,139),inset_0_0_30px_rgba(102,221,139,0.05)]'
            : 'hover:bg-surface-container/50'
        )}
      >
        <td className="px-6 py-4 text-xs text-on-surface-variant whitespace-nowrap">
          {m.createdAt ? new Date(m.createdAt).toLocaleString('pt-BR') : 'N/A'}
        </td>
        <td className="px-6 py-4">
          <span
            className={cn(
              'px-2 py-1 text-[10px] font-bold uppercase rounded-full flex items-center gap-1 w-fit',
              m.type === 'entry'
                ? 'bg-secondary/10 text-secondary'
                : m.type === 'exit'
                  ? 'bg-tertiary/10 text-tertiary'
                  : m.type === 'transfer'
                    ? 'bg-primary/10 text-primary'
                    : m.type === 'product_transfer'
                      ? isOutgoing
                        ? 'bg-tertiary/10 text-tertiary'
                        : 'bg-secondary/10 text-secondary'
                      : 'bg-on-surface/10 text-on-surface'
            )}
          >
            {m.type === 'entry' ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : m.type === 'exit' ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : m.type === 'transfer' ? (
              <RefreshCcw className="w-3 h-3" />
            ) : m.type === 'product_transfer' ? (
              isOutgoing ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )
            ) : (
              <ArrowRightLeft className="w-3 h-3" />
            )}
            {m.type === 'entry'
              ? 'Entrada'
              : m.type === 'exit'
                ? 'Saída'
                : m.type === 'transfer'
                  ? 'Transf.'
                  : m.type === 'product_transfer'
                    ? isOutgoing
                      ? 'Transf. Saída'
                      : 'Transf. Entrada'
                    : 'Entre Prods.'}
          </span>
          {m.type === 'product_transfer' && (
            <p className="text-[9px] font-bold text-on-surface-variant mt-1 uppercase tracking-tighter">
              {isOutgoing ? 'Para: ' : 'De: '}
              <span className="text-secondary">{otherProduct?.name || 'Produto Excluído'}</span>
            </p>
          )}
        </td>
        <td className="px-6 py-4 font-mono text-sm font-bold text-on-surface">{m.quantity}</td>
        <td className="px-6 py-4 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2 flex-wrap">
            <span>{m.origin}</span>
            {m.destination && (
              <>
                <ArrowLeft className="w-3 h-3 rotate-180 shrink-0" />
                <span className="text-secondary">{m.destination}</span>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="max-w-screen-2xl mx-auto w-full animate-in fade-in duration-500">
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 md:-mx-10 md:px-10 mb-6 border-b border-white/5 bg-surface/90 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/75">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar ao catálogo"
              className="p-2.5 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <nav className="flex items-center gap-1.5 text-on-surface-variant text-[10px] uppercase tracking-widest mb-0.5" aria-label="Navegação">
                <span className="truncate">Catálogo</span>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-60" aria-hidden />
                <span className="text-secondary font-bold truncate">Detalhes do Ativo</span>
              </nav>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-headline tracking-tight text-on-surface truncate" title={product.name}>
                {product.name}
              </h1>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-surface-container-high text-on-surface rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-bright transition-all border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              <Edit className="w-4 h-4 shrink-0" />
              Editar
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Excluir ativo"
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-tertiary/10 text-tertiary rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-tertiary/20 transition-all border border-tertiary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                Excluir
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-on-surface-variant mt-2 hidden sm:block pl-[3.25rem]">
          Pressione <kbd className="px-1 py-0.5 rounded bg-surface-container text-[9px] font-mono border border-white/10">Esc</kbd> para voltar
        </p>
      </div>

      <div className="px-4 md:px-10 pb-10 space-y-8">
        <div className="flex flex-wrap gap-2" role="list" aria-label="Resumo rápido">
          <span
            role="listitem"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-container border border-white/10 text-on-surface"
          >
            <Package className="w-3.5 h-3.5 text-secondary" />
            SKU {product.sku}
          </span>
          <span
            role="listitem"
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border',
              stockLow
                ? 'bg-tertiary/10 border-tertiary/25 text-tertiary'
                : 'bg-secondary/10 border-secondary/25 text-secondary'
            )}
          >
            Estoque {stockNum}/{maxStockNum || '—'}
          </span>
          {product.category && (
            <span
              role="listitem"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-surface-container-high border border-white/5 text-on-surface-variant"
            >
              {product.category}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section
              className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 shadow-2xl"
              aria-labelledby="asset-overview-heading"
            >
              <h2 id="asset-overview-heading" className="sr-only">
                Visão geral do ativo
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-[4/3] md:aspect-[3/4] bg-surface-container-highest relative flex items-center justify-center overflow-hidden md:border-r border-outline-variant/10 min-h-64 sm:min-h-72 md:min-h-[28rem]">
                  <img
                    src={imgSrc}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setImageFailed(true)}
                  />
                  <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
                    <div className="bg-surface/90 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 flex items-center gap-2 min-w-0">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">SKU</p>
                        <p className="text-sm font-mono font-bold text-on-surface truncate max-w-[10rem] sm:max-w-[12rem]">
                          {product.sku}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copySku();
                        }}
                        aria-label={copiedSku ? 'Copiado' : 'Copiar SKU'}
                        className="p-1.5 rounded-md hover:bg-surface-container-high text-on-surface-variant hover:text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary shrink-0"
                      >
{copiedSku ? <CheckMemo className="w-4 h-4 text-secondary" /> : <CopyMemo className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Categoria</p>
                      <p className="text-lg font-bold text-on-surface">{product.category || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Localização</p>
                      <p className="text-lg font-bold text-on-surface flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-secondary shrink-0 mt-1" />
                        <span className="break-words">{product.location || '—'}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Preço unitário</p>
                      <p className="text-lg font-bold text-on-surface">
                        R$ {Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Estoque atual</p>
                      <p
                        className={cn(
                          'text-lg font-black',
                          stockLow ? 'text-tertiary' : 'text-secondary'
                        )}
                      >
                        {product.stock}{' '}
                        <span className="text-xs font-normal text-on-surface-variant">/ {product.maxStock}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      Valoração total do ativo (c/ impostos)
                    </p>
                    <p className="text-3xl sm:text-4xl font-black text-secondary tracking-tighter break-all">
                      R$ {totalValuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-white/5">
                    {[
                      { label: 'ICMS', value: `${product.icms ?? 0}%` },
                      { label: 'IPI', value: `${product.ipi ?? 0}%` },
                      { label: 'PIS', value: `${product.pis ?? 0}%` }
                    ].map((tax) => (
                      <div
                        key={tax.label}
                        className="text-center p-3 bg-surface-container rounded-xl border border-white/5"
                      >
                        <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                          {tax.label}
                        </p>
                        <p className="text-sm font-bold text-on-surface">{tax.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4" aria-labelledby="history-heading">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                  <h3 id="history-heading" className="text-xl font-bold font-headline flex items-center gap-2">
                    <History className="w-5 h-5 text-secondary shrink-0" />
                    Histórico de movimentações
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1 pl-0 sm:pl-7">
                    {sortedMovements.length > 0
                      ? 'Toque ou clique em uma linha para destacar. Mais recentes primeiro.'
                      : 'Nenhuma movimentação ainda.'}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant sm:text-right">
                  {sortedMovements.length} registro{sortedMovements.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 shadow-xl">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr className="bg-surface-container text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                        <th scope="col" className="px-6 py-4">
                          Data/hora
                        </th>
                        <th scope="col" className="px-6 py-4">
                          Operação
                        </th>
                        <th scope="col" className="px-6 py-4">
                          Quantidade
                        </th>
                        <th scope="col" className="px-6 py-4">
                          Origem/destino
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedMovements.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-14 text-center text-on-surface-variant text-sm">
                            <History className="w-10 h-10 mx-auto mb-3 opacity-30" aria-hidden />
                            Nenhuma movimentação registrada para este ativo.
                          </td>
                        </tr>
                      ) : (
                        sortedMovements.map((m) => renderMovementRow(m))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-white/5">
                  {sortedMovements.length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant text-sm">
                      <History className="w-10 h-10 mx-auto mb-3 opacity-30" aria-hidden />
                      Nenhuma movimentação registrada.
                    </div>
                  ) : (
                    sortedMovements.map((m) => {
                      const isOutgoing = m.productId === productId;
                      const otherProductId = isOutgoing ? m.targetProductId : m.productId;
                      const otherProduct = allProducts.find(p => p.id === otherProductId);
                      const isSelected = selectedMovementId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMovementId(m.id === selectedMovementId ? null : m.id)}
                          className={cn(
                            'w-full text-left p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary',
                            isSelected ? 'bg-secondary/10' : 'hover:bg-surface-container/50 active:bg-surface-container/70'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] text-on-surface-variant font-mono">
                              {m.createdAt ? new Date(m.createdAt).toLocaleString('pt-BR') : 'N/A'}
                            </span>
                            <span className="font-mono text-sm font-bold text-on-surface">×{m.quantity}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                              className={cn(
                                'px-2 py-1 text-[10px] font-bold uppercase rounded-full inline-flex items-center gap-1',
                                m.type === 'entry'
                                  ? 'bg-secondary/10 text-secondary'
                                  : m.type === 'exit'
                                    ? 'bg-tertiary/10 text-tertiary'
                                    : m.type === 'transfer'
                                      ? 'bg-primary/10 text-primary'
                                      : m.type === 'product_transfer'
                                        ? isOutgoing
                                          ? 'bg-tertiary/10 text-tertiary'
                                          : 'bg-secondary/10 text-secondary'
                                        : 'bg-on-surface/10 text-on-surface'
                              )}
                            >
                              {m.type === 'entry'
                                ? 'Entrada'
                                : m.type === 'exit'
                                  ? 'Saída'
                                  : m.type === 'transfer'
                                    ? 'Transf.'
                                    : m.type === 'product_transfer'
                                      ? isOutgoing
                                        ? 'Transf. saída'
                                        : 'Transf. entrada'
                                      : 'Entre prods.'}
                            </span>
                          </div>
                          {m.type === 'product_transfer' && (
                            <p className="text-[10px] text-on-surface-variant mb-2">
                              {isOutgoing ? 'Para: ' : 'De: '}
                              <span className="text-secondary font-semibold">{otherProduct?.name || 'Produto excluído'}</span>
                            </p>
                          )}
                          <div className="text-xs text-on-surface-variant flex flex-wrap items-center gap-1">
                            <span>{m.origin}</span>
                            {m.destination && (
                              <>
                                <ArrowLeft className="w-3 h-3 rotate-180 shrink-0 inline" />
                                <span className="text-secondary">{m.destination}</span>
                              </>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:space-y-8" aria-label="Informações complementares">
            <div className="bg-surface-container p-6 rounded-2xl border border-white/5 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <Receipt className="w-4 h-4 text-secondary shrink-0" />
                Dados fiscais e documentação
              </h3>
              <dl className="space-y-4">
                <div className="flex justify-between items-start gap-4 py-2 border-b border-white/5">
                  <dt className="text-xs text-on-surface-variant font-medium shrink-0">NCM</dt>
                  <dd className="text-sm font-bold text-on-surface text-right break-all">{product.ncm || 'N/A'}</dd>
                </div>
                <div className="flex justify-between items-start gap-4 py-2 border-b border-white/5">
                  <dt className="text-xs text-on-surface-variant font-medium shrink-0">Nota fiscal</dt>
                  <dd className="text-sm font-bold text-on-surface text-right break-all">
                    {product.invoiceNumber || 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between items-start gap-4 py-2">
                  <dt className="text-xs text-on-surface-variant font-medium shrink-0">Fornecedor</dt>
                  <dd className="text-sm font-bold text-secondary text-right">
                    {allSuppliers.find(s => s.id === product.supplierId)?.name || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-surface-container p-6 rounded-2xl border border-white/5 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-secondary shrink-0" />
                Saúde do estoque
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold gap-2">
                    <span className="text-on-surface-variant">Capacidade utilizada</span>
                    <span className="text-on-surface tabular-nums">
                      {Math.round((stockNum / (maxStockNum || 1)) * 100)}%
                    </span>
                  </div>
                  <div
                    className="w-full h-2.5 bg-surface-container-highest rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.min(100, Math.round((stockNum / (maxStockNum || 1)) * 100))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={cn(
                        'h-full transition-all duration-1000 rounded-full',
                        stockNum < maxStockNum * 0.2 ? 'bg-tertiary' : 'bg-secondary'
                      )}
                      style={{
                        width: `${Math.min(100, (stockNum / (maxStockNum || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {maxStockNum > 0 && stockNum < maxStockNum * 0.2 && (
                  <div className="p-4 bg-tertiary/10 border border-tertiary/20 rounded-xl flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-tertiary shrink-0" aria-hidden />
                    <p className="text-xs text-tertiary leading-relaxed font-medium">
                      Atenção: nível crítico de estoque. Recomenda-se reabastecimento imediato para evitar ruptura.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-surface-container-highest/30 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-on-surface-variant shrink-0" aria-hidden />
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        Última movimentação
                      </p>
                      <p className="text-xs font-bold text-on-surface">
                        {sortedMovements[0]?.createdAt
                          ? new Date(sortedMovements[0].createdAt).toLocaleDateString('pt-BR')
                          : 'Nenhuma'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialData={product} />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir produto"
        message="Tem certeza que deseja excluir este produto permanentemente?"
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}

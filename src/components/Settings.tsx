import { useMemo, useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Database,
  User,
  Download,
  Trash2,
  HardDrive,
  Package,
  AlertTriangle,
  Clock,
  Save,
  RotateCcw,
  Info,
  Check,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from './AuthProvider';

interface SystemStats {
  totalProducts: number;
  totalMovements: number;
  totalSuppliers: number;
  totalCategories: number;
  dbSize: string;
}

export function Settings() {
  const { user } = useAuth();
  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const [stats, setStats] = useState<SystemStats>({
    totalProducts: 0,
    totalMovements: 0,
    totalSuppliers: 0,
    totalCategories: 0,
    dbSize: '0 KB'
  });
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    lowStockAlert: 20,
    criticalStockAlert: 5,
    maxInitialStock: 1000,
    sessionTimeout: 30,
    autoBackup: false,
    darkMode: true
  });
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    senha: '',
    role: 'usuario' as 'admin' | 'operador' | 'usuario',
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const [productsRes, movementsRes, suppliersRes, categoriesRes] = await Promise.all([
        fetch('http://localhost:3000/api/products'),
        fetch('http://localhost:3000/api/movements'),
        fetch('http://localhost:3000/api/suppliers'),
        fetch('http://localhost:3000/api/categories')
      ]);

      const products = await productsRes.json();
      const movements = await movementsRes.json();
      const suppliers = await suppliersRes.json();
      const categories = await categoriesRes.json();

      setStats({
        totalProducts: products.length,
        totalMovements: movements.length,
        totalSuppliers: suppliers.length,
        totalCategories: categories.length,
        dbSize: '~1 MB'
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUserError(null);
    try {
      const res = await fetch('http://localhost:3000/api/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao carregar usuários');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setUserError(err?.message || 'Erro ao carregar usuários');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setUserError(null);
    try {
      if (!newUser.name.trim() || !newUser.email.trim() || !newUser.senha) {
        throw new Error('Preencha Nome, Email e Senha.');
      }
      const res = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name.trim(),
          email: newUser.email.trim(),
          senha: newUser.senha,
          role: newUser.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Falha ao criar usuário');
      setNewUser({ name: '', email: '', senha: '', role: 'usuario' });
      await fetchUsers();
    } catch (err: any) {
      setUserError(err?.message || 'Erro ao criar usuário');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('vault_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      let data: any[] = [];
      let filename = '';
      let headers: string[] = [];

      switch (type) {
        case 'products':
          const pRes = await fetch('http://localhost:3000/api/products');
          data = await pRes.json();
          filename = 'produtos_vault';
          headers = ['Nome', 'SKU', 'Categoria', 'Preço', 'Estoque', 'Localização'];
          break;
        case 'movements':
          const mRes = await fetch('http://localhost:3000/api/movements');
          data = await mRes.json();
          filename = 'movimentacoes_vault';
          headers = ['Data', 'Tipo', 'Produto', 'Quantidade', 'Origem', 'Destino'];
          break;
        case 'suppliers':
          const sRes = await fetch('http://localhost:3000/api/suppliers');
          data = await sRes.json();
          filename = 'fornecedores_vault';
          headers = ['Nome', 'CNPJ', 'Cidade', 'Email', 'Telefone'];
          break;
        default:
          return;
      }

      const rows = data.map((item: any) => {
        if (type === 'products') {
          return [
            item.name,
            item.sku,
            item.category,
            item.price,
            item.stock,
            item.location
          ];
        } else if (type === 'movements') {
          return [
            item.createdAt,
            item.type,
            item.productId,
            item.quantity,
            item.origin,
            item.destination
          ];
        } else if (type === 'suppliers') {
          return [
            item.name,
            item.cnpj,
            item.city,
            item.email,
            item.phone
          ];
        }
        return [];
      });

      const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Erro ao exportar dados');
    } finally {
      setExporting(null);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={cn(
        "w-12 h-6 rounded-full transition-all relative",
        checked ? "bg-secondary" : "bg-surface-container-highest"
      )}
    >
      <div
        className={cn(
          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
          checked ? "right-1" : "left-1"
        )}
      />
    </button>
  );

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl md:text-4xl font-black font-headline tracking-tighter text-on-surface">Configurações do Sistema</h2>
        <p className="text-on-surface-variant mt-2">Gerencie as preferências e parâmetros globais do cofre.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* System Overview */}
        <section className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-6">
            <HardDrive className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-on-surface uppercase tracking-wider text-sm">Visão Geral do Sistema</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-container p-4 rounded-xl text-center">
                <Package className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-black text-on-surface">{stats.totalProducts}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Produtos</p>
              </div>
              <div className="bg-surface-container p-4 rounded-xl text-center">
                <RotateCcw className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-black text-on-surface">{stats.totalMovements}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Movimentações</p>
              </div>
              <div className="bg-surface-container p-4 rounded-xl text-center">
                <User className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-2xl font-black text-on-surface">{stats.totalSuppliers}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Fornecedores</p>
              </div>
              <div className="bg-surface-container p-4 rounded-xl text-center">
                <Database className="w-6 h-6 text-tertiary mx-auto mb-2" />
                <p className="text-2xl font-black text-on-surface">{stats.totalCategories}</p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Categorias</p>
              </div>
            </div>
          )}
        </section>

        {/* Inventory Settings */}
        <section className="bg-surface-container-low p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Package className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-on-surface uppercase tracking-wider text-sm">Configurações de Inventário</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
              <div>
                <p className="text-sm font-bold text-on-surface">Alerta de Estoque Baixo (%)</p>
                <p className="text-xs text-on-surface-variant">Percentual para alerta amarelo</p>
              </div>
              <input
                type="number"
                value={settings.lowStockAlert}
                onChange={(e) => handleSettingChange('lowStockAlert', Number(e.target.value))}
                className="w-20 bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface text-center"
                min={0}
                max={100}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
              <div>
                <p className="text-sm font-bold text-on-surface">Alerta de Estoque Crítico (%)</p>
                <p className="text-xs text-on-surface-variant">Percentual para alerta vermelho</p>
              </div>
              <input
                type="number"
                value={settings.criticalStockAlert}
                onChange={(e) => handleSettingChange('criticalStockAlert', Number(e.target.value))}
                className="w-20 bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface text-center"
                min={0}
                max={100}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
              <div>
                <p className="text-sm font-bold text-on-surface">Estoque Máximo inicial</p>
                <p className="text-xs text-on-surface-variant">Capacidade padrão ao criar produtos</p>
              </div>
              <input
                type="number"
                value={settings.maxInitialStock}
                onChange={(e) => handleSettingChange('maxInitialStock', Number(e.target.value))}
                className="w-24 bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface text-center"
                min={1}
              />
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section className="bg-surface-container-low p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Shield className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-on-surface uppercase tracking-wider text-sm">Segurança</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-on-surface-variant" />
                <div>
                  <p className="text-sm font-bold text-on-surface">Tempo de Sessão (minutos)</p>
                  <p className="text-xs text-on-surface-variant">Timeout por inatividade</p>
                </div>
              </div>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', Number(e.target.value))}
                className="w-20 bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface text-center"
                min={5}
                max={120}
              />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-surface-container-low p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Bell className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-on-surface uppercase tracking-wider text-sm">Notificações</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
              <div>
                <p className="text-sm font-bold text-on-surface">Alertas de Estoque Baixo</p>
                <p className="text-xs text-on-surface-variant">Notificações quando estoque atingir limite</p>
              </div>
              <Toggle
                checked={settings.lowStockAlert > 0}
                onChange={() => handleSettingChange('lowStockAlert', settings.lowStockAlert > 0 ? 0 : 20)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl">
              <div>
                <p className="text-sm font-bold text-on-surface">Backup Automático</p>
                <p className="text-xs text-on-surface-variant">Salvar dados automaticamente</p>
              </div>
              <Toggle
                checked={settings.autoBackup}
                onChange={() => handleSettingChange('autoBackup', !settings.autoBackup)}
              />
            </div>
          </div>
        </section>

        {/* Data Export */}
        <section className="bg-surface-container-low p-6 rounded-2xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Download className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-on-surface uppercase tracking-wider text-sm">Exportar Dados</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleExport('products')}
              disabled={exporting === 'products'}
              className="flex items-center justify-center gap-2 py-3 bg-surface-container rounded-xl text-sm font-bold text-on-surface hover:bg-surface-bright transition-all border border-white/5 disabled:opacity-50"
            >
              {exporting === 'products' ? (
                <div className="w-4 h-4 border-2 border-on-surface border-t-transparent rounded-full animate-spin" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              Produtos (CSV)
            </button>

            <button
              onClick={() => handleExport('movements')}
              disabled={exporting === 'movements'}
              className="flex items-center justify-center gap-2 py-3 bg-surface-container rounded-xl text-sm font-bold text-on-surface hover:bg-surface-bright transition-all border border-white/5 disabled:opacity-50"
            >
              {exporting === 'movements' ? (
                <div className="w-4 h-4 border-2 border-on-surface border-t-transparent rounded-full animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Movimentações
            </button>

            <button
              onClick={() => handleExport('suppliers')}
              disabled={exporting === 'suppliers'}
              className="flex items-center justify-center gap-2 py-3 bg-surface-container rounded-xl text-sm font-bold text-on-surface hover:bg-surface-bright transition-all border border-white/5 disabled:opacity-50"
            >
              {exporting === 'suppliers' ? (
                <div className="w-4 h-4 border-2 border-on-surface border-t-transparent rounded-full animate-spin" />
              ) : (
                <User className="w-4 h-4" />
              )}
              Fornecedores
            </button>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold tracking-wider transition-all",
              saved
                ? "bg-green-600 text-white"
                : "bg-secondary text-on-secondary hover:opacity-90"
            )}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                SALVO
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                SALVAR CONFIGURAÇÕES
              </>
            )}
          </button>
        </div>

        {/* User Management */}
        {isAdmin && (
          <section className="bg-surface-container-low p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <User className="w-5 h-5 text-secondary" />
              <h3 className="font-bold text-on-surface uppercase tracking-wider text-sm">Usuários do Sistema</h3>
            </div>

            {userError && (
              <div className="bg-tertiary/10 border border-tertiary/20 p-3 rounded-lg flex items-center gap-2 text-tertiary text-xs font-bold uppercase tracking-widest">
                <AlertTriangle className="w-4 h-4" />
                {userError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nome</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-surface-container rounded-xl border border-white/5 px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40"
                    placeholder="ex: João Silva"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Email (login)</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-surface-container rounded-xl border border-white/5 px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40"
                    placeholder="ex: joao@empresa.com"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Senha</label>
                  <input
                    type="password"
                    value={newUser.senha}
                    onChange={(e) => setNewUser(prev => ({ ...prev, senha: e.target.value }))}
                    className="w-full bg-surface-container rounded-xl border border-white/5 px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40"
                    placeholder="••••••••"
                  />
                </div>
                <div className="md:col-span-1 space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Perfil</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full bg-surface-container rounded-xl border border-white/5 px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40"
                  >
                    <option value="usuario">Usuário</option>
                    <option value="operador">Operador</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all border border-white/5",
                      creatingUser
                        ? "bg-surface-container text-on-surface-variant opacity-70"
                        : "bg-secondary text-on-secondary hover:opacity-90"
                    )}
                  >
                    {creatingUser ? (
                      <>
                        <div className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar usuário'
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-on-surface-variant">
                {usersLoading ? 'Carregando usuários...' : `${users.length} usuário(s) cadastrado(s)`}
              </p>
              <button
                type="button"
                onClick={fetchUsers}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-bold uppercase tracking-widest border border-white/5 hover:bg-surface-bright transition-all"
              >
                Recarregar
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-sm text-on-surface-variant">
                        Carregando...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-sm text-on-surface-variant">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-container/40 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-on-surface">{u.name}</td>
                        <td className="px-4 py-3 text-sm text-on-surface-variant">{u.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            u.role === 'admin'
                              ? "bg-tertiary/10 text-tertiary border border-tertiary/20"
                              : u.role === 'operador'
                                ? "bg-secondary/10 text-secondary border border-secondary/20"
                                : "bg-on-surface/10 text-on-surface border border-white/10"
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant font-mono">
                          {u.createdAt ? new Date(u.createdAt).toLocaleString('pt-BR') : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* System Info */}
        <section className="bg-surface-container-low p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Info className="w-5 h-5 text-secondary" />
            <h3 className="font-bold text-on-surface uppercase tracking-wider text-sm">Informações do Sistema</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-surface-container rounded-xl">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider">Versão</p>
              <p className="text-lg font-black text-on-surface">1.0.0</p>
            </div>
            <div className="p-4 bg-surface-container rounded-xl">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider">API</p>
              <p className="text-lg font-black text-on-surface">Express</p>
            </div>
            <div className="p-4 bg-surface-container rounded-xl">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider">Database</p>
              <p className="text-lg font-black text-on-surface">SQLite</p>
            </div>
            <div className="p-4 bg-surface-container rounded-xl">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider">Armazenamento</p>
              <p className="text-lg font-black text-on-surface">{stats.dbSize}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
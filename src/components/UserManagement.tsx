import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, User, Mail, Lock, Shield, Search, ChevronDown, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfirmationModal } from './ConfirmationModal';

interface User {
  id: string;
  name: string;
  email: string;
  senha: string;
  role: 'admin' | 'operator' | 'user';
  createdAt: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' as User['role'] });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao carregar usuários' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingUser ? `http://localhost:3000/api/users/${editingUser.id}` : 'http://localhost:3000/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser ? { ...formData, senha: formData.password || editingUser.senha } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: editingUser ? 'Usuário atualizado' : 'Usuário criado' });
        setShowModal(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'user' });
        fetchUsers();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Erro ao salvar' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setFormLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-on-surface mb-2">Usuários do Sistema</h1>
          <p className="text-on-surface-variant text-lg">Gerencie acessos e permissões dos operadores</p>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1 md:flex-none max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', password: '', role: 'user' });
              setShowModal(true);
            }}
            className="bg-secondary text-on-secondary px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {message && (
        <div className={cn(
          'p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2',
          message.type === 'success' 
            ? 'bg-secondary/10 border-secondary text-secondary' 
            : 'bg-tertiary/10 border-tertiary text-tertiary'
        )}>
          {message.type === 'success' ? <User className="w-5 h-5 shrink-0" /> : <Shield className="w-5 h-5 shrink-0" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto -mr-2 p-1 hover:bg-surface-container rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-surface-container-low rounded-3xl border border-outline-variant/20 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Carregando usuários...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-high/50 text-on-surface-variant text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-5 text-left">Nome</th>
                  <th className="px-6 py-5 text-left">Email</th>
                  <th className="px-6 py-5 text-center">Perfil</th>
                  <th className="px-6 py-5 text-center w-32">Criado em</th>
                  <th className="px-6 py-5 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-6 py-5 font-semibold text-on-surface">{user.name}</td>
                    <td className="px-6 py-5 text-on-surface-variant font-mono text-sm">{user.email}</td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1',
                        user.role === 'admin' ? 'bg-secondary/20 text-secondary' : 
                        user.role === 'operator' ? 'bg-primary/20 text-primary' : 
                        'bg-surface-container-high text-on-surface-variant'
                      )}>
                        {user.role === 'admin' && <Shield className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs text-on-surface-variant font-mono">
                      {new Date(user.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setFormData({ 
                            name: user.name, 
                            email: user.email, 
                            password: '', 
                            role: user.role 
                          });
                          setShowModal(true);
                        }}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-on-surface-variant">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-surface-container-low w-full max-w-md rounded-3xl border border-outline-variant/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 p-6 border-b border-outline-variant/10 bg-surface-container-low z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-on-surface flex items-center gap-3">
                  <User className="w-7 h-7" />
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', password: '', role: 'user' });
                  }}
                  className="p-2 hover:bg-surface-container rounded-xl text-on-surface-variant transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-on-surface"
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-on-surface"
                    placeholder="joao@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Senha {editingUser && '(deixe vazio para manter atual)'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-on-surface"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Perfil de Acesso
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                    className="w-full px-4 py-3 bg-surface-container-highest border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-on-surface"
                  >
                    <option value="user">Usuário</option>
                    <option value="operator">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', password: '', role: 'user' });
                  }}
                  className="flex-1 py-3 px-6 bg-surface-container-high text-on-surface font-bold text-sm uppercase tracking-wider rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-all"
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 px-6 bg-secondary text-on-secondary font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
                      {editingUser ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    editingUser ? 'Atualizar Usuário' : 'Criar Usuário'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={async () => {
            try {
              const res = await fetch(`http://localhost:3000/api/users/${deleteConfirm}`, { method: 'DELETE' });
              if (res.ok) {
                setMessage({ type: 'success', text: 'Usuário excluído' });
                fetchUsers();
              } else {
                setMessage({ type: 'error', text: 'Erro ao excluir usuário' });
              }
            } catch (err) {
              setMessage({ type: 'error', text: 'Erro de conexão' });
            } finally {
              setDeleteConfirm(null);
            }
          }}
          title="Excluir Usuário"
          message="Tem certeza? Esta ação é irreversível e remove todos os acessos."
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
        />
      )}
    </div>
  );
}

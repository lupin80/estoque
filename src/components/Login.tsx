import React, { useState } from 'react';
import { LogIn, Package, Shield, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, senha: password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('vault_user', JSON.stringify(data));
        onLogin(data);
      } else {
        setError(data.error || 'Falha na autenticação');
      }
    } catch (err) {
      setError('Servidor indisponível no momento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-container-low rounded-2xl border border-outline-variant/10 p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center relative">
            <Package className="w-12 h-12 text-secondary" />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-surface rounded-lg border border-outline-variant/10">
              <Shield className="w-4 h-4 text-secondary" />
            </div>
          </div>
          
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight font-headline uppercase">Vault Inventory</h1>
            <p className="text-on-surface-variant text-sm mt-2 font-medium">Controle de Ativos de Alta Precisão</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4 pt-4">
            {error && (
              <div className="bg-tertiary/10 border border-tertiary/20 p-3 rounded-lg flex items-center gap-2 text-tertiary text-xs font-bold uppercase tracking-widest">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Identificação do Usuário</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40"
                placeholder="ex: admin"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Chave de Acesso</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-secondary text-on-secondary rounded-xl font-black tracking-widest hover:scale-[0.98] active:scale-95 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50"
            >
              {loading ? 'AUTENTICANDO...' : 'ENTRAR NO COFRE'}
              {!loading && <LogIn className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-[0.2em] font-bold">
            Ambiente Seguro & Criptografado
          </p>
        </div>
      </div>
    </div>
  );
}
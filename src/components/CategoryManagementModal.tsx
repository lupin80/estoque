import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Tag } from 'lucide-react';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManagementModal({ isOpen, onClose }: CategoryManagementModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);

    try {
      const url = editingId 
        ? `http://localhost:3000/api/categories/${editingId}` 
        : 'http://localhost:3000/api/categories';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });

      if (res.ok) {
        setNewName('');
        setEditingId(null);
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar categoria");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta categoria?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategories();
      else {
        const err = await res.json();
        alert(err.error || "Erro ao excluir");
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-low w-full max-w-md rounded-2xl shadow-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-secondary" />
            <h3 className="text-lg font-bold font-headline">Gerenciar Categorias</h3>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSave} className="flex gap-2">
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nova categoria..."
              className="flex-1 bg-surface-container-highest border-none rounded-lg px-4 py-2 text-sm text-on-surface focus:ring-1 focus:ring-secondary/40"
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
            >
              {editingId ? 'SALVAR' : 'ADD'}
            </button>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-surface-container rounded-lg group">
                <span className="text-sm font-medium text-on-surface">{cat.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setEditingId(cat.id); setNewName(cat.name); }}
                    className="p-1.5 text-on-surface-variant hover:text-secondary"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 text-on-surface-variant hover:text-tertiary"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
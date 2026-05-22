'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Plus, Trash2, ArrowLeft, Loader2, Edit3, Check, X } from 'lucide-react';
import { addTask, addCategory, deleteTask, deleteCategory, updateTask, updateCategory } from '../actions';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<{ type: 'category' | 'task'; id: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'JFK2026') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Password salah');
    }
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    if (!name) return;

    setIsSubmitting(true);
    const result = await addCategory(name);
    if (result.success) {
      e.currentTarget.reset();
      await fetchCategories();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>, categoryId: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;
    const section = formData.get('section') as string;
    if (!content) return;

    setIsSubmitting(true);
    const result = await addTask(categoryId, content, section || "A. Gate");
    if (result.success) {
      e.currentTarget.reset();
      await fetchCategories();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editValue.trim()) return;
    setIsSubmitting(true);
    let result;
    if (editingId.type === 'category') {
      result = await updateCategory(editingId.id, editValue);
    } else {
      result = await updateTask(editingId.id, editValue);
    }
    
    if (result.success) {
      setEditingId(null);
      await fetchCategories();
    } else {
      alert(result.error);
    }
    setIsSubmitting(false);
  };

  const startEditing = (type: 'category' | 'task', id: number, currentVal: string) => {
    setEditingId({ type, id });
    setEditValue(currentVal);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (confirm('Hapus tugas ini?')) {
      const result = await deleteTask(taskId);
      if (result.success) {
        await fetchCategories();
      } else {
        alert(result.error);
      }
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (confirm('Hapus kategori ini beserta semua tugasnya?')) {
      const result = await deleteCategory(categoryId);
      if (result.success) {
        await fetchCategories();
      } else {
        alert(result.error);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-100 p-4 rounded-full mb-4">
              <Lock className="text-indigo-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Akses Admin</h1>
            <p className="text-slate-500 text-sm">Masukkan password untuk mengelola</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                autoFocus
              />
              {error && <p className="text-red-500 text-xs mt-2 ml-1">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors active:scale-95"
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full text-slate-500 font-medium py-2 text-sm"
            >
              Batal
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <header className="bg-slate-800 text-white p-6 sticky top-0 z-10 flex items-center shadow-md">
          <button onClick={() => router.push('/')} className="mr-4 p-1 hover:bg-slate-700 rounded-lg">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Kelola Konten</h1>
        </header>

        <div className="p-4 space-y-8">
          {/* Add Category */}
          <section className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <h2 className="text-sm font-bold text-indigo-900 mb-3 uppercase tracking-wider">Tambah Kategori Baru</h2>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                name="name"
                placeholder="Nama kategori..."
                className="flex-1 px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                disabled={isSubmitting}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              </button>
            </form>
          </section>

          {/* List Categories and Tasks */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category.id} className="border border-slate-100 rounded-2xl p-4 shadow-sm bg-slate-50/50">
                  <div className="flex justify-between items-center mb-4">
                    {editingId?.type === 'category' && editingId.id === category.id ? (
                      <div className="flex gap-1 flex-1 mr-2">
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-2 py-1 rounded border border-indigo-300 text-sm"
                        />
                        <button onClick={handleUpdate} className="p-1 text-green-600"><Check size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-slate-400"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800">{category.name}</h3>
                        <button onClick={() => startEditing('category', category.id, category.name)} className="text-slate-300 hover:text-indigo-500">
                          <Edit3 size={14} />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-300 hover:text-red-500 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {category.tasks.map((task: any) => (
                      <div key={task.id} className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-slate-100 text-sm group">
                        {editingId?.type === 'task' && editingId.id === task.id ? (
                          <div className="flex gap-1 flex-1">
                            <input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-2 py-0.5 rounded border border-indigo-300"
                            />
                            <button onClick={handleUpdate} className="text-green-600"><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400"><X size={14} /></button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600">{task.content}</span>
                              <button onClick={() => startEditing('task', task.id, task.content)} className="text-slate-200 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit3 size={12} />
                              </button>
                            </div>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={(e) => handleAddTask(e, category.id)} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        name="content"
                        placeholder="Tugas baru..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                      <button
                        disabled={isSubmitting}
                        className="bg-slate-700 text-white p-1.5 rounded-lg hover:bg-slate-900 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                      </button>
                    </div>
                    <input
                      name="section"
                      placeholder="Section (contoh: A. Gate)"
                      defaultValue="A. Gate"
                      className="w-full px-3 py-1 rounded-lg border border-slate-100 text-[10px] text-slate-500 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

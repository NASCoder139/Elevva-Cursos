import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', slug: '', description: '', price: '' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.categories.list();
      setCats(r.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      if (!form.name || !form.slug) return toast.error('Nombre y slug son obligatorios');
      await adminApi.categories.create({
        ...form,
        price: form.price ? Number(form.price) : undefined,
      });
      toast.success('Categoría creada');
      setForm({ name: '', slug: '', description: '', price: '' });
      setCreating(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    }
  };

  const toggleActive = async (c: any) => {
    await adminApi.categories.update(c.id, { isActive: !c.isActive });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      await adminApi.categories.remove(id);
      toast.success('Eliminada');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    }
  };

  const rename = async (c: any) => {
    const name = prompt('Nuevo nombre', c.name) || c.name;
    const slug = prompt('Nuevo slug', c.slug) || c.slug;
    const price = prompt('Precio actual (USD, vacío = sin precio)', c.price ?? '');
    const compare = prompt('Precio anterior tachado (USD, vacío = sin oferta)', c.comparePrice ?? '');
    await adminApi.categories.update(c.id, {
      name,
      slug,
      price: price ? Number(price) : null,
      comparePrice: compare ? Number(compare) : null,
    });
    load();
  };

  const columns: Column<any>[] = [
    { key: 'name', header: 'Nombre', render: (c) => <div><div className="font-medium">{c.name}</div><div className="text-xs text-surface-500">{c.slug}</div></div> },
    { key: 'courses', header: 'Cursos', render: (c) => c._count?.courses ?? 0 },
    { key: 'price', header: 'Precio', render: (c) => {
      if (!c.price) return '—';
      const fmt = (n: number) => `$${Number(n).toFixed(2)}`;
      return (
        <div className="flex items-center gap-1">
          {c.comparePrice && Number(c.comparePrice) > Number(c.price) && (
            <span className="text-xs text-surface-400 line-through">{fmt(c.comparePrice)}</span>
          )}
          <span className={c.comparePrice ? 'font-semibold text-primary-600' : ''}>{fmt(c.price)}</span>
        </div>
      );
    } },
    { key: 'status', header: 'Estado', render: (c) => (
      <button onClick={() => toggleActive(c)}><Badge variant={c.isActive ? 'success' : 'default'}>{c.isActive ? 'Activa' : 'Inactiva'}</Badge></button>
    ) },
    { key: 'actions', header: '', className: 'text-right', render: (c) => (
      <div className="flex justify-end gap-2">
        <button onClick={() => rename(c)} className="text-xs text-primary-600 hover:underline">Editar</button>
        <button onClick={() => handleDelete(c.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-sm text-surface-500">{cats.length}</p>
        </div>
        <Button onClick={() => setCreating(!creating)}><Plus className="mr-1 h-4 w-4" /> Nueva</Button>
      </div>

      {creating && (
        <div className="rounded-xl border border-surface-200 bg-white p-5 space-y-3 dark:border-surface-800 dark:bg-surface-900">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
            <input placeholder="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
            <input type="number" placeholder="Precio (opcional)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
            <input placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate}>Crear</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {loading ? <Spinner size="lg" /> : <DataTable columns={columns} rows={cats} empty="Sin categorías" />}
    </div>
  );
}

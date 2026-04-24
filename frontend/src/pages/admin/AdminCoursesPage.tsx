import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Info, ChevronDown } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', description: '', categoryId: '', price: '', comparePrice: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, catRes] = await Promise.all([adminApi.courses.list(q || undefined), adminApi.categories.list()]);
      setCourses(cRes.data.data);
      setCategories(catRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    try {
      if (!form.title || !form.slug || !form.categoryId || !form.description) {
        toast.error('Completá título, slug, descripción y categoría');
        return;
      }
      await adminApi.courses.create({
        ...form,
        price: form.price ? Number(form.price) : undefined,
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      });
      toast.success('Curso creado');
      setCreating(false);
      setForm({ title: '', slug: '', description: '', categoryId: '', price: '', comparePrice: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al crear');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este curso? Esto elimina también sus módulos y lecciones.')) return;
    try {
      await adminApi.courses.remove(id);
      toast.success('Curso eliminado');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al eliminar');
    }
  };

  const togglePublish = async (course: any) => {
    try {
      await adminApi.courses.update(course.id, { isPublished: !course.isPublished });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    }
  };

  const toggleVisibleToStudents = async (course: any) => {
    try {
      await adminApi.courses.update(course.id, { isVisibleToStudents: !course.isVisibleToStudents });
      toast.success(
        !course.isVisibleToStudents
          ? 'Curso visible en el dashboard de alumnos'
          : 'Curso oculto del dashboard de alumnos',
      );
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    }
  };

  const columns: Column<any>[] = [
    { key: 'title', header: 'Título', render: (r) => <div><div className="font-medium">{r.title}</div><div className="text-xs text-surface-500">{r.slug}</div></div> },
    { key: 'category', header: 'Categoría', render: (r) => r.category?.name || '—' },
    { key: 'modules', header: 'Módulos', render: (r) => r._count?.modules ?? 0 },
    { key: 'lessons', header: 'Lecciones', render: (r) => r.lessonCount ?? 0 },
    { key: 'price', header: 'Precio', render: (r) => {
      if (!r.price) return 'Incluido';
      const fmt = (n: number) => `$${Number(n).toFixed(2)}`;
      return (
        <div className="flex items-center gap-1">
          {r.comparePrice && Number(r.comparePrice) > Number(r.price) && (
            <span className="text-xs text-surface-400 line-through">{fmt(r.comparePrice)}</span>
          )}
          <span className={r.comparePrice ? 'font-semibold text-primary-600' : ''}>{fmt(r.price)}</span>
        </div>
      );
    } },
    { key: 'status', header: 'Estado', render: (r) => (
      <button onClick={() => togglePublish(r)}>
        <Badge variant={r.isPublished ? 'success' : 'default'}>{r.isPublished ? 'Publicado' : 'Borrador'}</Badge>
      </button>
    ) },
    { key: 'dashboardVisible', header: 'Dashboard alumnos', render: (r) => (
      <button
        onClick={() => toggleVisibleToStudents(r)}
        title={r.isVisibleToStudents ? 'Click para ocultar del dashboard de alumnos' : 'Click para mostrar en el dashboard de alumnos'}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition ${
          r.isVisibleToStudents
            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-surface-200 text-surface-600 hover:bg-surface-300 dark:bg-surface-800 dark:text-surface-400'
        }`}
      >
        {r.isVisibleToStudents ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        {r.isVisibleToStudents ? 'Visible' : 'Oculto'}
      </button>
    ) },
    { key: 'actions', header: '', render: (r) => (
      <div className="flex justify-end gap-1">
        <Link to={`/admin/courses/${r.id}/edit`} className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800">
          <Pencil className="h-4 w-4 text-surface-600" />
        </Link>
        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
          <Trash2 className="h-4 w-4 text-red-600" />
        </button>
      </div>
    ), className: 'text-right' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cursos</h1>
          <p className="text-sm text-surface-500">{courses.length} curso(s)</p>
        </div>
        <Button onClick={() => setCreating(!creating)}><Plus className="mr-1 h-4 w-4" /> Nuevo</Button>
      </div>

      {creating && (
        <div className="rounded-xl border border-surface-200 bg-white p-5 space-y-3 dark:border-surface-800 dark:bg-surface-900">
          <h3 className="font-semibold">Nuevo curso</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
            <input placeholder="slug-del-curso" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800">
              <option value="">Categoría...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" step="0.01" min="0" placeholder="Precio actual USD (opcional)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
            <input type="number" step="0.01" min="0" placeholder="Precio anterior tachado USD (opcional)" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
            <textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2 rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate}>Crear</Button>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
        <button
          type="button"
          onClick={() => setInfoOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-300">
            <Info className="h-4 w-4 text-primary-500" />
            ¿Qué significan los estados de un curso?
          </span>
          <ChevronDown className={`h-4 w-4 text-surface-500 transition-transform ${infoOpen ? 'rotate-180' : ''}`} />
        </button>
        {infoOpen && (
          <div className="border-t border-surface-200 px-4 py-3 text-xs text-surface-600 dark:border-surface-800 dark:text-surface-400 space-y-2">
            <p>
              <span className="font-semibold text-surface-800 dark:text-surface-200">Publicado / Borrador:</span>{' '}
              Controla si el curso existe en todo el sitio. En <em>Borrador</em> no aparece en ningún lado (ni en la tienda pública, ni en el dashboard, ni para los alumnos que ya lo compraron).
            </p>
            <p>
              <span className="font-semibold text-surface-800 dark:text-surface-200">Dashboard alumnos (Visible / Oculto):</span>{' '}
              Controla si el curso aparece en el catálogo del dashboard de alumnos logueados (<code>/app/catalog</code> y <code>/shop</code>). En <em>Oculto</em> el curso sigue disponible en la tienda pública y los alumnos que ya lo compraron siguen viéndolo en "Mis cursos".
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            placeholder="Buscar cursos..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className="w-full rounded-lg border border-surface-300 bg-white pl-9 pr-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900"
          />
        </div>
        <Button variant="outline" onClick={load}>Buscar</Button>
      </div>

      {loading ? <div className="flex justify-center py-10"><Spinner size="lg" /></div> : <DataTable columns={columns} rows={courses} empty="Sin cursos" />}
    </div>
  );
}

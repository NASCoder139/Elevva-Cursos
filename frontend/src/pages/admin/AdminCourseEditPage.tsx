import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

type Tab = 'info' | 'content';

export default function AdminCourseEditPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('info');

  const [info, setInfo] = useState<any>({});

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [cRes, catRes] = await Promise.all([adminApi.courses.get(id), adminApi.categories.list()]);
      setCourse(cRes.data.data);
      setCategories(catRes.data.data);
      const c = cRes.data.data;
      setInfo({
        title: c.title,
        slug: c.slug,
        description: c.description,
        shortDesc: c.shortDesc || '',
        thumbnailUrl: c.thumbnailUrl || '',
        price: c.price ?? '',
        comparePrice: c.comparePrice ?? '',
        categoryId: c.categoryId,
        isPublished: c.isPublished,
        isFeatured: c.isFeatured,
        isVisibleToStudents: c.isVisibleToStudents ?? true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveInfo = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await adminApi.courses.update(id, {
        ...info,
        price: info.price === '' ? null : Number(info.price),
        comparePrice: info.comparePrice === '' ? null : Number(info.comparePrice),
      });
      toast.success('Guardado');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const addModule = async () => {
    const title = prompt('Título del módulo');
    if (!title) return;
    try {
      await adminApi.modules.create({ courseId: id, title });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    }
  };

  const renameModule = async (m: any) => {
    const title = prompt('Nuevo título', m.title);
    if (!title) return;
    await adminApi.modules.update(m.id, { title });
    load();
  };

  const deleteModule = async (m: any) => {
    if (!confirm(`¿Eliminar módulo "${m.title}"?`)) return;
    await adminApi.modules.remove(m.id);
    load();
  };

  const addLesson = async (moduleId: string) => {
    const title = prompt('Título de la lección');
    if (!title) return;
    const driveFileId = prompt('Google Drive File ID') || '';
    if (!driveFileId) return;
    const duration = Number(prompt('Duración en segundos') || '0');
    try {
      await adminApi.lessons.create({ moduleId, title, driveFileId, durationSeconds: duration });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    }
  };

  const editLesson = async (l: any) => {
    const title = prompt('Título', l.title) || l.title;
    const driveFileId = prompt('Drive File ID', l.driveFileId) || l.driveFileId;
    const dur = Number(prompt('Duración (s)', String(l.durationSeconds)) || l.durationSeconds);
    await adminApi.lessons.update(l.id, { title, driveFileId, durationSeconds: dur });
    load();
  };

  const toggleFreePreview = async (l: any) => {
    await adminApi.lessons.update(l.id, { isFreePreview: !l.isFreePreview });
    load();
  };

  const deleteLesson = async (l: any) => {
    if (!confirm(`¿Eliminar lección "${l.title}"?`)) return;
    await adminApi.lessons.remove(l.id);
    load();
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" /></div>;
  if (!course) return <p>No encontrado</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/courses" className="inline-flex items-center gap-2 text-sm text-surface-600 hover:text-primary-600">
        <ArrowLeft className="h-4 w-4" /> Volver a cursos
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-sm text-surface-500">Edición de curso</p>
      </div>

      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-800">
        {(['info', 'content'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500'}`}
          >
            {t === 'info' ? 'Información' : 'Módulos y lecciones'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="rounded-xl border border-surface-200 bg-white p-6 space-y-4 dark:border-surface-800 dark:bg-surface-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título"><input value={info.title} onChange={(e) => setInfo({ ...info, title: e.target.value })} className={inputCls} /></Field>
            <Field label="Slug"><input value={info.slug} onChange={(e) => setInfo({ ...info, slug: e.target.value })} className={inputCls} /></Field>
            <Field label="Categoría">
              <select value={info.categoryId} onChange={(e) => setInfo({ ...info, categoryId: e.target.value })} className={inputCls}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Precio (USD, vacío = incluido)"><input type="number" step="0.01" min="0" value={info.price} onChange={(e) => setInfo({ ...info, price: e.target.value })} className={inputCls} /></Field>
            <Field label="Precio anterior tachado (USD, opcional)"><input type="number" step="0.01" min="0" placeholder="ej: 597" value={info.comparePrice} onChange={(e) => setInfo({ ...info, comparePrice: e.target.value })} className={inputCls} /></Field>
            <Field label="Thumbnail URL" className="sm:col-span-2"><input value={info.thumbnailUrl} onChange={(e) => setInfo({ ...info, thumbnailUrl: e.target.value })} className={inputCls} /></Field>
            <Field label="Descripción corta" className="sm:col-span-2"><input value={info.shortDesc} onChange={(e) => setInfo({ ...info, shortDesc: e.target.value })} className={inputCls} /></Field>
            <Field label="Descripción" className="sm:col-span-2">
              <textarea value={info.description} onChange={(e) => setInfo({ ...info, description: e.target.value })} rows={4} className={inputCls} />
            </Field>
            <div className="flex flex-wrap gap-6 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!info.isPublished} onChange={(e) => setInfo({ ...info, isPublished: e.target.checked })} /> Publicado</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!info.isFeatured} onChange={(e) => setInfo({ ...info, isFeatured: e.target.checked })} /> Destacado</label>
              <label className="flex items-center gap-2 text-sm" title="Si lo desactivás, el curso se oculta del dashboard de alumnos pero sigue en la tienda pública y lo ven quienes ya lo compraron."><input type="checkbox" checked={!!info.isVisibleToStudents} onChange={(e) => setInfo({ ...info, isVisibleToStudents: e.target.checked })} /> Visible en dashboard de alumnos</label>
            </div>
          </div>
          <Button onClick={saveInfo} isLoading={saving}><Save className="mr-2 h-4 w-4" /> Guardar</Button>
        </div>
      )}

      {tab === 'content' && (
        <div className="space-y-4">
          <Button onClick={addModule}><Plus className="mr-1 h-4 w-4" /> Nuevo módulo</Button>
          {course.modules.length === 0 && <p className="text-sm text-surface-500">Aún no hay módulos.</p>}
          {course.modules.map((m: any) => (
            <div key={m.id} className="rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{m.title}</h3>
                  <p className="text-xs text-surface-500">{m.lessons.length} lección(es)</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => renameModule(m)} className="text-xs text-primary-600 hover:underline">Renombrar</button>
                  <button onClick={() => deleteModule(m)} className="text-xs text-red-600 hover:underline">Eliminar</button>
                </div>
              </div>
              <ul className="space-y-1">
                {m.lessons.map((l: any) => (
                  <li key={l.id} className="flex items-center justify-between rounded border border-surface-100 px-3 py-2 text-sm dark:border-surface-800">
                    <div className="flex-1">
                      <div className="font-medium">{l.title}</div>
                      <div className="text-xs text-surface-500">Drive: {l.driveFileId} · {l.durationSeconds}s {l.isFreePreview && '· Preview gratis'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleFreePreview(l)} className="text-xs text-surface-600 hover:underline">{l.isFreePreview ? 'Bloquear' : 'Preview'}</button>
                      <button onClick={() => editLesson(l)} className="text-xs text-primary-600 hover:underline">Editar</button>
                      <button onClick={() => deleteLesson(l)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
              <button onClick={() => addLesson(m.id)} className="mt-3 text-xs text-primary-600 hover:underline">+ Agregar lección</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800';

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className || ''}`}>
      <span className="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">{label}</span>
      {children}
    </label>
  );
}

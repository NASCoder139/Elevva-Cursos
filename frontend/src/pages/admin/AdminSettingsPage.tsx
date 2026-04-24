import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Plus } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminSettingsPage() {
  const [interests, setInterests] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [interestForm, setInterestForm] = useState({ name: '', slug: '', icon: '' });
  const [tagForm, setTagForm] = useState({ name: '', slug: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [iRes, tRes] = await Promise.all([
        adminApi.interests.list(),
        adminApi.tags.list(),
      ]);
      setInterests(iRes.data.data);
      setTags(tRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addInterest = async () => {
    if (!interestForm.name || !interestForm.slug) return toast.error('Nombre y slug requeridos');
    try {
      await adminApi.interests.create(interestForm);
      setInterestForm({ name: '', slug: '', icon: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    }
  };

  const removeInterest = async (id: string) => {
    if (!confirm('¿Eliminar este interés?')) return;
    await adminApi.interests.remove(id);
    load();
  };

  const addTag = async () => {
    if (!tagForm.name || !tagForm.slug) return toast.error('Nombre y slug requeridos');
    try {
      await adminApi.tags.create(tagForm);
      setTagForm({ name: '', slug: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    }
  };

  const removeTag = async (id: string) => {
    if (!confirm('¿Eliminar este tag?')) return;
    await adminApi.tags.remove(id);
    load();
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-sm text-surface-500">Intereses y tags de la plataforma</p>
      </div>

      <section className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
        <h2 className="mb-4 font-semibold">Intereses ({interests.length})</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <input placeholder="Nombre" value={interestForm.name} onChange={(e) => setInterestForm({ ...interestForm, name: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
          <input placeholder="slug" value={interestForm.slug} onChange={(e) => setInterestForm({ ...interestForm, slug: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
          <input placeholder="icono (opcional)" value={interestForm.icon} onChange={(e) => setInterestForm({ ...interestForm, icon: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
          <Button onClick={addInterest}><Plus className="mr-1 h-4 w-4" /> Agregar</Button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {interests.map((i) => (
            <li key={i.id} className="flex items-center gap-2 rounded-full bg-surface-100 px-3 py-1 text-sm dark:bg-surface-800">
              {i.icon && <span>{i.icon}</span>} {i.name}
              <button onClick={() => removeInterest(i.id)} className="text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-surface-200 bg-white p-6 dark:border-surface-800 dark:bg-surface-900">
        <h2 className="mb-4 font-semibold">Tags ({tags.length})</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <input placeholder="Nombre" value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
          <input placeholder="slug" value={tagForm.slug} onChange={(e) => setTagForm({ ...tagForm, slug: e.target.value })} className="rounded border border-surface-300 px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-800" />
          <Button onClick={addTag}><Plus className="mr-1 h-4 w-4" /> Agregar</Button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <li key={t.id} className="flex items-center gap-2 rounded-full bg-surface-100 px-3 py-1 text-sm dark:bg-surface-800">
              {t.name}
              <button onClick={() => removeTag(t.id)} className="text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

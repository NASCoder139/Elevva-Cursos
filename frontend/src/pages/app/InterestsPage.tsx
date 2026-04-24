import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useInterests } from '../../hooks/useInterests';
import { usersApi } from '../../api/users.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import clsx from 'clsx';

export default function InterestsPage() {
  const navigate = useNavigate();
  const { interests, loading } = useInterests();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    usersApi.getMe().then((res) => {
      const user: any = res.data.data;
      const existing = user?.interests || [];
      if (existing.length > 0) {
        setSelected(new Set(existing.map((i: any) => i.interest?.id || i.id)));
      }
      setInitialLoaded(true);
    });
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      toast.error('Elegí al menos un interés');
      return;
    }
    setSaving(true);
    try {
      await usersApi.updateInterests(Array.from(selected));
      toast.success('Intereses guardados');
      navigate('/dashboard');
    } catch {
      toast.error('No pudimos guardar tus intereses');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !initialLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold text-surface-900 dark:text-surface-50">
        ¿Qué te interesa aprender?
      </h1>
      <p className="mb-8 text-surface-600 dark:text-surface-400">
        Elegí los temas que más te atraen y armaremos un dashboard personalizado.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {interests.map((interest) => {
          const isSelected = selected.has(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggle(interest.id)}
              className={clsx(
                'rounded-xl border-2 p-4 text-sm font-medium transition',
                isSelected
                  ? 'border-primary-600 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-surface-200 bg-white text-surface-700 hover:border-surface-300 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300 dark:hover:border-surface-700',
              )}
            >
              {interest.name}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          Saltar por ahora
        </Button>
        <Button onClick={handleSave} isLoading={saving}>
          Guardar y continuar
        </Button>
      </div>
    </div>
  );
}

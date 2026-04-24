import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../api/users.api';
import { useInterests } from '../../hooks/useInterests';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

type Tab = 'profile' | 'security' | 'interests';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-surface-900 dark:text-surface-50">Mi perfil</h1>

      <div className="mb-6 flex gap-2 border-b border-surface-200 dark:border-surface-800">
        {([
          { id: 'profile', label: 'Datos personales' },
          { id: 'security', label: 'Seguridad' },
          { id: 'interests', label: 'Intereses' },
        ] as const).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={clsx(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition',
              tab === t.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-200',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && user && <ProfileForm user={user} onUpdate={updateUser} />}
      {tab === 'security' && <SecurityForm />}
      {tab === 'interests' && <InterestsForm />}
    </div>
  );
}

function ProfileForm({ user, onUpdate }: { user: any; onUpdate: (u: any) => void }) {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await usersApi.updateProfile({ firstName, lastName });
      onUpdate(data.data);
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <Input label="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <Input label="Email" value={user.email} disabled />
      <Button type="submit" isLoading={saving}>Guardar cambios</Button>
    </form>
  );
}

function SecurityForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (next !== confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    try {
      await usersApi.changePassword({ currentPassword: current, newPassword: next });
      toast.success('Contraseña actualizada');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Contraseña actual"
        type="password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
        required
      />
      <Input
        label="Nueva contraseña"
        type="password"
        value={next}
        onChange={(e) => setNext(e.target.value)}
        required
      />
      <Input
        label="Confirmar nueva contraseña"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <Button type="submit" isLoading={saving}>Cambiar contraseña</Button>
    </form>
  );
}

function InterestsForm() {
  const { interests, loading } = useInterests();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    usersApi.getMe().then((res) => {
      const me: any = res.data.data;
      const existing = me?.interests || [];
      setSelected(new Set(existing.map((i: any) => i.interest?.id || i.id)));
      setLoadingMe(false);
    });
  }, []);

  if (loading || loadingMe) {
    return <Spinner />;
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersApi.updateInterests(Array.from(selected));
      toast.success('Intereses actualizados');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {interests.map((interest) => {
          const isSelected = selected.has(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => toggle(interest.id)}
              className={clsx(
                'rounded-lg border-2 p-3 text-sm font-medium transition',
                isSelected
                  ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-surface-200 bg-white text-surface-700 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300',
              )}
            >
              {interest.name}
            </button>
          );
        })}
      </div>
      <Button onClick={handleSave} isLoading={saving}>Guardar intereses</Button>
    </div>
  );
}

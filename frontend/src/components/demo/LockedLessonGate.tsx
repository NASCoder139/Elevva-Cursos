import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Sparkles } from 'lucide-react';
import { useDemo } from '../../contexts/DemoContext';
import { Button } from '../ui/Button';

export function LockedLessonGate() {
  const { data, activate } = useDemo();

  const handleActivate = async () => {
    try {
      await activate();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo activar la demo');
    }
  };

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-surface-800 bg-surface-900 p-6 text-center">
      <div className="mb-4 rounded-full bg-primary-900/30 p-3 text-primary-400">
        <Lock className="h-8 w-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-surface-100">Esta lección está bloqueada</h3>
      <p className="mb-5 max-w-md text-sm text-surface-400">
        {data?.status === 'AVAILABLE'
          ? 'Activá tu demo gratuita de 30 minutos para ver esta y cualquier otra lección.'
          : data?.status === 'EXPIRED'
            ? 'Tu demo ya expiró. Suscribite o comprá el curso para seguir viendo.'
            : 'Suscribite o comprá el curso para acceder al contenido premium.'}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {data?.status === 'AVAILABLE' && (
          <Button onClick={handleActivate}>
            <Sparkles className="mr-2 h-4 w-4" /> Activar demo 30 min
          </Button>
        )}
        <Link to="/pricing">
          <Button variant="outline">Ver planes</Button>
        </Link>
      </div>
    </div>
  );
}

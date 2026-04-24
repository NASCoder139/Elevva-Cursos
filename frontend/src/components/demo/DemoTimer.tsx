import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Clock, Sparkles } from 'lucide-react';
import { useDemo } from '../../contexts/DemoContext';

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function DemoTimer() {
  const { data, activate } = useDemo();
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (data?.status !== 'ACTIVE' || !data.expiresAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [data?.status, data?.expiresAt]);

  if (!data) return null;

  if (data.status === 'AVAILABLE') {
    const handle = async () => {
      if (loading) return;
      setLoading(true);
      try {
        await activate();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'No se pudo activar la demo');
      } finally {
        setLoading(false);
      }
    };
    return (
      <button
        onClick={handle}
        disabled={loading}
        className="flex items-center gap-2 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Activar demo 30 min</span>
      </button>
    );
  }

  if (data.status === 'ACTIVE' && data.expiresAt) {
    const remaining = Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - now) / 1000));
    const urgent = remaining <= 300;
    return (
      <div
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tabular-nums ${
          urgent
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
        }`}
      >
        <Clock className="h-3.5 w-3.5" />
        <span>Demo: {formatTime(remaining)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-surface-200 px-3 py-1.5 text-xs font-semibold text-surface-600 dark:bg-surface-800 dark:text-surface-400">
      <Clock className="h-3.5 w-3.5" />
      <span>Demo expirada</span>
    </div>
  );
}

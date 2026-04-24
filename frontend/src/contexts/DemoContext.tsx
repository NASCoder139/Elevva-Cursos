import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { demoApi, type DemoData } from '../api/demo.api';
import { useAuth } from './AuthContext';

interface DemoContextType {
  data: DemoData | null;
  loading: boolean;
  remainingSeconds: number;
  activate: () => Promise<void>;
  refresh: () => Promise<void>;
  expiredModalOpen: boolean;
  closeExpiredModal: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [expiredModalOpen, setExpiredModalOpen] = useState(false);
  const wasActiveRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setData(null);
      setRemainingSeconds(0);
      return;
    }
    setLoading(true);
    try {
      const res = await demoApi.status();
      const d = res.data.data;
      setData(d);
      setRemainingSeconds(d.remainingSeconds);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const activate = useCallback(async () => {
    const res = await demoApi.activate();
    const d = res.data.data;
    setData(d);
    setRemainingSeconds(d.remainingSeconds);
    toast.success('Demo activada: tenés 30 minutos de acceso completo');
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (data?.status !== 'ACTIVE') {
      wasActiveRef.current = false;
      return;
    }
    wasActiveRef.current = true;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setData((d) => (d ? { ...d, status: 'EXPIRED', remainingSeconds: 0 } : d));
          setExpiredModalOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [data?.status]);

  const closeExpiredModal = () => setExpiredModalOpen(false);

  return (
    <DemoContext.Provider
      value={{ data, loading, remainingSeconds, activate, refresh, expiredModalOpen, closeExpiredModal }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export const useDemo = () => {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
};

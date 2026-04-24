import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.api';
import { DataTable, type Column } from '../../components/admin/DataTable';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  IN_PROCESS: 'warning',
  REJECTED: 'danger',
  REFUNDED: 'default',
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.payments.list(status || undefined);
      setPayments(r.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const columns: Column<any>[] = [
    { key: 'id', header: 'ID', render: (p) => <span className="font-mono text-xs">{p.id.slice(0, 8)}…</span> },
    { key: 'user', header: 'Usuario', render: (p) => <div><div className="font-medium">{p.user?.firstName} {p.user?.lastName}</div><div className="text-xs text-surface-500">{p.user?.email}</div></div> },
    { key: 'type', header: 'Tipo', render: (p) => p.type },
    { key: 'amount', header: 'Monto', render: (p) => `$${Number(p.amount).toLocaleString('es-AR')} ${p.currency}` },
    { key: 'status', header: 'Estado', render: (p) => <Badge variant={statusVariant[p.status] || 'default'}>{p.status}</Badge> },
    { key: 'date', header: 'Fecha', render: (p) => new Date(p.createdAt).toLocaleString('es-AR') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pagos</h1>
        <p className="text-sm text-surface-500">{payments.length} registros</p>
      </div>

      <div className="flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900">
          <option value="">Todos los estados</option>
          <option value="APPROVED">Aprobados</option>
          <option value="PENDING">Pendientes</option>
          <option value="IN_PROCESS">En proceso</option>
          <option value="REJECTED">Rechazados</option>
          <option value="REFUNDED">Reembolsados</option>
        </select>
      </div>

      {loading ? <Spinner size="lg" /> : <DataTable columns={columns} rows={payments} empty="Sin pagos" />}
    </div>
  );
}

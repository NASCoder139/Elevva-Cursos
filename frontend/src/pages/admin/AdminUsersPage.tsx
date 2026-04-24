import { Fragment, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  Trash2,
  ChevronRight,
  Shield,
  User as UserIcon,
  Mail,
  Calendar,
  Clock,
  Hash,
  Globe,
  Wallet,
  CreditCard,
  Clock3,
  BookOpen,
  Crown,
  Tag,
  TrendingUp,
  Sparkles,
  Users as UsersIcon,
  Loader2,
} from 'lucide-react';
import {
  adminApi,
  type AdminUserRow,
  type AdminUserDetail,
  type AdminPaymentType,
  type AdminPaymentStatus,
  type AdminSubscriptionStatus,
} from '../../api/admin.api';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
const fmtMoney = (n: number | string, currency = 'USD') => {
  const num = typeof n === 'string' ? Number(n) : n;
  return `${currency === 'USD' ? '$' : ''}${num.toFixed(2)} ${currency === 'USD' ? 'USD' : currency}`;
};

function relativeFromNow(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const days = Math.round(abs / (1000 * 60 * 60 * 24));
  const future = diff >= 0;
  if (days === 0) return future ? 'Hoy' : 'Hoy';
  if (days < 30) return future ? `En ${days} día${days === 1 ? '' : 's'}` : `Hace ${days} día${days === 1 ? '' : 's'}`;
  const months = Math.round(days / 30);
  if (months < 12) return future ? `En ${months} mes${months === 1 ? '' : 'es'}` : `Hace ${months} mes${months === 1 ? '' : 'es'}`;
  const years = (days / 365).toFixed(1);
  return future ? `En ${years} años` : `Hace ${years} años`;
}

const paymentTypeMeta: Record<AdminPaymentType, { label: string; color: string; icon: typeof Crown }> = {
  SUBSCRIPTION_MONTHLY: { label: 'Mensual', color: 'amber', icon: Sparkles },
  SUBSCRIPTION_ANNUAL: { label: 'Anual', color: 'emerald', icon: Crown },
  ONE_TIME_COURSE: { label: 'Individual', color: 'violet', icon: BookOpen },
  ONE_TIME_CATEGORY: { label: 'Categoría', color: 'sky', icon: Tag },
};

function TypeBadge({ type }: { type: AdminPaymentType }) {
  const meta = paymentTypeMeta[type];
  const Icon = meta.icon;
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/30',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${colorMap[meta.color]}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

type StatusKey = AdminPaymentStatus | AdminSubscriptionStatus | 'COMPLETED';
const statusMeta: Record<string, { label: string; dot: string; pill: string }> = {
  ACTIVE: { label: 'Activo', dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' },
  APPROVED: { label: 'Completado', dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' },
  COMPLETED: { label: 'Completado', dot: 'bg-emerald-500', pill: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' },
  PENDING: { label: 'Pendiente', dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30' },
  IN_PROCESS: { label: 'En proceso', dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30' },
  PAUSED: { label: 'Pausado', dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30' },
  CANCELLED: { label: 'Cancelado', dot: 'bg-red-500', pill: 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/30' },
  REJECTED: { label: 'Rechazado', dot: 'bg-red-500', pill: 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/30' },
  EXPIRED: { label: 'Expirado', dot: 'bg-surface-500', pill: 'bg-surface-500/10 text-surface-600 dark:text-surface-300 border-surface-500/30' },
  REFUNDED: { label: 'Reembolsado', dot: 'bg-surface-500', pill: 'bg-surface-500/10 text-surface-600 dark:text-surface-300 border-surface-500/30' },
};

function StatusPill({ status }: { status: StatusKey }) {
  const meta = statusMeta[status] ?? { label: status, dot: 'bg-surface-500', pill: 'bg-surface-500/10 text-surface-600 border-surface-500/30' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function Avatar({ user, size = 40 }: { user: { firstName: string; lastName: string; avatarUrl?: string | null }; size?: number }) {
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className="rounded-full object-cover ring-1 ring-surface-200 dark:ring-surface-800" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500/80 to-primary-500/80 text-white text-sm font-semibold ring-1 ring-violet-500/30"
      style={{ width: size, height: size }}
    >
      {initials || <UserIcon className="h-4 w-4" />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */
export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, AdminUserDetail | 'loading'>>({});

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.users.list(q || undefined);
      setUsers(r.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!details[id]) {
      setDetails((prev) => ({ ...prev, [id]: 'loading' }));
      try {
        const r = await adminApi.users.get(id);
        setDetails((prev) => ({ ...prev, [id]: r.data.data }));
      } catch {
        setDetails((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        toast.error('No se pudo cargar el detalle');
      }
    }
  };

  const toggleRole = async (u: AdminUserRow) => {
    const next = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (!confirm(`¿Cambiar rol a ${next}?`)) return;
    await adminApi.users.update(u.id, { role: next });
    toast.success(`Rol: ${next}`);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      await adminApi.users.remove(id);
      toast.success('Usuario eliminado');
      if (expandedId === id) setExpandedId(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al eliminar');
    }
  };

  const kpis = useMemo(() => {
    const total = users.length;
    const activeSubs = users.filter((u) => u.subscription?.status === 'ACTIVE').length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    const withPurchases = users.filter((u) => (u._count?.purchases ?? 0) > 0).length;
    return { total, activeSubs, admins, withPurchases };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-surface-500">Gestión, detalle de compras y suscripciones</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi icon={UsersIcon} label="Usuarios" value={kpis.total} tone="violet" />
          <Kpi icon={Crown} label="Suscritos" value={kpis.activeSubs} tone="emerald" />
          <Kpi icon={Wallet} label="Con compras" value={kpis.withPurchases} tone="amber" />
          <Kpi icon={Shield} label="Admins" value={kpis.admins} tone="sky" />
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            placeholder="Buscar por nombre o email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className="w-full rounded-lg border border-surface-300 bg-white pl-9 pr-3 py-2 text-sm dark:border-surface-700 dark:bg-surface-900"
          />
        </div>
        <Button variant="outline" onClick={load}>
          Buscar
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner size="lg" />
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-surface-500 dark:border-surface-700 dark:bg-surface-900">
          Sin usuarios
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-surface-800 dark:bg-surface-900 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-50/70 dark:bg-surface-900/60">
                <tr className="border-b border-surface-200 dark:border-surface-800">
                  <th className="w-10 px-3 py-3"></th>
                  <th className="px-4 py-3 text-left font-semibold text-surface-600 dark:text-surface-400">Usuario</th>
                  <th className="px-4 py-3 text-left font-semibold text-surface-600 dark:text-surface-400">Rol</th>
                  <th className="px-4 py-3 text-left font-semibold text-surface-600 dark:text-surface-400">Suscripción</th>
                  <th className="px-4 py-3 text-left font-semibold text-surface-600 dark:text-surface-400">Compras</th>
                  <th className="px-4 py-3 text-left font-semibold text-surface-600 dark:text-surface-400">Registrado</th>
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const open = expandedId === u.id;
                  const subEnd = u.subscription?.currentPeriodEnd;
                  const subRelative = relativeFromNow(subEnd);
                  return (
                    <Fragment key={u.id}>
                      <tr
                        onClick={() => toggleExpand(u.id)}
                        className={`cursor-pointer border-t border-surface-200 transition-colors dark:border-surface-800 ${
                          open
                            ? 'bg-violet-50/60 dark:bg-violet-500/5'
                            : 'hover:bg-surface-50/80 dark:hover:bg-surface-800/40'
                        }`}
                      >
                        <td className="px-3 py-3">
                          <ChevronRight
                            className={`h-4 w-4 text-surface-400 transition-transform ${open ? 'rotate-90 text-violet-500' : ''}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar user={u} />
                            <div>
                              <div className="font-medium text-surface-900 dark:text-surface-100">
                                {u.firstName} {u.lastName}
                              </div>
                              <div className="text-xs text-surface-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRole(u);
                            }}
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                              u.role === 'ADMIN'
                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 dark:text-sky-300'
                                : 'border-surface-300 bg-surface-100 text-surface-700 hover:bg-surface-200 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300'
                            }`}
                          >
                            {u.role === 'ADMIN' ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                            {u.role}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {u.subscription ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <TypeBadge type={u.subscription.plan} />
                                <StatusPill status={u.subscription.status} />
                              </div>
                              {subEnd && (
                                <span className="text-[11px] text-surface-500">
                                  Vence: {fmtDate(subEnd)} {subRelative && <span className="text-surface-400">· {subRelative}</span>}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-surface-400">Sin suscripción</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
                            <Wallet className="h-3.5 w-3.5 text-surface-400" />
                            {u._count?.purchases ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{fmtDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(u.id);
                            }}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="border-t border-violet-500/20 bg-gradient-to-b from-violet-50/40 to-transparent dark:from-violet-500/5">
                          <td colSpan={7} className="p-0">
                            <UserDetailPanel detail={details[u.id]} row={u} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   KPI
   ═══════════════════════════════════════════════════════ */
function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: number;
  tone: 'violet' | 'emerald' | 'amber' | 'sky';
}) {
  const map = {
    violet: 'from-violet-500/15 to-violet-500/0 text-violet-600 dark:text-violet-300',
    emerald: 'from-emerald-500/15 to-emerald-500/0 text-emerald-600 dark:text-emerald-300',
    amber: 'from-amber-500/15 to-amber-500/0 text-amber-600 dark:text-amber-300',
    sky: 'from-sky-500/15 to-sky-500/0 text-sky-600 dark:text-sky-300',
  } as const;
  return (
    <div className={`relative rounded-xl border border-surface-200 bg-gradient-to-br p-3 shadow-sm dark:border-surface-800 dark:bg-surface-900 ${map[tone]}`}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-surface-900 dark:text-white">{value}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DETAIL PANEL
   ═══════════════════════════════════════════════════════ */
function UserDetailPanel({ detail, row }: { detail: AdminUserDetail | 'loading' | undefined; row: AdminUserRow }) {
  if (!detail || detail === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-sm text-surface-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando detalle...
      </div>
    );
  }

  const activePayment = detail.payments.find((p) => p.status === 'APPROVED');
  const sub = detail.subscription;

  // Compra actual: prioridad → suscripción activa, luego último pago aprobado
  const current = sub && sub.status === 'ACTIVE' ? 'subscription' : activePayment ? 'payment' : 'none';

  return (
    <div className="border-l-4 border-violet-500/60 bg-white/50 px-6 py-6 dark:bg-surface-950/50">
      {/* Grid 3 cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Info personal ── */}
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <SectionTitle icon={UserIcon} label="Información del usuario" tone="violet" />
          <div className="mt-4 flex items-center gap-3">
            <Avatar user={detail} size={56} />
            <div className="min-w-0">
              <div className="truncate font-semibold text-surface-900 dark:text-white">
                {detail.firstName} {detail.lastName}
              </div>
              <div className="flex items-center gap-1 text-xs text-surface-500">
                <Mail className="h-3 w-3" />
                <span className="truncate">{detail.email}</span>
              </div>
            </div>
          </div>
          <dl className="mt-4 space-y-2.5 text-xs">
            <Row icon={Shield} label="Rol">
              <span className={detail.role === 'ADMIN' ? 'font-semibold text-sky-600 dark:text-sky-300' : 'text-surface-700 dark:text-surface-300'}>
                {detail.role}
              </span>
            </Row>
            <Row icon={Hash} label="ID">
              <span className="font-mono text-[11px] text-surface-500">{detail.id.slice(0, 8)}…{detail.id.slice(-4)}</span>
            </Row>
            {detail.country && (
              <Row icon={Globe} label="País">
                {detail.country}
              </Row>
            )}
            <Row icon={Calendar} label="Registro">
              {fmtDate(detail.createdAt)}
            </Row>
            <Row icon={Clock} label="Última actividad">
              {fmtDateTime(detail.updatedAt)} <span className="text-surface-400">· {relativeFromNow(detail.updatedAt)}</span>
            </Row>
          </dl>
        </div>

        {/* ── Compra actual ── */}
        <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-white to-white p-5 shadow-sm dark:from-violet-500/10 dark:via-surface-900 dark:to-surface-900">
          <SectionTitle icon={CreditCard} label="Compra actual" tone="violet" accent />
          {current === 'subscription' && sub ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <TypeBadge type={sub.plan} />
                <StatusPill status={sub.status} />
              </div>
              <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-800/50">
                <div className="text-[10px] uppercase tracking-wider text-surface-500 font-semibold">Plan</div>
                <div className="text-base font-semibold text-surface-900 dark:text-white">
                  {paymentTypeMeta[sub.plan].label} · Suscripción
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <MiniField label="Inicio" value={fmtDate(sub.currentPeriodStart)} />
                <MiniField
                  label="Próxima renovación"
                  value={fmtDate(sub.currentPeriodEnd)}
                  hint={relativeFromNow(sub.currentPeriodEnd) ?? undefined}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <MiniField label="Proveedor" value={sub.provider === 'MERCADOPAGO' ? 'MercadoPago' : 'PayPal'} />
                <MiniField
                  label="Método"
                  value={
                    sub.provider === 'MERCADOPAGO'
                      ? `MP •••• ${(sub.id || '').slice(-4)}`
                      : `PayPal •••• ${(sub.id || '').slice(-4)}`
                  }
                />
              </div>
              {activePayment && (
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs">
                  <span className="text-surface-600 dark:text-surface-400">Último cobro</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                    {fmtMoney(activePayment.amount, activePayment.currency)}
                  </span>
                </div>
              )}
            </div>
          ) : current === 'payment' && activePayment ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <TypeBadge type={activePayment.type} />
                <StatusPill status="COMPLETED" />
              </div>
              <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-800/50">
                <div className="text-[10px] uppercase tracking-wider text-surface-500 font-semibold">Producto</div>
                <div className="text-base font-semibold text-surface-900 dark:text-white">
                  {activePayment.purchase?.course?.title ||
                    activePayment.purchase?.category?.name ||
                    paymentTypeMeta[activePayment.type].label}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <MiniField label="Fecha" value={fmtDate(activePayment.createdAt)} />
                <MiniField label="Total" value={fmtMoney(activePayment.amount, activePayment.currency)} />
              </div>
              <MiniField
                label="Método"
                value={activePayment.provider === 'MERCADOPAGO' ? 'MercadoPago' : 'PayPal'}
              />
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-lg border border-dashed border-surface-300 py-6 text-xs text-surface-500 dark:border-surface-700">
              <Wallet className="h-6 w-6 text-surface-400" />
              Sin compras activas
            </div>
          )}
        </div>

        {/* ── Resumen visual ── */}
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
          <SectionTitle icon={TrendingUp} label="Resumen del cliente" tone="emerald" />
          <div className="mt-4 rounded-lg bg-gradient-to-br from-emerald-500/10 to-emerald-500/0 p-4 text-center">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-300">
              Total gastado
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums text-surface-900 dark:text-white">
              ${detail.stats.totalSpent.toFixed(2)}
            </div>
            <div className="text-[11px] text-surface-500">en {detail.stats.approvedCount} pago{detail.stats.approvedCount === 1 ? '' : 's'}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatTile icon={BookOpen} value={detail.stats.courseCount} label="Cursos" />
            <StatTile icon={Crown} value={detail.stats.subscriptionCount} label="Suscripciones" />
            <StatTile icon={Clock} value={detail.stats.daysAsCustomer} label="Días como cliente" />
            <StatTile
              icon={Sparkles}
              value={sub?.status === 'ACTIVE' ? 'Activo' : row._count.purchases > 0 ? 'Cliente' : 'Lead'}
              label="Estado"
              isText
            />
          </div>
        </div>
      </div>

      {/* ── Historial de compras ── */}
      <div className="mt-6 rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-800 dark:bg-surface-900">
        <div className="mb-4 flex items-center justify-between">
          <SectionTitle icon={Clock3} label="Historial de compras" tone="sky" />
          <span className="text-xs text-surface-500">{detail.payments.length} registro{detail.payments.length === 1 ? '' : 's'}</span>
        </div>
        {detail.payments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-300 py-8 text-center text-xs text-surface-500 dark:border-surface-700">
            Sin compras registradas
          </div>
        ) : (
          <ul className="divide-y divide-surface-200 dark:divide-surface-800">
            {detail.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                  {p.purchase?.course?.thumbnailUrl ? (
                    <img src={p.purchase.course.thumbnailUrl} alt="" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    (() => {
                      const Icon = paymentTypeMeta[p.type].icon;
                      return <Icon className="h-4 w-4 text-surface-500" />;
                    })()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
                    {p.purchase?.course?.title ||
                      p.purchase?.category?.name ||
                      (p.type === 'SUBSCRIPTION_MONTHLY' ? 'Suscripción mensual' : p.type === 'SUBSCRIPTION_ANNUAL' ? 'Suscripción anual' : 'Compra')}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-surface-500">
                    <TypeBadge type={p.type} />
                    <span>{fmtDateTime(p.createdAt)}</span>
                    <span className="text-surface-400">· {p.provider === 'MERCADOPAGO' ? 'MercadoPago' : 'PayPal'}</span>
                    {p.couponCode && (
                      <span className="inline-flex items-center gap-1 rounded bg-fuchsia-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                        <Tag className="h-2.5 w-2.5" />
                        {p.couponCode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums text-surface-900 dark:text-white">
                    {fmtMoney(p.amount, p.currency)}
                  </span>
                  <StatusPill status={p.status === 'APPROVED' ? 'COMPLETED' : p.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SMALL BITS
   ═══════════════════════════════════════════════════════ */
function SectionTitle({
  icon: Icon,
  label,
  tone,
  accent = false,
}: {
  icon: typeof UserIcon;
  label: string;
  tone: 'violet' | 'emerald' | 'sky' | 'amber';
  accent?: boolean;
}) {
  const colors = {
    violet: 'text-violet-600 dark:text-violet-300 bg-violet-500/10',
    emerald: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10',
    sky: 'text-sky-600 dark:text-sky-300 bg-sky-500/10',
    amber: 'text-amber-600 dark:text-amber-300 bg-amber-500/10',
  } as const;
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${colors[tone]}`}>
        <Icon className="h-4 w-4" />
      </span>
      <h3 className={`text-sm font-semibold ${accent ? 'text-violet-700 dark:text-violet-200' : 'text-surface-900 dark:text-surface-100'}`}>{label}</h3>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof UserIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-surface-500">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd className="truncate text-right text-surface-800 dark:text-surface-200">{children}</dd>
    </div>
  );
}

function MiniField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-surface-200 bg-surface-50/50 p-2.5 dark:border-surface-800 dark:bg-surface-800/30">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-surface-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-surface-900 dark:text-surface-100">{value}</div>
      {hint && <div className="text-[10px] text-violet-600 dark:text-violet-300">{hint}</div>}
    </div>
  );
}

function StatTile({
  icon: Icon,
  value,
  label,
  isText = false,
}: {
  icon: typeof UserIcon;
  value: number | string;
  label: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-lg border border-surface-200 bg-surface-50/50 p-3 dark:border-surface-800 dark:bg-surface-800/30">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-surface-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={`mt-1 font-bold tabular-nums text-surface-900 dark:text-white ${isText ? 'text-sm' : 'text-xl'}`}>{value}</div>
    </div>
  );
}

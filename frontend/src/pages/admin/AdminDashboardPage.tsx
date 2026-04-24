import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Users, BookOpen, PlayCircle, CreditCard, DollarSign, Sparkles,
  TrendingUp, TrendingDown, ArrowUpRight, UserPlus, ShieldCheck,
  Clock, Calendar, Globe, Trophy, ChevronDown,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { adminApi, type AdminStats } from '../../api/admin.api';
import { Spinner } from '../../components/ui/Spinner';

function formatCurrency(n: number) {
  return `$${n.toLocaleString('es-CL')}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

const statusColors: Record<string, string> = {
  APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  IN_PROCESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  REFUNDED: 'bg-surface-500/10 text-surface-400 border-surface-500/20',
};

const statusLabels: Record<string, string> = {
  APPROVED: 'Aprobado',
  PENDING: 'Pendiente',
  REJECTED: 'Rechazado',
  IN_PROCESS: 'En proceso',
  REFUNDED: 'Reembolsado',
};

const providerColors: Record<string, string> = {
  PAYPAL: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MERCADOPAGO: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const typeLabels: Record<string, string> = {
  SUBSCRIPTION_MONTHLY: 'Suscripción Mensual',
  SUBSCRIPTION_ANNUAL: 'Suscripción Anual',
  ONE_TIME_COURSE: 'Curso individual',
  ONE_TIME_CATEGORY: 'Categoría',
};

const tooltipStyle = {
  contentStyle: {
    background: '#1a1a2e',
    border: '1px solid rgba(139,92,246,0.15)',
    borderRadius: '10px',
    fontSize: '12px',
    color: '#e2e8f0',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
};

// Mapa de país (español) → código ISO 2 letras para flagcdn.com
const COUNTRY_CODES: Record<string, string> = {
  'México': 'mx', 'Mexico': 'mx',
  'Colombia': 'co',
  'Argentina': 'ar',
  'Chile': 'cl',
  'España': 'es', 'Spain': 'es',
  'Perú': 'pe', 'Peru': 'pe',
  'Ecuador': 'ec',
  'Venezuela': 've',
  'Bolivia': 'bo',
  'Paraguay': 'py',
  'Uruguay': 'uy',
  'Costa Rica': 'cr',
  'Panamá': 'pa', 'Panama': 'pa',
  'Guatemala': 'gt',
  'Honduras': 'hn',
  'El Salvador': 'sv',
  'Nicaragua': 'ni',
  'República Dominicana': 'do',
  'Cuba': 'cu',
  'Puerto Rico': 'pr',
  'Brasil': 'br', 'Brazil': 'br',
  'Estados Unidos': 'us', 'United States': 'us',
  'Canadá': 'ca', 'Canada': 'ca',
  'Francia': 'fr', 'France': 'fr',
  'Alemania': 'de', 'Germany': 'de',
  'Italia': 'it', 'Italy': 'it',
  'Portugal': 'pt',
  'Reino Unido': 'gb', 'United Kingdom': 'gb',
  'Japón': 'jp', 'Japan': 'jp',
  'China': 'cn',
  'India': 'in',
  'Australia': 'au',
};

function CountryFlag({ country, size = 20 }: { country: string; size?: number }) {
  const code = COUNTRY_CODES[country];
  if (!code) {
    return <Globe className="text-surface-500" style={{ width: size, height: size }} />;
  }
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={country}
      width={size}
      height={Math.round(size * 0.75)}
      className="rounded-sm object-cover"
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
}

const DATE_RANGES = [
  { label: 'Últimos 7 días', value: 7 },
  { label: 'Últimos 15 días', value: 15 },
  { label: 'Últimos 30 días', value: 30 },
  { label: 'Últimos 60 días', value: 60 },
  { label: 'Últimos 90 días', value: 90 },
  { label: 'Último año', value: 365 },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadStats = useCallback((d: number) => {
    setLoading(true);
    adminApi.stats(d).then((r) => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats(days);
  }, [days, loadStats]);

  const handleDateChange = (value: number) => {
    setDays(value);
    setShowDatePicker(false);
  };

  const totalByProvider = useMemo(() => {
    if (!stats) return { mp: 0, pp: 0, total: 0, mpPct: 0, ppPct: 0 };
    const mp = stats.paymentsByProvider.mercadopago;
    const pp = stats.paymentsByProvider.paypal;
    const total = mp + pp;
    return { mp, pp, total, mpPct: total ? Math.round((mp / total) * 100) : 0, ppPct: total ? Math.round((pp / total) * 100) : 0 };
  }, [stats]);

  const donutData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Aprobados', value: stats.paymentStats.approved, color: '#10b981' },
      { name: 'Pendientes', value: stats.paymentStats.pending, color: '#f59e0b' },
      { name: 'Rechazados', value: stats.paymentStats.rejected, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const countryColors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

  if (loading && !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!stats) return <p className="text-surface-500">Sin datos</p>;

  const currentRange = DATE_RANGES.find((r) => r.value === days) || DATE_RANGES[2];

  const kpis = [
    { label: 'Usuarios', value: stats.totals.users, icon: Users, color: 'text-blue-400', glow: 'from-blue-500/8' },
    { label: 'Cursos publicados', value: `${stats.totals.publishedCourses}/${stats.totals.courses}`, icon: BookOpen, color: 'text-emerald-400', glow: 'from-emerald-500/8' },
    { label: 'Lecciones', value: stats.totals.lessons, icon: PlayCircle, color: 'text-amber-400', glow: 'from-amber-500/8' },
    { label: 'Suscripciones activas', value: stats.totals.activeSubs, icon: Sparkles, color: 'text-purple-400', glow: 'from-purple-500/8' },
    { label: 'Pagos aprobados', value: stats.totals.approvedPayments, icon: CreditCard, color: 'text-emerald-400', glow: 'from-emerald-500/8' },
    { label: 'Ingresos totales', value: formatCurrency(stats.totals.revenue), icon: DollarSign, color: 'text-green-400', glow: 'from-green-500/8' },
  ];

  const conversionRate = stats.paymentStats.total > 0
    ? Math.round((stats.paymentStats.approved / stats.paymentStats.total) * 100)
    : 0;

  const totalCountryUsers = stats.usersByCountry.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-0.5 text-sm text-surface-400">Resumen general de la plataforma</p>
        </div>
        {/* Date range selector */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-900/80 px-4 py-2.5 hover:border-primary-500/40 hover:bg-surface-800 transition-all"
          >
            <Calendar className="h-4 w-4 text-primary-400" />
            <span className="text-sm text-surface-200">{currentRange.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-surface-500" />
          </button>
          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-surface-700 bg-surface-900 shadow-2xl shadow-black/40 overflow-hidden">
                {DATE_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => handleDateChange(range.value)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      days === range.value
                        ? 'bg-primary-600/20 text-primary-300 font-medium'
                        : 'text-surface-300 hover:bg-surface-800'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && stats && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-surface-800 border border-surface-700 px-3 py-2 shadow-lg">
          <div className="h-3 w-3 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-xs text-surface-300">Actualizando...</span>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="relative overflow-hidden rounded-xl border border-surface-800/60 bg-surface-900 p-4">
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.glow} to-transparent pointer-events-none`} />
            <div className="relative">
              <div className={`mb-2 rounded-lg bg-surface-800/60 p-2 w-fit ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold text-white tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-surface-500 mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue Chart + Payment Methods ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-xl border border-surface-800/60 bg-surface-900 p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-sm font-semibold text-white">Ingresos - {currentRange.label.toLowerCase()}</h2>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totals.revenue)}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-400">Ingresos</span>
            </div>
          </div>
          <div className="h-52 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chart}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(v) => formatDate(v)}
                  interval={days <= 15 ? 1 : days <= 30 ? 4 : days <= 90 ? 10 : 30}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={40}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
                />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Ingresos']} labelFormatter={(l) => formatDate(l)} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#revGrad)"
                  dot={false} activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment by provider */}
        <div className="rounded-xl border border-surface-800/60 bg-surface-900 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Pagos por método</h3>

          <div className="space-y-4 mb-5">
            {/* Mercado Pago */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                    Mercado Pago
                  </span>
                </div>
                <span className="text-sm font-semibold text-white">{formatCurrency(totalByProvider.mp)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-800">
                <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${totalByProvider.mpPct}%` }} />
              </div>
              <p className="text-[10px] text-surface-500 mt-1">{totalByProvider.mpPct}% del total</p>
            </div>

            {/* PayPal */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border-blue-500/20">
                    PayPal
                  </span>
                </div>
                <span className="text-sm font-semibold text-white">{formatCurrency(totalByProvider.pp)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-800">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${totalByProvider.ppPct}%` }} />
              </div>
              <p className="text-[10px] text-surface-500 mt-1">{totalByProvider.ppPct}% del total</p>
            </div>
          </div>

          {/* Conversion rate + donut */}
          <div className="border-t border-surface-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-surface-400">Tasa de aprobación</span>
              <span className="text-lg font-bold text-white">{conversionRate}%</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={24} outerRadius={36} dataKey="value" strokeWidth={0}>
                      {donutData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[11px] text-surface-400">{d.value} {d.name.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Popular Courses + Country Distribution ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Popular courses */}
        <div className="lg:col-span-2 rounded-xl border border-surface-800/60 bg-surface-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Cursos más populares
            </h3>
            <span className="text-[11px] text-surface-500">{currentRange.label}</span>
          </div>
          {stats.popularCourses.length === 0 ? (
            <p className="p-5 text-sm text-surface-500 text-center">Sin datos de cursos en este período</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-800 text-left text-[11px] uppercase tracking-wider text-surface-500">
                    <th className="px-5 py-3 font-medium w-10">#</th>
                    <th className="px-5 py-3 font-medium">Curso</th>
                    <th className="px-5 py-3 font-medium text-center">Inscripciones</th>
                    <th className="px-5 py-3 font-medium text-right">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.popularCourses.map((course, idx) => (
                    <tr key={course.id} className="border-b border-surface-800/50 last:border-0 hover:bg-surface-800/30 transition">
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                          idx === 1 ? 'bg-surface-600/20 text-surface-300' :
                          idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-surface-800 text-surface-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {course.thumbnailUrl ? (
                            <img src={course.thumbnailUrl} alt="" className="w-10 h-7 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-7 rounded bg-surface-800 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-3.5 w-3.5 text-surface-600" />
                            </div>
                          )}
                          <span className="text-xs font-medium text-surface-200 truncate max-w-[250px]">{course.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-semibold text-primary-400">
                          {course.enrollments}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-white tabular-nums">
                        {formatCurrency(course.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Country distribution */}
        <div className="rounded-xl border border-surface-800/60 bg-surface-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-400" />
              Distribución por país
            </h3>
            <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-400">
              {stats.usersByCountry.length} países
            </span>
          </div>

          {/* Donut for countries */}
          {stats.usersByCountry.length > 0 && (
            <div className="px-5 pt-4 pb-2 flex justify-center">
              <div className="h-28 w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.usersByCountry.slice(0, 8)}
                      cx="50%" cy="50%"
                      innerRadius={30} outerRadius={50}
                      dataKey="count" strokeWidth={0}
                    >
                      {stats.usersByCountry.slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={countryColors[i % countryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      {...tooltipStyle}
                      formatter={(v: number, _: any, entry: any) => [v, entry.payload.country]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Country list */}
          <div className="px-5 pb-4">
            {stats.usersByCountry.length === 0 ? (
              <p className="text-sm text-surface-500 py-3 text-center">Sin datos de país</p>
            ) : (
              <ul className="space-y-0">
                {stats.usersByCountry.map((item, idx) => {
                  const pct = totalCountryUsers > 0 ? Math.round((item.count / totalCountryUsers) * 100) : 0;
                  return (
                    <li key={item.country} className="flex items-center justify-between py-2.5 border-b border-surface-800/50 last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0">
                          <CountryFlag country={item.country} size={22} />
                        </div>
                        <span className="text-xs font-medium text-surface-200 truncate">{item.country}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <div className="w-16 h-1.5 rounded-full bg-surface-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              background: countryColors[idx % countryColors.length],
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-white w-6 text-right">{item.count}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Payments + New Users ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Payments table */}
        <div className="lg:col-span-2 rounded-xl border border-surface-800/60 bg-surface-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
            <h3 className="text-sm font-semibold text-white">Pagos recientes</h3>
            <span className="text-[11px] text-surface-500">{stats.recentPayments.length} últimos</span>
          </div>
          {stats.recentPayments.length === 0 ? (
            <p className="p-5 text-sm text-surface-500 text-center">Sin pagos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-800 text-left text-[11px] uppercase tracking-wider text-surface-500">
                    <th className="px-5 py-3 font-medium">Usuario</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Método</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium text-right">Monto</th>
                    <th className="px-5 py-3 font-medium text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPayments.map((p: any) => (
                    <tr key={p.id} className="border-b border-surface-800/50 last:border-0 hover:bg-surface-800/30 transition">
                      <td className="px-5 py-3">
                        <div className="font-medium text-surface-200 text-xs">{p.user?.email || '—'}</div>
                      </td>
                      <td className="px-5 py-3 text-xs text-surface-400">
                        {typeLabels[p.type] || p.type}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${providerColors[p.provider] || 'text-surface-400'}`}>
                          {p.provider === 'PAYPAL' ? 'PayPal' : 'Mercado Pago'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusColors[p.status] || ''}`}>
                          {statusLabels[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-white tabular-nums">
                        {formatCurrency(Number(p.amount))}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-surface-500">
                        {new Date(p.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* New users */}
        <div className="rounded-xl border border-surface-800/60 bg-surface-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-400" />
              Nuevos usuarios
            </h3>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400">
              +{stats.newUsersWeek} esta semana
            </span>
          </div>

          {/* Mini bar chart */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-end gap-1.5 h-16">
              {stats.usersChart.map((d) => {
                const max = Math.max(1, ...stats.usersChart.map((x) => x.count));
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-blue-500/60 hover:bg-blue-500 transition"
                      style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
                      title={`${d.day}: ${d.count} usuarios`}
                    />
                    <span className="text-[9px] text-surface-600">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User list */}
          <div className="px-5 pb-4">
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-surface-500 py-3 text-center">Sin usuarios</p>
            ) : (
              <ul className="space-y-0">
                {stats.recentUsers.map((u: any) => (
                  <li key={u.id} className="flex items-center justify-between py-2.5 border-b border-surface-800/50 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 text-xs font-bold flex-shrink-0">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-surface-200 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-surface-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-surface-500 flex-shrink-0 ml-2">
                      {new Date(u.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: Payment Stats Summary ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-surface-800/60 bg-surface-900 p-4 flex items-center gap-3">
          <div className="rounded-lg bg-surface-800 p-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{conversionRate}%</p>
            <p className="text-[10px] text-surface-500">Tasa de conversión</p>
          </div>
        </div>
        <div className="rounded-xl border border-surface-800/60 bg-surface-900 p-4 flex items-center gap-3">
          <div className="rounded-lg bg-surface-800 p-2.5">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{stats.paymentStats.approved}</p>
            <p className="text-[10px] text-surface-500">Pagos aprobados</p>
          </div>
        </div>
        <div className="rounded-xl border border-surface-800/60 bg-surface-900 p-4 flex items-center gap-3">
          <div className="rounded-lg bg-surface-800 p-2.5">
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{stats.paymentStats.pending}</p>
            <p className="text-[10px] text-surface-500">Pagos pendientes</p>
          </div>
        </div>
        <div className="rounded-xl border border-surface-800/60 bg-surface-900 p-4 flex items-center gap-3">
          <div className="rounded-lg bg-surface-800 p-2.5">
            <TrendingDown className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{stats.paymentStats.rejected}</p>
            <p className="text-[10px] text-surface-500">Pagos rechazados</p>
          </div>
        </div>
      </div>
    </div>
  );
}

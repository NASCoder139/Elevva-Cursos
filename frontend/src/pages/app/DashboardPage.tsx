import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Clock, Trophy, Heart, PlayCircle,
  ArrowRight, TrendingUp, Flame, Calendar,
  Award, Target, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useAccess } from '../../hooks/useAccess';
import { Spinner } from '../../components/ui/Spinner';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { dashboardApi, type DashboardData } from '../../api/dashboard.api';

export function DashboardPage() {
  const { user } = useAuth();
  const { myCourses } = useAccess();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    dashboardApi
      .get()
      .then((res) => { if (mounted) setData(res.data.data); })
      .catch(() => null)
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const stats = data?.stats;
  const continueWatching = data?.continueWatching ?? [];
  const dailyActivity = data?.dailyActivity ?? [];

  const completedL = stats?.completedLessons ?? 0;

  // Progress chart — real cumulative lessons per day
  const progressData = useMemo(() => {
    return dailyActivity.map((d) => ({
      day: d.day,
      progreso: d.cumulativeLessons,
    }));
  }, [dailyActivity]);

  // Weekly activity — real minutes per day
  const weeklyData = useMemo(() => {
    return dailyActivity.map((d) => ({
      day: d.day,
      minutos: d.minutes,
    }));
  }, [dailyActivity]);

  // Donut — real completed vs pending
  const donutData = useMemo(() => {
    const total = myCourses.reduce((acc, c) => acc + (c.lessonCount || 0), 0);
    return [
      { name: 'Completadas', value: completedL, color: '#8b5cf6' },
      { name: 'Pendientes', value: Math.max(total - completedL, 0), color: '#1e1b4b' },
    ];
  }, [completedL, myCourses]);

  const totalLessons = donutData[0].value + donutData[1].value;

  // Streak — count consecutive days with activity (from today backwards)
  const streakDays = useMemo(() => {
    let streak = 0;
    for (let i = dailyActivity.length - 1; i >= 0; i--) {
      if (dailyActivity[i].minutes > 0 || dailyActivity[i].lessonsCompleted > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [dailyActivity]);

  // Weekly minutes total for KPI delta
  const weekMinutes = useMemo(() => {
    return dailyActivity.reduce((acc, d) => acc + d.minutes, 0);
  }, [dailyActivity]);

  const weekLessons = useMemo(() => {
    return dailyActivity.reduce((acc, d) => acc + d.lessonsCompleted, 0);
  }, [dailyActivity]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Cursos en progreso',
      value: stats?.coursesInProgress ?? 0,
      delta: `${stats?.coursesInProgress ?? 0} activos`,
      icon: BookOpen,
      color: 'text-blue-400',
      glow: 'from-blue-500/10 to-transparent',
    },
    {
      label: 'Minutos de aprendizaje',
      value: `${stats?.watchedMinutes ?? 0}m`,
      delta: weekMinutes > 0 ? `+${weekMinutes}m esta semana` : 'Sin actividad esta semana',
      icon: Clock,
      color: 'text-emerald-400',
      glow: 'from-emerald-500/10 to-transparent',
    },
    {
      label: 'Lecciones completadas',
      value: stats?.completedLessons ?? 0,
      delta: weekLessons > 0 ? `+${weekLessons} esta semana` : 'Sin lecciones esta semana',
      icon: Trophy,
      color: 'text-amber-400',
      glow: 'from-amber-500/10 to-transparent',
    },
    {
      label: 'Favoritos',
      value: stats?.favorites ?? 0,
      delta: `${stats?.favorites ?? 0} guardados`,
      icon: Heart,
      color: 'text-pink-400',
      glow: 'from-pink-500/10 to-transparent',
    },
  ];

  const chartTooltipStyle = {
    contentStyle: {
      background: '#1a1a2e',
      border: '1px solid rgba(139,92,246,0.2)',
      borderRadius: '12px',
      fontSize: '12px',
      color: '#e2e8f0',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    itemStyle: { color: '#e2e8f0' },
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            ¡Hola, {user?.firstName}! 👋
          </h1>
          <p className="mt-1 text-sm text-surface-400">
            Continúa aprendiendo y alcanza tus objetivos.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-surface-800 bg-surface-900/50 px-3 py-2">
          <Calendar className="h-4 w-4 text-surface-500" />
          <span className="text-xs text-surface-400">Últimos 7 días</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="relative overflow-hidden rounded-2xl border border-surface-800/60 bg-surface-900 p-5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.glow} pointer-events-none`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`rounded-xl bg-surface-800/80 p-2.5 ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500/60" />
              </div>
              <p className="text-3xl font-bold text-white tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-surface-400 mt-1">{kpi.label}</p>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">{kpi.delta}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Progress Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-800/60 bg-surface-900 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Tu progreso general</h2>
              <p className="text-[11px] text-surface-500 mt-0.5">Lecciones completadas por día</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-primary-500/10 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-primary-500" />
              <span className="text-[11px] text-primary-400">Progreso</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip {...chartTooltipStyle} />
                <Area
                  type="monotone" dataKey="progreso" stroke="#8b5cf6" strokeWidth={2.5}
                  fill="url(#progressGrad)" dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#a78bfa', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Streak + Donut */}
        <div className="space-y-4">
          {/* Streak */}
          <div className="rounded-2xl border border-surface-800/60 bg-surface-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Racha actual</h3>
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 flex-shrink-0">
                <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="32" fill="none" stroke="url(#streakGrad)" strokeWidth="6"
                    strokeDasharray={`${(streakDays / 30) * 201} 201`} strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="streakGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white">{streakDays}</span>
                  <span className="text-[9px] text-surface-500">días</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-surface-400">¡Sigue así! Mantén tu racha de aprendizaje diario.</p>
              </div>
            </div>
          </div>

          {/* Donut */}
          <div className="rounded-2xl border border-surface-800/60 bg-surface-900 p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Lecciones completadas</h3>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData} cx="50%" cy="50%" innerRadius={28} outerRadius={42}
                      dataKey="value" strokeWidth={0}
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />
                  <span className="text-xs text-surface-300">{donutData[0].value} completadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-surface-800" />
                  <span className="text-xs text-surface-500">{donutData[1].value} pendientes</span>
                </div>
                <p className="text-[11px] text-surface-500">
                  {totalLessons > 0 ? `${Math.round((donutData[0].value / totalLessons) * 100)}% del total` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Continue Watching ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary-400" />
            Cursos en progreso
          </h2>
          {continueWatching.length > 0 && (
            <Link to="/my-courses" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {continueWatching.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-700 p-8 text-center">
            <BookOpen className="h-10 w-10 text-surface-600 mx-auto mb-3" />
            <p className="text-sm text-surface-400 mb-3">Aún no has comenzado ningún curso.</p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition"
            >
              Explorar catálogo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {continueWatching.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-surface-800/60 bg-surface-900 p-4 transition hover:border-primary-500/30"
              >
                <Link
                  to={`/course/${item.slug}/learn/${item.lastLessonId}`}
                  className="relative w-full sm:w-44 aspect-video flex-shrink-0 overflow-hidden rounded-xl bg-surface-800"
                >
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <PlayCircle className="h-10 w-10 text-surface-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                    <div className="rounded-full bg-primary-600 p-3">
                      <PlayCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">{item.title}</h3>
                  <p className="text-[11px] text-surface-500 mb-3">
                    Próxima: {item.lastLessonTitle}
                  </p>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1">
                      <ProgressBar value={item.progressPercent} size="sm" />
                    </div>
                    <span className="text-xs font-medium text-surface-300 tabular-nums">
                      {item.progressPercent}%
                    </span>
                  </div>
                  <p className="text-[11px] text-surface-500">
                    {item.completedLessons}/{item.totalLessons} lecciones completadas
                  </p>
                </div>

                <Link
                  to={`/course/${item.slug}/learn/${item.lastLessonId}`}
                  className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Bottom Row: Activity Chart + General Stats ── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Weekly activity */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-800/60 bg-surface-900 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Actividad semanal</h2>
              <p className="text-[11px] text-surface-500 mt-0.5">Minutos de aprendizaje por día</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-emerald-400">Minutos</span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="25%">
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="minutos" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* General stats */}
        <div className="rounded-2xl border border-surface-800/60 bg-surface-900 p-5">
          <h3 className="text-sm font-semibold text-white mb-5">Estadísticas generales</h3>
          <div className="space-y-4">
            {[
              { label: 'Cursos en progreso', value: stats?.coursesInProgress ?? 0, icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Lecciones totales', value: totalLessons, icon: BookOpen, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Lecciones completadas', value: completedL, icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Certificados obtenidos', value: 0, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`rounded-xl ${item.bg} p-2.5`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-surface-500">{item.label}</p>
                  <p className="text-lg font-bold text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

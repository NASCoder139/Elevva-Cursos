import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Play, CheckCircle2, Sparkles, BookOpen, BarChart3,
  Clock, Target, TrendingUp, Star,
  Quote, Users, ChevronRight, Flame, GraduationCap,
  LayoutDashboard, LineChart, Trophy, Tag,
} from 'lucide-react';
import { plansApi, type PublicPlan } from '../../api/payments.api';
import { settingsApi, type PlansPromoPublic } from '../../api/settings.api';
import { coursesApi } from '../../api/courses.api';
import type { Course } from '../../types/course.types';

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════ */
function AnimatedCounter({ end, suffix = '', decimals = 0 }: { end: number; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - start) / 2000, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          setCount(parseFloat((eased * end).toFixed(decimals)));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, decimals]);

  return <span ref={ref}>{decimals > 0 ? count.toFixed(decimals) : count}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════
   FADE UP
   ═══════════════════════════════════════════════════════ */
function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DATOS
   ═══════════════════════════════════════════════════════ */
const indicators = [
  { value: 92, suffix: '%', label: 'Tasa de finalización', desc: 'de estudiantes completan sus cursos', icon: Target },
  { value: 4.9, suffix: '/5', label: 'Satisfacción', desc: 'calificación promedio de los cursos', icon: Star, decimals: 1 },
  { value: 87, suffix: '%', label: 'Aplican lo aprendido', desc: 'usan sus nuevas habilidades laboralmente', icon: TrendingUp },
  { value: 89, suffix: '%', label: 'Nos recomiendan', desc: 'recomendarían Elevva a un colega', icon: Users },
];

const steps = [
  { n: '01', title: 'Elige tu camino', desc: 'Explora el catálogo y elige los cursos que se ajusten a tus metas.' },
  { n: '02', title: 'Aprende haciendo', desc: 'Lecciones en video HD, ejercicios prácticos y recursos descargables.' },
  { n: '03', title: 'Mide tu avance', desc: 'Dashboard con estadísticas detalladas, racha y progreso por curso.' },
  { n: '04', title: 'Obtén resultados', desc: 'Completa cursos, obtén certificados y aplica tus nuevas habilidades.' },
];

const testimonials = [
  { name: 'Laura Méndez', role: 'Diseñadora UX · Santiago', quote: 'Los cursos son increíblemente prácticos. A la semana ya estaba aplicando lo que aprendí en proyectos reales.', avatar: 'LM' },
  { name: 'Carlos Rivera', role: 'Full Stack Dev · CDMX', quote: 'La calidad del contenido es de otro nivel. El dashboard de progreso me motiva a no dejar ningún curso a medias.', avatar: 'CR' },
  { name: 'Sofía García', role: 'Marketing · Buenos Aires', quote: 'Probé la demo de 30 minutos y me suscribí al instante. La comunidad hace toda la diferencia.', avatar: 'SG' },
  { name: 'Andrés Castillo', role: 'Product Manager · Bogotá', quote: 'Estudiar en Elevva se siente como tener un mentor personal. Los certificados me abrieron puertas.', avatar: 'AC' },
];

const planUI: Record<string, { period: string; highlight: boolean; ribbon?: string; badgeColor: string }> = {
  SUBSCRIPTION_MONTHLY: { period: '/mes', highlight: false, badgeColor: 'from-violet-500 to-fuchsia-500' },
  SUBSCRIPTION_ANNUAL: { period: '/año', highlight: true, ribbon: '¡2 MESES GRATIS!', badgeColor: 'from-amber-400 to-orange-500' },
};

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const endMs = new Date(target).getTime();
  if (isNaN(endMs)) return null;
  const diff = Math.max(0, endMs - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, ended: diff === 0 };
}

function planDiscount(plan: PublicPlan): { pct: number; save: number } | null {
  const price = Number(plan.price);
  const compare = plan.comparePrice != null ? Number(plan.comparePrice) : NaN;
  if (isNaN(price) || isNaN(compare) || compare <= price) return null;
  return { pct: Math.round(((compare - price) / compare) * 100), save: compare - price };
}

/* ═══════════════════════════════════════════════════════
   HERO DASHBOARD PANEL
   ═══════════════════════════════════════════════════════ */
function HeroDashboard() {
  const chartData = [20, 35, 28, 45, 40, 65, 55, 72, 68, 85, 78, 92];
  const maxVal = Math.max(...chartData);

  return (
    <div className="relative group">
      {/* Glow */}
      <div className="absolute -inset-6 bg-gradient-to-br from-primary-500/15 to-violet-500/15 rounded-3xl blur-2xl group-hover:from-primary-500/25 group-hover:to-violet-500/25 transition-all duration-700" />

      <div className="relative rounded-2xl border border-surface-800/80 bg-surface-900/90 backdrop-blur-xl p-6 shadow-2xl shadow-black/30 group-hover:border-surface-700/80 transition-all duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-400" />
            </div>
            <div>
              <div className="text-xs text-surface-500">Tu progreso general</div>
              <div className="text-sm font-semibold text-white">Este mes</div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400">+23%</span>
          </div>
        </div>

        {/* Big percentage */}
        <div className="flex items-end gap-3 mb-5">
          <span className="text-5xl font-bold text-white tracking-tight">78%</span>
          <span className="text-xs text-surface-500 pb-2">vs 63% mes anterior</span>
        </div>

        {/* Chart */}
        <div className="relative h-28 mb-5">
          <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="heroLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="35%" stopColor="#b91c1c" />
                <stop offset="70%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>

              <filter id="heroGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Área */}
            <path
              d={`M0,${100 - (chartData[0] / maxVal) * 80} ${chartData
                .map((v, i) => `L${(i / (chartData.length - 1)) * 400},${100 - (v / maxVal) * 80}`)
                .join(' ')} L400,100 L0,100 Z`}
              fill="url(#heroChartGrad)"
              className="animate-chart-area"
            />

            {/* Línea glow */}
            <path
              d={`M0,${100 - (chartData[0] / maxVal) * 80} ${chartData
                .map((v, i) => `L${(i / (chartData.length - 1)) * 400},${100 - (v / maxVal) * 80}`)
                .join(' ')}`}
              fill="none"
              stroke="url(#heroLineGrad)"
              strokeOpacity="0.35"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="100"
              filter="url(#heroGlow)"
              className="animate-chart-line"
            />

            {/* Línea principal */}
            <path
              d={`M0,${100 - (chartData[0] / maxVal) * 80} ${chartData
                .map((v, i) => `L${(i / (chartData.length - 1)) * 400},${100 - (v / maxVal) * 80}`)
                .join(' ')}`}
              fill="none"
              stroke="url(#heroLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="100"
              className="animate-chart-line"
            />

            {/* Punto final animado */}
            <circle
              cx={400}
              cy={100 - (chartData[chartData.length - 1] / maxVal) * 80}
              r={4}
              fill="#c4b5fd"
              stroke="#1a1a2e"
              strokeWidth="2"
              className="animate-chart-dot"
            />
          </svg>

          {/* X labels */}
          <div className="absolute bottom-0 inset-x-0 flex justify-between px-1">
            {['1 Abr', '', '', '8 Abr', '', '', '15 Abr', '', '', '22 Abr', '', ''].map((l, i) => (
              <span key={i} className="text-[9px] text-surface-600">{l}</span>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: BookOpen, label: 'Lecciones', value: '128', sub: 'completadas' },
            { icon: Clock, label: 'Horas de estudio', value: '24h 30m', sub: 'este mes' },
            { icon: Flame, label: 'Racha actual', value: '12 días', sub: 'consecutivos' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-surface-800/50 border border-surface-800/60 p-3 hover:bg-surface-800/80 hover:border-surface-700/60 transition-all duration-300">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className="h-3 w-3 text-surface-500" />
                <span className="text-[10px] text-surface-500">{s.label}</span>
              </div>
              <div className="text-sm font-bold text-white">{s.value}</div>
              <div className="text-[9px] text-surface-600">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [plansPromo, setPlansPromo] = useState<PlansPromoPublic>({ enabled: false, endsAt: null });
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);

  useEffect(() => {
    plansApi.list().then((res) => setPlans(res.data.data)).catch(() => {});
    settingsApi.getPlansPromo().then((res) => setPlansPromo(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    coursesApi
      .getFeatured()
      .then((res) => setFeaturedCourses(res.data.data as Course[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (window.location.hash === '#pricing') {
      const el = document.getElementById('pricing');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div className="bg-white dark:bg-surface-950 text-surface-900 dark:text-white overflow-hidden">
      {/* ═══════ HERO ═══════ */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-screen flex items-center pt-20"
      >
        {/* Ambient blurs */}
        <div className="absolute top-20 left-0 w-[700px] h-[700px] bg-primary-600/5 dark:bg-primary-600/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-violet-600/4 dark:bg-violet-600/6 rounded-full blur-[120px]" />

        {/* Mouse glow */}
        <div
          className="absolute pointer-events-none z-10 transition-opacity duration-500"
          style={{
            left: mousePos.x - 250,
            top: mousePos.y - 250,
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(124,92,242,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />
        <div className="absolute inset-0 opacity-0 dark:opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div>
              <FadeUp>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 dark:bg-primary-500/8 border border-primary-500/20 dark:border-primary-500/15 text-primary-600 dark:text-primary-300 text-xs font-medium mb-8 hover:bg-primary-500/15 dark:hover:bg-primary-500/12 hover:border-primary-400/30 dark:hover:border-primary-400/25 transition-all duration-300">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  Plataforma #1 en educación online
                </div>
              </FadeUp>

              <FadeUp delay={80}>
                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05]">
                  Aprende sin límites,{' '}
                  <span className="bg-gradient-to-r from-primary-400 via-violet-400 to-purple-300 bg-clip-text text-transparent text-shimmer">
                    Crece sin fronteras.
                  </span>
                </h1>
              </FadeUp>

              <FadeUp delay={160}>
                <p className="mt-6 text-base sm:text-lg text-surface-500 dark:text-surface-400 leading-relaxed max-w-lg">
                  Cursos premium creados por expertos para que adquieras habilidades reales y avances en tu carrera.
                </p>
              </FadeUp>

              <FadeUp delay={240}>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to="/register"
                    className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  >
                    Activar demo 30 min
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                  <Link
                    to="/store"
                    className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl border border-surface-300 dark:border-surface-800 text-surface-600 dark:text-surface-300 font-medium text-sm hover:border-surface-400 dark:hover:border-surface-700 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-900/50 transition-all duration-300"
                  >
                    <Play className="h-4 w-4 text-primary-400 group-hover:scale-110 transition-transform" />
                    Ver cursos
                  </Link>
                </div>
              </FadeUp>

              <FadeUp delay={320}>
                <div className="mt-6 flex items-center gap-6 text-xs text-surface-500">
                  <span className="flex items-center gap-1.5 hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Sin tarjeta de crédito
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-surface-700 dark:hover:text-surface-300 transition-colors">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Cancelas cuando quieras
                  </span>
                </div>
              </FadeUp>
            </div>

            {/* Right — Dashboard Panel */}
            <FadeUp delay={300} className="hidden lg:block">
              <div className="animate-float-slow">
                <HeroDashboard />
              </div>
            </FadeUp>
          </div>

          {/* Trust bar */}
          <FadeUp delay={400}>
            <div className="mt-20 lg:mt-24 pt-10 border-t border-surface-200 dark:border-surface-800/40">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                {[
                  { icon: GraduationCap, value: '100+', label: 'Cursos premium' },
                  { icon: Play, value: '500+', label: 'Lecciones en video' },
                  { icon: Users, value: '10K+', label: 'Estudiantes activos' },
                  { icon: Star, value: '4.9/5', label: 'Calificación promedio', stars: true },
                ].map((item) => (
                  <div key={item.label} className="group flex items-center gap-3 cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-800/60 flex items-center justify-center group-hover:bg-primary-500/10 group-hover:border-primary-500/20 transition-all duration-300">
                      <item.icon className="h-5 w-5 text-surface-500 group-hover:text-primary-400 transition-colors duration-300" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors duration-300">
                        {item.value}
                      </div>
                      <div className="text-[11px] text-surface-500">{item.label}</div>
                      {item.stars && (
                        <div className="flex gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════ CURSOS DESTACADOS ═══════ */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50/50 to-white dark:from-surface-950 dark:via-surface-900/20 dark:to-surface-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-primary-500/10 dark:bg-primary-500/8 border border-primary-500/20 dark:border-primary-500/15 text-primary-600 dark:text-primary-400 text-xs font-semibold uppercase tracking-wider mb-4">
                Por qué elegirnos
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Todo lo que necesitas para{' '}
                <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">crecer</span>
              </h2>
              <p className="mt-4 text-surface-500 dark:text-surface-400 max-w-xl mx-auto">
                Una plataforma pensada para que cada minuto de estudio se convierta en una habilidad real. Estos son algunos de nuestros cursos.
              </p>
            </div>
          </FadeUp>

          {featuredCourses.length === 0 ? (
            <div className="text-center py-12 text-sm text-surface-500 dark:text-surface-500">
              Cargando cursos destacados…
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredCourses.slice(0, 6).map((c, i) => (
                <FadeUp key={c.id} delay={i * 60}>
                  <Link
                    to={`/course/${c.slug}`}
                    className="group relative block rounded-2xl border border-surface-200 dark:border-surface-800/50 bg-white dark:bg-surface-900/30 backdrop-blur-sm hover:border-primary-200 dark:hover:border-surface-700/60 hover:bg-surface-50 dark:hover:bg-surface-800/30 shadow-sm dark:shadow-none hover:shadow-xl hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 transition-all duration-500 h-full overflow-hidden"
                  >
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none" />

                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-surface-100 dark:bg-surface-800/60">
                      {c.thumbnailUrl ? (
                        <img
                          src={c.thumbnailUrl}
                          alt={c.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-surface-400 dark:text-surface-600">
                          <GraduationCap className="h-14 w-14" />
                        </div>
                      )}
                      {c.isFeatured && (
                        <div className="absolute left-3 top-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wider">
                          <Sparkles className="h-2.5 w-2.5" /> Destacado
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="relative px-5 py-4">
                      <h3 className="text-base font-semibold text-surface-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors duration-300">
                        {c.title}
                      </h3>
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/store"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-surface-200 dark:border-surface-800/60 bg-white dark:bg-surface-900/30 hover:bg-surface-50 dark:hover:bg-surface-800/50 text-sm font-semibold text-surface-900 dark:text-white shadow-sm transition-all duration-300"
            >
              Ver todos los cursos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ MEDIMOS TU PROGRESO — FEATURE VISUAL ═══════ */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-100/40 via-white to-violet-100/40 dark:from-primary-950/20 dark:via-surface-950 dark:to-violet-950/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Visual panel */}
            <FadeUp>
              <div className="relative group">
                <div className="absolute -inset-6 bg-gradient-to-br from-primary-500/10 to-violet-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative rounded-2xl border border-surface-800/70 bg-surface-900/80 backdrop-blur-xl overflow-hidden">
                  {/* Top bar */}
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-800/50 bg-surface-900/50">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-[10px] text-surface-600 font-mono">elevva.com/dashboard</span>
                    </div>
                  </div>

                  <div className="p-5">
                    {/* User greeting */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="text-lg font-bold text-white">Bienvenido, Carlos</div>
                        <div className="text-xs text-surface-500">Tu resumen de esta semana</div>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <Flame className="h-3 w-3 text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-400">7 días</span>
                      </div>
                    </div>

                    {/* Stats cards row */}
                    <div className="grid grid-cols-4 gap-2 mb-5">
                      {[
                        { label: 'Completadas', value: '24', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'En progreso', value: '3', icon: LineChart, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Minutos', value: '186', icon: Clock, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                        { label: 'Certificados', value: '5', icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl bg-surface-800/40 border border-surface-800/50 p-2.5 text-center group-hover:bg-surface-800/60 transition-all duration-300">
                          <div className={`w-6 h-6 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-1.5`}>
                            <s.icon className={`h-3 w-3 ${s.color}`} />
                          </div>
                          <div className="text-sm font-bold text-white">{s.value}</div>
                          <div className="text-[8px] text-surface-600 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Weekly activity bars */}
                    <div className="rounded-xl bg-surface-800/30 border border-surface-800/50 p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-surface-400">Actividad semanal</span>
                        <span className="text-[10px] text-primary-400 font-medium">+23% vs anterior</span>
                      </div>

                      <div className="flex items-end gap-2 h-20">
                        {[45, 65, 35, 80, 90, 55, 70].map((h, i) => (
                          <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5">
                            <div
                              className="weekly-bar w-full rounded-md bg-gradient-to-t from-primary-600/80 to-violet-500/80 group-hover:from-primary-500 group-hover:to-violet-400"
                              style={
                                {
                                  '--bar-height': `${h}%`,
                                  animationDelay: `${i * 0.18}s`,
                                } as React.CSSProperties
                              }
                            />
                            <span className="text-[9px] text-surface-600 font-medium">
                              {['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Course progress */}
                    <div className="space-y-2.5">
                      {[
                        { title: 'React Avanzado', progress: 78, color: 'bg-blue-500' },
                        { title: 'Node.js + NestJS', progress: 45, color: 'bg-emerald-500' },
                        { title: 'UI/UX Design', progress: 92, color: 'bg-violet-500' },
                      ].map((c) => (
                        <div key={c.title} className="flex items-center gap-3 rounded-lg bg-surface-800/20 px-3 py-2 border border-surface-800/30 hover:bg-surface-800/40 transition-all duration-300">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-surface-300 truncate">{c.title}</div>
                            <div className="mt-1.5 h-1 rounded-full bg-surface-800 overflow-hidden">
                              <div className={`h-full rounded-full ${c.color} transition-all duration-1000`} style={{ width: `${c.progress}%` }} />
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-white tabular-nums">{c.progress}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Right — Copy */}
            <div>
              <FadeUp delay={100}>
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/8 border border-blue-500/20 dark:border-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  Tu panel personal
                </span>
              </FadeUp>
              <FadeUp delay={150}>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Medimos cada paso de tu{' '}
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">progreso</span>
                </h2>
              </FadeUp>
              <FadeUp delay={200}>
                <p className="text-surface-500 dark:text-surface-400 leading-relaxed mb-8">
                  No es solo ver videos. Tu dashboard personal te muestra exactamente dónde estás, cuánto has avanzado y qué te falta para completar tus metas. Así te mantienes motivado.
                </p>
              </FadeUp>
              <FadeUp delay={250}>
                <ul className="space-y-4">
                  {[
                    { icon: BarChart3, text: 'Gráficos de actividad semanal en tiempo real' },
                    { icon: Target, text: 'Porcentaje de progreso por cada curso' },
                    { icon: Flame, text: 'Racha de estudio y minutos dedicados' },
                    { icon: LineChart, text: 'Continúa exactamente donde lo dejaste' },
                    { icon: Trophy, text: 'Certificados al completar cada curso' },
                  ].map((item) => (
                    <li key={item.text} className="flex items-center gap-3 group/item cursor-default">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-800/60 flex items-center justify-center group-hover/item:bg-primary-500/10 group-hover/item:border-primary-500/20 transition-all duration-300">
                        <item.icon className="h-4 w-4 text-surface-500 group-hover/item:text-primary-400 transition-colors" />
                      </div>
                      <span className="text-sm text-surface-600 dark:text-surface-300 group-hover/item:text-surface-900 dark:group-hover/item:text-white transition-colors duration-300">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ INDICADORES ═══════ */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50/50 to-white dark:from-surface-950 dark:via-surface-900/20 dark:to-surface-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/8 border border-emerald-500/20 dark:border-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
                Resultados reales
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Números que hablan{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">por sí solos</span>
              </h2>
            </div>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {indicators.map((ind, i) => (
              <FadeUp key={ind.label} delay={i * 80}>
                <div className="group relative rounded-2xl border border-surface-200 dark:border-surface-800/50 bg-white dark:bg-surface-900/30 p-8 text-center backdrop-blur-sm hover:border-primary-300 dark:hover:border-primary-500/20 hover:bg-surface-50 dark:hover:bg-surface-800/30 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary-500/5 shadow-sm dark:shadow-none transition-all duration-500 cursor-default">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/10 dark:bg-primary-500/8 border border-primary-500/20 dark:border-primary-500/15 mb-5 group-hover:scale-110 group-hover:bg-primary-500/15 dark:group-hover:bg-primary-500/12 transition-all duration-500">
                    <ind.icon className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                  </div>
                  <div className="text-4xl font-bold text-surface-900 dark:text-white mb-1 tabular-nums">
                    <AnimatedCounter end={ind.value} suffix={ind.suffix} decimals={ind.decimals || 0} />
                  </div>
                  <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1">{ind.label}</div>
                  <div className="text-[11px] text-surface-500">{ind.desc}</div>
                  <div className="mt-4 h-1 rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-1000" style={{ width: `${ind.decimals ? (ind.value / 5) * 100 : ind.value}%` }} />
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PROCESO ═══════ */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-100/30 via-white to-primary-100/30 dark:from-violet-950/15 dark:via-surface-950 dark:to-primary-950/15" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-500/8 border border-violet-500/20 dark:border-violet-500/15 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
                Cómo funciona
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Un proceso diseñado para{' '}
                <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">resultados</span>
              </h2>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <FadeUp key={s.n} delay={i * 100}>
                <div className="group relative rounded-2xl border border-surface-200 dark:border-surface-800/50 bg-white dark:bg-surface-900/30 p-7 backdrop-blur-sm hover:border-violet-300 dark:hover:border-violet-500/20 hover:bg-surface-50 dark:hover:bg-surface-800/30 hover:-translate-y-1 shadow-sm dark:shadow-none transition-all duration-500 cursor-default h-full">
                  <div className="text-4xl font-black text-surface-200 dark:text-surface-800/40 group-hover:text-primary-200 dark:group-hover:text-primary-500/15 transition-colors duration-500 mb-4 tabular-nums">{s.n}</div>
                  {i < 3 && <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-surface-300 dark:bg-surface-800 group-hover:bg-primary-500/30 transition-colors" />}
                  <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors duration-300">{s.title}</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed group-hover:text-surface-700 dark:group-hover:text-surface-300 transition-colors duration-300">{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIOS ═══════ */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50/50 to-white dark:from-surface-950 dark:via-surface-900/20 dark:to-surface-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp>
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/8 border border-amber-500/20 dark:border-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
                Testimonios
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Lo que dicen nuestros{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">estudiantes</span>
              </h2>
            </div>
          </FadeUp>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {testimonials.map((t, i) => (
              <FadeUp key={t.name} delay={i * 60}>
                <div className="group relative rounded-2xl border border-surface-200 dark:border-surface-800/50 bg-white dark:bg-surface-900/30 p-6 backdrop-blur-sm hover:border-amber-300 dark:hover:border-amber-500/15 hover:bg-surface-50 dark:hover:bg-surface-800/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/5 shadow-sm dark:shadow-none transition-all duration-500 cursor-default h-full flex flex-col">
                  <Quote className="h-7 w-7 text-surface-200 dark:text-surface-800/60 group-hover:text-primary-200 dark:group-hover:text-primary-500/20 transition-colors duration-500 mb-3" />
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed mb-5 flex-1 group-hover:text-surface-700 dark:group-hover:text-surface-300 transition-colors">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-surface-200 dark:border-surface-800/40">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-500/20 transition-all duration-300">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-surface-900 dark:text-white">{t.name}</div>
                      <div className="text-[10px] text-surface-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PLANES ═══════ */}
      <PricingSection plans={plans} promo={plansPromo} />


    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PRICING SECTION (con countdown y descuentos destacados)
   ═══════════════════════════════════════════════════════ */
function PricingSection({ plans, promo }: { plans: PublicPlan[]; promo: PlansPromoPublic }) {
  // Modo oferta global: una sola fecha de fin para todos los planes.
  const promoActive =
    promo.enabled && !!promo.endsAt && new Date(promo.endsAt).getTime() > Date.now();
  const countdown = useCountdown(promoActive ? promo.endsAt : null);
  const maxDiscount = Math.max(
    0,
    ...plans.map((p) => planDiscount(p)?.pct ?? 0),
  );

  return (
    <section id="pricing" className="relative py-28 scroll-mt-20">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-100/30 via-white to-violet-100/30 dark:from-primary-950/15 dark:via-surface-950 dark:to-violet-950/15" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-500/10 dark:bg-primary-500/8 border border-primary-500/20 dark:border-primary-500/15 text-primary-600 dark:text-primary-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Planes
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Simples,{' '}
              <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">transparentes</span>
            </h2>
            <p className="mt-4 text-surface-500 dark:text-surface-400">Elige el plan que mejor se adapte a tu ritmo</p>
          </div>
        </FadeUp>

        {/* Countdown banner */}
        {promoActive && countdown && !countdown.ended && (
          <FadeUp delay={80}>
            <div className="mx-auto mb-10 max-w-2xl">
              <div className="relative rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/5 via-fuchsia-500/5 to-violet-500/5 dark:from-amber-500/10 dark:via-fuchsia-500/10 dark:to-violet-500/10 px-5 py-4 shadow-lg shadow-amber-500/5 flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-amber-600 dark:text-amber-400">
                  <Tag className="h-4 w-4" />
                  LA OFERTA TERMINA EN:
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { v: countdown.days, label: 'DÍAS' },
                    { v: countdown.hours, label: 'HORAS' },
                    { v: countdown.minutes, label: 'MIN' },
                    { v: countdown.seconds, label: 'SEG' },
                  ].map((u) => (
                    <div key={u.label} className="flex flex-col items-center min-w-[44px] rounded-lg bg-white/70 dark:bg-surface-900/70 border border-surface-200 dark:border-surface-800 px-2 py-1">
                      <span className="text-lg font-bold tabular-nums text-surface-900 dark:text-white">
                        {String(u.v).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] text-surface-500 font-semibold tracking-wider">{u.label}</span>
                    </div>
                  ))}
                </div>
                {maxDiscount > 0 && (
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow">
                    HASTA {maxDiscount}% OFF
                  </div>
                )}
              </div>
            </div>
          </FadeUp>
        )}

        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {plans.length === 0 ? (
            <div className="md:col-span-2 text-center text-sm text-surface-500 py-10">
              Cargando planes...
            </div>
          ) : (
            plans.map((plan, i) => {
              const ui = planUI[plan.key] ?? { period: '', highlight: false, badgeColor: 'from-primary-500 to-violet-500' };
              const disc = promoActive ? planDiscount(plan) : null;
              const showPromo = promoActive && disc !== null;
              const currentPrice = Number(plan.price);
              const comparePrice = plan.comparePrice != null ? Number(plan.comparePrice) : null;

              return (
                <FadeUp key={plan.id} delay={i * 100}>
                  <div className={`group relative rounded-2xl p-8 pt-9 border backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl h-full flex flex-col overflow-hidden ${ui.highlight
                    ? 'border-primary-500/40 bg-primary-50 dark:bg-surface-900/60 shadow-xl shadow-primary-500/5 hover:border-primary-400/60 hover:shadow-primary-500/15'
                    : 'border-surface-200 dark:border-surface-800/50 bg-white dark:bg-surface-900/30 hover:border-surface-300 dark:hover:border-surface-700/60 shadow-sm dark:shadow-none'
                    }`}>
                    {ui.highlight && <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none" />}

                    {/* Badge superior (Más Popular / Mejor Valor) */}
                    {plan.badge && (
                      <div className={`absolute -top-0.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-full bg-gradient-to-r ${ui.badgeColor} text-white text-[11px] font-bold shadow-lg`}>
                        {plan.badge}
                      </div>
                    )}

                    {/* Cinta esquina (solo si promo activa en anual) */}
                    {showPromo && ui.ribbon && (
                      <div className="absolute top-6 -right-12 rotate-45 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-12 py-1 shadow-lg tracking-wider">
                        {ui.ribbon}
                      </div>
                    )}

                    <div className="relative flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white">{plan.label}</h3>

                      <div className="mt-4 flex items-baseline gap-2 flex-wrap">
                        {showPromo && comparePrice !== null && (
                          <span className="text-lg text-surface-400 line-through tabular-nums">
                            ${comparePrice.toFixed(2)}
                          </span>
                        )}
                        <span className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-violet-500 bg-clip-text text-transparent tracking-tight tabular-nums">
                          ${currentPrice.toFixed(2)}
                        </span>
                        <span className="text-surface-500 text-sm">{ui.period}</span>
                      </div>

                      {showPromo && disc && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300 text-[11px] font-bold">
                            {disc.pct}% OFF
                          </span>
                          <span className="text-[11px] text-surface-500 font-medium">
                            Ahorra ${disc.save.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {!showPromo && plan.savings && (
                        <div className="mt-3 inline-flex self-start items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                          {plan.savings}
                        </div>
                      )}

                      <ul className="mt-6 space-y-3 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 group/feat cursor-default">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5 group-hover/feat:scale-110 transition-transform" />
                            <span className="text-sm text-surface-500 dark:text-surface-400 group-hover/feat:text-surface-900 dark:group-hover/feat:text-white transition-colors">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        to="/register"
                        className={`mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${ui.highlight
                          ? 'bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:shadow-lg hover:shadow-primary-500/25 hover:scale-[1.01] active:scale-[0.99]'
                          : 'border border-surface-300 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-primary-500/40 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800/50'
                          }`}
                      >
                        Empezar ahora <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </FadeUp>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

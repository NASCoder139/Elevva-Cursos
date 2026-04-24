import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    BookOpen,
    Trophy,
    Heart,
    Clock3,
    Flame,
    Target,
    Rocket,
    Users,
    TrendingUp,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   FADE UP
   ═══════════════════════════════════════════════════════ */
function FadeUp({
    children,
    delay = 0,
    className = '',
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    obs.disconnect();
                }
            },
            { threshold: 0.12 }
        );

        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════ */
const missionPoints = [
    {
        icon: Target,
        title: 'Aprender para transformar',
        desc: 'Creemos que el conocimiento práctico abre nuevas oportunidades para crecer, emprender y avanzar profesionalmente.',
    },
    {
        icon: BookOpen,
        title: 'Contenido que sí aporta valor',
        desc: 'Diseñamos cada curso con enfoque real, ejemplos claros y herramientas útiles para que aprendas de verdad.',
    },
    {
        icon: Users,
        title: 'Acompañamiento que impulsa',
        desc: 'No estudias solo. Te acompañamos con recursos, estructura y una experiencia que te ayuda a mantener el ritmo.',
    },
    {
        icon: Rocket,
        title: 'De aprender a emprender',
        desc: 'Nuestra misión es que puedas aplicar lo aprendido, crear tus proyectos y generar resultados en tu vida real.',
    },
];

const commitmentCards = [
    {
        icon: CheckCircle2,
        title: 'Aprende a tu ritmo',
        desc: 'Estudia cuando quieras, desde cualquier lugar y sin fricción.',
        color: 'from-violet-500 to-primary-500',
    },
    {
        icon: Sparkles,
        title: 'Aplica y construye',
        desc: 'Cada curso está pensado para llevarte de la teoría a la práctica.',
        color: 'from-emerald-500 to-teal-500',
    },
    {
        icon: TrendingUp,
        title: 'Mide tu progreso',
        desc: 'Visualiza avances, supera metas y mantén la motivación.',
        color: 'from-amber-500 to-orange-500',
    },
    {
        icon: Users,
        title: 'Únete a una comunidad',
        desc: 'Crece junto a personas que también quieren mejorar.',
        color: 'from-pink-500 to-rose-500',
    },
];

/* ═══════════════════════════════════════════════════════
   DASHBOARD MOCKUP
   ═══════════════════════════════════════════════════════ */
function StudentProgressPanel() {
    const chartData = [0, 4, 6, 7, 10, 15, 16, 20, 22];
    const maxVal = Math.max(...chartData);

    return (
        <div className="relative group">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary-500/10 via-violet-500/10 to-cyan-500/10 blur-3xl opacity-80" />

            <div className="relative rounded-[28px] border border-surface-200/80 dark:border-surface-800/70 bg-white/90 dark:bg-surface-900/90 p-5 sm:p-6 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/30">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                            Tu progreso de aprendizaje
                        </h3>
                        <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">
                            Panel con avance y objetivos reales
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800/70 px-3 py-2">
                        <Clock3 className="h-4 w-4 text-surface-500 dark:text-surface-400" />
                        <span className="text-xs text-surface-700 dark:text-surface-300">
                            Últimos 30 días
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                    {[
                        {
                            icon: BookOpen,
                            value: '2',
                            label: 'Cursos en progreso',
                            sub: '+2 este mes',
                            iconBg: 'bg-violet-500/10',
                            iconColor: 'text-violet-500 dark:text-violet-400',
                        },
                        {
                            icon: Clock3,
                            value: '22m',
                            label: 'Minutos de aprendizaje',
                            sub: '+15m vs. mes anterior',
                            iconBg: 'bg-emerald-500/10',
                            iconColor: 'text-emerald-500 dark:text-emerald-400',
                        },
                        {
                            icon: Trophy,
                            value: '2',
                            label: 'Lecciones completadas',
                            sub: '+2 este mes',
                            iconBg: 'bg-amber-500/10',
                            iconColor: 'text-amber-500 dark:text-amber-400',
                        },
                        {
                            icon: Heart,
                            value: '1',
                            label: 'Favoritos guardados',
                            sub: '+1 este mes',
                            iconBg: 'bg-pink-500/10',
                            iconColor: 'text-pink-500 dark:text-pink-400',
                        },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-2xl border border-surface-200 dark:border-surface-800/60 bg-surface-50 dark:bg-surface-800/40 p-4"
                        >
                            <div
                                className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center mb-4`}
                            >
                                <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                            </div>
                            <div className="text-4xl font-bold text-surface-900 dark:text-white leading-none">
                                {item.value}
                            </div>
                            <div className="text-sm text-surface-700 dark:text-surface-300 mt-3">
                                {item.label}
                            </div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                {item.sub}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="rounded-2xl border border-surface-200 dark:border-surface-800/60 bg-surface-50 dark:bg-surface-800/30 p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-lg font-semibold text-surface-900 dark:text-white">
                                Tu evolución
                            </p>
                            <p className="text-xs text-surface-500 dark:text-surface-500 mt-1">
                                Minutos de aprendizaje
                            </p>
                        </div>
                    </div>

                    <div className="relative h-56">
                        <svg viewBox="0 0 500 220" className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="aboutLineGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#7c3aed" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                                <linearGradient id="aboutAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.22" />
                                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {[0, 1, 2, 3].map((i) => (
                                <line
                                    key={i}
                                    x1="0"
                                    y1={30 + i * 45}
                                    x2="500"
                                    y2={30 + i * 45}
                                    stroke="rgba(148,163,184,0.18)"
                                    strokeDasharray="4 6"
                                />
                            ))}

                            <path
                                d={`M0,${180 - (chartData[0] / maxVal) * 140} ${chartData
                                    .map(
                                        (v, i) =>
                                            `L${(i / (chartData.length - 1)) * 500},${180 - (v / maxVal) * 140}`
                                    )
                                    .join(' ')} L500,200 L0,200 Z`}
                                fill="url(#aboutAreaGradient)"
                            />

                            <path
                                d={`M0,${180 - (chartData[0] / maxVal) * 140} ${chartData
                                    .map(
                                        (v, i) =>
                                            `L${(i / (chartData.length - 1)) * 500},${180 - (v / maxVal) * 140}`
                                    )
                                    .join(' ')}`}
                                fill="none"
                                stroke="url(#aboutLineGradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {chartData.map((v, i) => {
                                const x = (i / (chartData.length - 1)) * 500;
                                const y = 180 - (v / maxVal) * 140;
                                const isLast = i === chartData.length - 1;

                                return (
                                    <circle
                                        key={i}
                                        cx={x}
                                        cy={y}
                                        r={isLast ? 5 : 3}
                                        fill={isLast ? '#a78bfa' : '#8b5cf6'}
                                        stroke="#111827"
                                        strokeWidth="2"
                                    />
                                );
                            })}
                        </svg>

                        <div className="absolute top-0 right-2 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
                            <div className="text-2xl font-bold text-surface-900 dark:text-white leading-none">
                                22m
                            </div>
                            <div className="text-xs text-surface-700 dark:text-surface-300 mt-1">
                                Hoy
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[10px] text-surface-500 dark:text-surface-600">
                            <span>1</span>
                            <span>7</span>
                            <span>14</span>
                            <span>21</span>
                            <span>30</span>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-surface-200 dark:border-surface-800/60 bg-surface-50 dark:bg-surface-800/30 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg font-semibold text-surface-900 dark:text-white">
                                Racha de aprendizaje
                            </span>
                            <Flame className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="relative h-24 w-24 shrink-0">
                                <div className="absolute inset-0 rounded-full border-[8px] border-surface-200 dark:border-violet-500/20" />
                                <div
                                    className="absolute inset-0 rounded-full border-[8px] border-transparent"
                                    style={{
                                        borderTopColor: '#8b5cf6',
                                        borderRightColor: '#8b5cf6',
                                        transform: 'rotate(30deg)',
                                    }}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold leading-none text-surface-900 dark:text-white">
                                        7
                                    </span>
                                    <span className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                        días
                                    </span>
                                </div>
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-medium text-surface-900 dark:text-white mb-1">
                                    Vas por buen camino
                                </p>
                                <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                                    Mantén tu constancia y sigue avanzando para completar tus metas semanales.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-surface-200 dark:border-surface-800/60 bg-surface-50 dark:bg-surface-800/30 p-5">
                        <h4 className="text-lg font-semibold text-surface-900 dark:text-white mb-5">
                            Próximo objetivo
                        </h4>

                        <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">
                            Completa 3 lecciones esta semana
                        </p>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden">
                                <div className="h-full w-[66%] rounded-full bg-gradient-to-r from-violet-500 to-primary-500" />
                            </div>
                            <span className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                                2/3
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */
export default function AboutPage() {
    return (
        <div className="bg-white dark:bg-surface-950 text-surface-900 dark:text-white overflow-hidden">
            <section className="relative pt-28 pb-24 sm:pt-32 sm:pb-28">
                <div className="absolute top-0 left-0 w-[620px] h-[620px] bg-primary-600/8 rounded-full blur-[140px]" />
                <div className="absolute right-0 top-20 w-[480px] h-[480px] bg-cyan-500/8 rounded-full blur-[140px]" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeUp>
                        <div className="text-center mb-14">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-500 dark:text-primary-400 text-xs font-semibold uppercase tracking-wider">
                                Sobre nosotros
                            </span>

                            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-surface-900 dark:text-white">
                                Nuestra misión es simple:
                                <br />
                                <span className="bg-gradient-to-r from-primary-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                                    hacer que aprendas y logres más.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-4xl mx-auto text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
                                En Elevva creamos experiencias de aprendizaje que combinan contenido de valor,
                                herramientas prácticas y acompañamiento para que desarrolles habilidades,
                                emprendas y transformes tu futuro.
                            </p>
                        </div>
                    </FadeUp>

                    <div className="grid xl:grid-cols-[0.85fr_1.15fr] gap-10 items-start">
                        <div className="space-y-0">
                            {missionPoints.map((item, index) => (
                                <FadeUp key={item.title} delay={index * 90}>
                                    <div className="py-7 border-b border-surface-200 dark:border-surface-800/60 first:pt-0 last:border-b-0">
                                        <div className="flex gap-5">
                                            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/15 flex items-center justify-center">
                                                <item.icon className="h-6 w-6 text-primary-500 dark:text-primary-400" />
                                            </div>

                                            <div>
                                                <h3 className="text-2xl font-semibold text-surface-900 dark:text-white mb-3">
                                                    {item.title}
                                                </h3>
                                                <p className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </FadeUp>
                            ))}
                        </div>

                        <FadeUp delay={180}>
                            <StudentProgressPanel />
                        </FadeUp>
                    </div>
                </div>
            </section>

            <section className="relative pb-24 sm:pb-28">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface-900/5 dark:via-surface-900/10 to-transparent" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <FadeUp>
                        <div className="text-center mb-12">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-500 dark:text-primary-400 text-xs font-semibold uppercase tracking-wider">
                                Nuestro compromiso
                            </span>

                            <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-surface-900 dark:text-white">
                                Más que cursos,{' '}
                                <span className="bg-gradient-to-r from-primary-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent">
                                    experiencias que generan resultados
                                </span>
                            </h2>

                            <p className="mt-5 max-w-4xl mx-auto text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
                                Cada lección, recurso y herramienta está pensada para que apliques lo aprendido,
                                resuelvas problemas reales y avances hacia tus metas.
                            </p>
                        </div>
                    </FadeUp>

                    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {commitmentCards.map((item, index) => (
                            <FadeUp key={item.title} delay={index * 70}>
                                <div className="h-full rounded-2xl border border-surface-200 dark:border-surface-800/60 bg-white dark:bg-surface-900/30 p-6 hover:border-primary-400/30 transition-all duration-300 shadow-sm dark:shadow-none">
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-5`}
                                    >
                                        <item.icon className="h-5 w-5 text-white" />
                                    </div>

                                    <h3 className="text-2xl font-semibold text-surface-900 dark:text-white mb-3">
                                        {item.title}
                                    </h3>
                                    <p className="text-lg text-surface-600 dark:text-surface-400 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </FadeUp>
                        ))}
                    </div>

                    <FadeUp delay={220}>
                        <div className="mt-10 relative overflow-hidden rounded-[32px] border border-primary-500/20 bg-gradient-to-r from-primary-600 via-violet-600 to-cyan-600">
                            {/* Glow layers */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_35%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_30%)]" />
                            <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                            <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />

                            <div className="relative px-8 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
                                {/* Left copy */}
                                <div className="max-w-2xl">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/85 mb-5">
                                        Empieza hoy
                                    </span>

                                    <h3 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight text-white">
                                        Tu futuro se construye
                                        <br className="hidden sm:block" /> con lo que aprendes hoy
                                    </h3>

                                    <p className="mt-4 text-base sm:text-lg leading-relaxed text-white/80 max-w-xl">
                                        Accede a una demo de 30 minutos, conoce la plataforma por dentro
                                        y empieza a avanzar con contenido práctico desde el primer paso.
                                    </p>

                                    <div className="mt-7 flex flex-col sm:flex-row gap-3">
                                        <Link
                                            to="/register"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-primary-700 font-semibold shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                                        >
                                            Ver demo 30 min
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>

                                        <Link
                                            to="/store"
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-white font-semibold hover:bg-white/10 transition-all duration-300"
                                        >
                                            Cursos
                                        </Link>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
                                        <span className="inline-flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                            Sin tarjeta de crédito
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                            Acceso inmediato
                                        </span>
                                    </div>
                                </div>

                                {/* Right visual */}
                                <div className="hidden lg:flex justify-end">
                                    <div className="relative h-64 w-64">
                                        <div className="absolute inset-0 rounded-[2rem] border border-white/15 bg-white/10 backdrop-blur-md shadow-2xl shadow-black/20" />
                                        <div className="absolute inset-6 rounded-[1.5rem] bg-gradient-to-br from-white/20 to-white/5 border border-white/10" />

                                        {/* Simple play/demo card */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl scale-125" />
                                                <div className="relative h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                                                    <div className="ml-1 h-0 w-0 border-y-[12px] border-y-transparent border-l-[18px] border-l-primary-600" />
                                                </div>
                                            </div>
                                        </div>


                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeUp>
                </div>
            </section>
        </div>
    );
}
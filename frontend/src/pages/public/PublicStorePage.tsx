import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Star,
  Sparkles,
  Zap,
  Eye,
  ChevronRight,
  ShoppingCart,
  ArrowRight,
  Crown,
  ShieldCheck,
  BadgeCheck,
  Rocket,
  RefreshCw,
  Headphones,
  Layers,
  TrendingUp,
  PlayCircle,
} from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useCourses } from '../../hooks/useCourses';
import { useAuth } from '../../contexts/AuthContext';
import { paymentsApi } from '../../api/payments.api';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { PriceTag } from '../../components/ui/PriceTag';
import type { Course, Category } from '../../types/course.types';

const discountPercent = (
  price: number | string | null | undefined,
  comparePrice: number | string | null | undefined,
): number | null => {
  const p = price == null ? 0 : Number(price);
  const c = comparePrice == null ? 0 : Number(comparePrice);
  if (!p || !c || c <= p) return null;
  return Math.round(((c - p) / c) * 100);
};

function StoreCard({ course, isAuth }: { course: Course; isAuth: boolean }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const hasPrice = course.price !== null && course.price !== undefined && Number(course.price) > 0;
  const discount = discountPercent(course.price, course.comparePrice);

  const handleBuy = async () => {
    if (!hasPrice) return;
    if (!isAuth) {
      navigate('/register?next=/store');
      return;
    }
    setLoading(true);
    try {
      const res = await paymentsApi.checkoutCourse(course.id, 'MERCADOPAGO');
      const initPoint = (res.data as any)?.data?.initPoint || (res.data as any)?.initPoint;
      if (initPoint) window.location.href = initPoint;
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al iniciar el pago');
    } finally {
      setLoading(false);
    }
  };

  const detailHref = isAuth ? `/course/${course.slug}` : `/login?next=/course/${course.slug}`;

  const badge = course.isFeatured
    ? { label: 'Top ventas', cls: 'bg-amber-500 text-surface-950' }
    : discount && discount >= 30
      ? { label: `-${discount}%`, cls: 'bg-blue-600 text-white' }
      : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-surface-200 dark:border-white/[0.06] bg-white dark:bg-[#10161D] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-900/20 dark:shadow-black/30">
      <Link to={detailHref} className="relative block aspect-[16/9] overflow-hidden bg-surface-100 dark:bg-[#0C1117]">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles className="h-8 w-8 text-surface-500" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />
        {badge && (
          <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-lg ${badge.cls}`}>
            {badge.label}
          </span>
        )}
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-sm">
          <PlayCircle className="h-4 w-4" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-[14px]">
        {course.category && (
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary-600 dark:text-primary-400">
            {course.category.name}
          </p>
        )}

        <Link to={detailHref}>
          <h3 className="mb-2 line-clamp-2 min-h-[2.6rem] text-[14px] font-semibold leading-snug text-surface-900 dark:text-white transition group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {course.title}
          </h3>
        </Link>

        <div className="mb-3 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-1 text-[11px] text-surface-500 dark:text-surface-400">5.0</span>
        </div>

        <div className="mt-auto space-y-3">
          <div className="min-h-[28px]">
            {hasPrice ? (
              <PriceTag price={course.price} comparePrice={course.comparePrice} size="lg" />
            ) : (
              <span className="text-lg font-bold text-surface-900 dark:text-white">Incluido</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleBuy}
              disabled={!hasPrice || loading}
              className="group/btn relative inline-flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-[13px] font-semibold text-white shadow-md shadow-primary-900/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary-700/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/0 via-white/20 to-primary-400/0 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
              <ShoppingCart className="relative h-4 w-4" />
              <span className="relative">{hasPrice ? 'Comprar ahora' : 'Incluido'}</span>
            </button>
            <Link
              to={detailHref}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-surface-200 bg-surface-50 text-[12px] font-medium text-surface-700 transition hover:border-primary-500/50 hover:text-primary-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-surface-200 dark:hover:border-primary-500/50 dark:hover:bg-white/[0.06] dark:hover:text-white"
            >
              <Eye className="h-3.5 w-3.5" /> Ver curso
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-primary-500/20 bg-gradient-to-br from-[#14092e] via-[#0f0b22] to-[#0a0d1a] p-7 shadow-[0_30px_80px_-40px] shadow-primary-900/60 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-[260px] w-[260px] rounded-full bg-primary-600/25 blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 left-20 h-[220px] w-[220px] rounded-full bg-fuchsia-600/15 blur-[90px]" />

      <div className="relative grid min-h-[300px] items-center gap-8 lg:grid-cols-[55fr_45fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-300">
            <Sparkles className="h-3 w-3" /> Plataforma #1 en educación digital
          </span>

          <h1 className="mt-4 text-[28px] font-bold leading-[1.12] text-white sm:text-[32px] lg:text-[36px]">
            Aprende{' '}
            <span className="bg-gradient-to-r from-primary-300 to-fuchsia-400 bg-clip-text text-transparent">
              habilidades digitales
            </span>{' '}
            con cursos prácticos y acceso inmediato
          </h1>

          <p className="mt-3 max-w-[520px] text-[14px] leading-relaxed text-surface-300">
            Miles de alumnos ya están transformando su futuro con cursos actualizados, prácticos y enfocados en resultados reales.
          </p>

          <div className="mt-5 grid max-w-[460px] grid-cols-3 gap-2.5">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
              <div className="text-[16px] font-bold text-white">+5.000</div>
              <div className="text-[10px] text-surface-400">Alumnos activos</div>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
              <div className="text-[16px] font-bold text-white">7 días</div>
              <div className="text-[10px] text-surface-400">Garantía total</div>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
              <div className="text-[16px] font-bold text-white">De por vida</div>
              <div className="text-[10px] text-surface-400">Actualizaciones</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href="#catalogo"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-primary-900/40 transition hover:bg-primary-500"
            >
              <Rocket className="h-4 w-4" /> Explorar cursos
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <Link
              to="/#pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.08]"
            >
              <Crown className="h-4 w-4 text-amber-300" /> Ver planes
            </Link>
          </div>
        </div>

        <div className="relative hidden h-full lg:block">
          <div className="relative mx-auto h-[280px] w-full max-w-[420px]">
            <div
              aria-hidden
              className="absolute left-6 top-4 h-full w-[88%] rotate-[-4deg] rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent"
            />
            <div
              aria-hidden
              className="absolute right-6 top-6 h-full w-[88%] rotate-[3deg] rounded-2xl border border-fuchsia-500/15 bg-gradient-to-br from-fuchsia-500/[0.06] to-transparent"
            />
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10161D] shadow-2xl shadow-black/50">
              <div className="relative aspect-video bg-gradient-to-br from-primary-600/40 via-fuchsia-600/20 to-surface-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-md ring-1 ring-white/20">
                    <PlayCircle className="h-7 w-7 text-white" />
                  </div>
                </div>
                <span className="absolute left-3 top-3 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-surface-950">
                  Top ventas
                </span>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-400">Redes sociales</p>
                <p className="mt-1 text-[13px] font-semibold leading-snug text-white">Cómo crecer a 1M de seguidores con contenido viral</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-surface-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1">5.0</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] text-surface-500 line-through">$21</span>
                    <span className="text-[15px] font-bold text-primary-400">$14</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-3 -left-3 flex items-center gap-2 rounded-xl border border-white/10 bg-[#10161D]/90 px-3 py-2 shadow-xl shadow-black/40 backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="leading-tight">
                <div className="text-[11px] text-surface-400">Este mes</div>
                <div className="text-[13px] font-bold text-white">+180% alumnos</div>
              </div>
            </div>

            <div className="absolute -right-2 top-6 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-[#10161D]/90 px-3 py-2 shadow-xl shadow-black/40 backdrop-blur-md">
              <Crown className="h-4 w-4 text-amber-300" />
              <div className="text-[12px] font-semibold text-white">Certificado</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofBar() {
  return (
    <div className="flex flex-col items-stretch gap-4 rounded-2xl border border-surface-200 dark:border-white/[0.08] bg-white dark:bg-[#10161D] px-5 py-3.5 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <div className="flex items-baseline gap-1.5 text-[13px]">
          <span className="font-bold text-surface-900 dark:text-white">4.9/5</span>
          <span className="text-surface-500 dark:text-surface-400">(2.431 opiniones)</span>
        </div>
      </div>

      <div className="hidden h-10 w-px shrink-0 bg-surface-200 dark:bg-white/10 sm:block" />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-fuchsia-500 text-[11px] font-bold text-white shadow-sm">
          MF
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] text-surface-700 dark:text-surface-200">
            "Los cursos son prácticos, actualizados y los profesores explican increíble."
          </p>
          <p className="mt-0.5 text-[11px] text-surface-500 dark:text-surface-400">— María Fernanda, alumna</p>
        </div>
      </div>

      <div className="hidden items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 lg:inline-flex">
        <ShieldCheck className="h-3.5 w-3.5" /> Pago 100% seguro
      </div>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: Zap, title: 'Acceso inmediato', desc: 'Comenzá al instante' },
    { icon: BadgeCheck, title: 'Certificados incluidos', desc: 'Al completar cada curso' },
    { icon: RefreshCw, title: 'Contenido actualizado', desc: 'Nuevas clases cada semana' },
    { icon: Headphones, title: 'Soporte experto', desc: 'Estamos para ayudarte' },
    { icon: Star, title: '4.9/5', desc: 'Más de 2.431 opiniones reales' },
  ];
  return (
    <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-surface-200 bg-surface-200 dark:border-white/[0.08] dark:bg-white/[0.06] md:grid-cols-5">
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-3 bg-white px-4 py-4 dark:bg-[#10161D]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <it.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-surface-900 dark:text-white">{it.title}</div>
            <div className="truncate text-[11px] text-surface-500 dark:text-surface-400">{it.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

type SortBy = 'recent' | 'price-asc' | 'price-desc' | 'name';

const sortCourses = (list: Course[], by: SortBy): Course[] => {
  const arr = [...list];
  switch (by) {
    case 'price-asc':
      return arr.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    case 'price-desc':
      return arr.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    case 'name':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return arr;
  }
};

export default function PublicStorePage() {
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get('category') || undefined;
  const [search, setSearch] = useState(params.get('search') || '');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [perPage, setPerPage] = useState(16);

  const { categories, loading: loadingCats } = useCategories();
  const { courses, loading } = useCourses({
    category: activeCategory,
    search: search || undefined,
    limit: activeCategory || search ? 48 : 500,
  });

  const allPaid = useMemo(
    () => sortCourses(courses.filter((c) => c.price && Number(c.price) > 0), sortBy),
    [courses, sortBy],
  );

  const courseCountByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of courses) {
      map.set(c.categoryId, (map.get(c.categoryId) || 0) + 1);
    }
    return map;
  }, [courses]);
  const totalCourses = courses.length;

  const paidCourses = useMemo(() => allPaid.slice(0, perPage), [allPaid, perPage]);
  const totalPaid = allPaid.length;

  const groupedCourses = useMemo(() => {
    if (activeCategory || search) return null;
    const map = new Map<string, { category: Category; courses: Course[] }>();
    categories.forEach((cat) => map.set(cat.id, { category: cat, courses: [] }));
    allPaid.forEach((course) => {
      if (map.has(course.categoryId)) {
        map.get(course.categoryId)!.courses.push(course);
      }
    });
    return Array.from(map.values())
      .filter((g) => g.courses.length > 0)
      .sort((a, b) => (a.category.sortOrder ?? 0) - (b.category.sortOrder ?? 0));
  }, [allPaid, categories, activeCategory, search]);

  const showGrouped = groupedCourses !== null;

  const handleCategory = (slug?: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug);
    else next.delete('category');
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-24 pb-16 sm:px-6 lg:px-8 lg:pt-28">
      <HeroBanner />

      <div className="mt-6">
        <SocialProofBar />
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-xs text-surface-500">
        <Link to="/" className="transition hover:text-surface-900 dark:hover:text-white">Inicio</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-surface-700 dark:text-surface-300">Cursos</span>
      </div>

      <div id="catalogo" className="mt-5 flex flex-col gap-6 lg:flex-row">
        <aside className="hidden flex-shrink-0 lg:block lg:w-[250px]">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-surface-200 dark:border-white/[0.08] bg-white dark:bg-[#10161D] p-4">
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-surface-500 dark:text-surface-400">
                Categorías
              </h2>
              <nav className="space-y-1">
                <button
                  onClick={() => handleCategory(undefined)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                    !activeCategory
                      ? 'bg-primary-600 font-medium text-white'
                      : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Layers className="h-4 w-4 shrink-0" />
                    <span className="truncate">Todas las categorías</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    !activeCategory
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-100 text-surface-600 dark:bg-white/[0.06] dark:text-surface-400'
                  }`}>
                    {totalCourses}
                  </span>
                </button>
                {loadingCats ? (
                  <div className="space-y-1 py-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  categories.map((cat) => {
                    const active = activeCategory === cat.slug;
                    const count = courseCountByCat.get(cat.id) ?? 0;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategory(cat.slug)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                          active
                            ? 'bg-primary-600 font-medium text-white'
                            : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="min-w-0 truncate">{cat.name}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-100 text-surface-600 dark:bg-white/[0.06] dark:text-surface-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })
                )}
              </nav>
            </div>

            <Link
              to="/#pricing"
              className="block overflow-hidden rounded-2xl border border-primary-500/25 bg-gradient-to-br from-[#1a0f33] via-[#170e2d] to-[#0f0b1f] p-5 transition-all duration-300 hover:border-primary-400/50 hover:shadow-xl hover:shadow-primary-900/30"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
                  <Crown className="h-5 w-5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold leading-tight text-white">Acceso ilimitado</h3>
                  <p className="text-[12px] text-surface-400">A todos los cursos</p>
                </div>
              </div>

              <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-4 text-[12.5px] text-surface-300">
                <li className="flex items-start gap-2"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-400" /> +100 cursos incluidos</li>
                <li className="flex items-start gap-2"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-400" /> Nuevos cursos cada semana</li>
                <li className="flex items-start gap-2"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-400" /> Cancelá cuando quieras</li>
                <li className="flex items-start gap-2"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-400" /> Certificados incluidos</li>
              </ul>

              <span className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-primary-500">
                <Zap className="h-4 w-4" /> Ver planes y precios
              </span>
            </Link>

            <div className="flex items-center gap-2.5 rounded-xl border border-surface-200 dark:border-white/[0.08] bg-white dark:bg-[#10161D] px-3 py-2.5">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
              <div className="min-w-0 leading-tight">
                <div className="text-[12px] font-semibold text-surface-900 dark:text-white">Pago 100% seguro</div>
                <div className="text-[11px] text-surface-500 dark:text-surface-400">Tus datos protegidos</div>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          <div className="rounded-2xl border border-surface-200 dark:border-white/[0.08] bg-white dark:bg-[#10161D] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <Input
                  icon={Search}
                  placeholder="Buscar cursos, instructores o temáticas…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-surface-500 dark:text-surface-400">Ordenar</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="rounded-lg border border-surface-300 bg-white px-3 py-2 text-xs text-surface-900 focus:border-primary-500 focus:outline-none dark:border-white/10 dark:bg-[#151B24] dark:text-white"
                >
                  <option value="recent">Más recientes</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="name">Nombre A-Z</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {showGrouped ? (
              loading ? (
                <div className="space-y-8">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="mb-3 h-5 w-64" />
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <Skeleton key={j} className="h-80 rounded-2xl" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : groupedCourses!.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-surface-300 dark:border-white/10 text-surface-500">
                  No hay cursos a la venta.
                </div>
              ) : (
                <div className="space-y-10">
                  {groupedCourses!.map((group) => (
                    <section key={group.category.id}>
                      <div className="mb-4 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleCategory(group.category.slug)}
                          className="group flex items-center gap-2 text-left"
                        >
                          <h2 className="text-[16px] font-bold text-surface-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                            {group.category.name}
                          </h2>
                          <ChevronRight className="h-4 w-4 text-surface-400 transition group-hover:translate-x-0.5 group-hover:text-primary-500" />
                        </button>
                        <span className="rounded-full border border-surface-200 bg-surface-50 px-2.5 py-0.5 text-[11px] font-semibold text-surface-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-surface-400">
                          {group.courses.length} {group.courses.length === 1 ? 'curso' : 'cursos'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {group.courses.map((course) => (
                          <StoreCard key={course.id} course={course} isAuth={isAuthenticated} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )
            ) : loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
              </div>
            ) : paidCourses.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-surface-300 dark:border-white/10 text-surface-500">
                No hay cursos a la venta en esta categoría.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {paidCourses.map((c) => (
                    <StoreCard key={c.id} course={c} isAuth={isAuthenticated} />
                  ))}
                </div>
                {totalPaid > perPage && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setPerPage((p) => p + 12)}
                      className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-6 py-2.5 text-sm font-semibold text-surface-700 transition hover:border-primary-500 hover:text-surface-900 dark:border-white/10 dark:bg-[#10161D] dark:text-surface-200 dark:hover:border-primary-500 dark:hover:text-white"
                    >
                      Ver más cursos <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}

            <TrustStrip />
          </div>
        </section>
      </div>
    </div>
  );
}

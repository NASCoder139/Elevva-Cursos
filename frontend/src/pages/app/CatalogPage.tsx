import { useSearchParams, useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Search, Star, Sparkles, Zap, Eye, CheckCircle2 } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useCourses } from '../../hooks/useCourses';
import { useAccess } from '../../hooks/useAccess';
import { paymentsApi } from '../../api/payments.api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { PriceTag } from '../../components/ui/PriceTag';
import type { Course, Category } from '../../types/course.types';

// Paleta rotativa para los puntos de cada sección
const CATEGORY_COLORS = [
  'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-pink-500', 'bg-violet-500',
  'bg-cyan-500', 'bg-orange-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-fuchsia-500', 'bg-lime-500', 'bg-sky-500', 'bg-red-500', 'bg-purple-500',
];
const colorFor = (idx: number) => CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return 'Incluido';
  const n = typeof price === 'string' ? Number(price) : price;
  if (!n || n === 0) return 'Incluido';
  return `$ ${n.toLocaleString('es-CL')}`;
};

type AccessType = 'MONTHLY' | 'ANNUAL' | 'PURCHASED' | null;

function DashboardStoreCard({
  course,
  owned,
  accessType,
}: {
  course: Course;
  owned: boolean;
  accessType: AccessType;
}) {
  const [loading, setLoading] = useState(false);
  const hasPrice = course.price !== null && course.price !== undefined && Number(course.price) > 0;

  const handleBuy = async () => {
    if (!hasPrice || owned) return;
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

  const detailHref = `/course/${course.slug}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-surface-200 dark:border-surface-700/50 bg-white dark:bg-surface-900 shadow-sm dark:shadow-none transition-all duration-200 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-900/20">
      <Link to={detailHref} className="relative block aspect-video overflow-hidden bg-surface-100 dark:bg-surface-800">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Sparkles className="h-8 w-8 text-surface-600" />
          </div>
        )}
        {course.isFeatured && (
          <span className="absolute left-2 top-2 rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            Destacado
          </span>
        )}
        {owned && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
            <CheckCircle2 className="h-3 w-3" />
            {accessType === 'PURCHASED' ? 'Comprado' : 'Incluido'}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link to={detailHref}>
          <h3 className="mb-0.5 line-clamp-2 text-[13px] font-semibold leading-tight text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
            {course.title}
          </h3>
        </Link>

        {course.category && (
          <p className="mb-2 text-[11px] text-surface-500 dark:text-surface-400">{course.category.name}</p>
        )}

        <div className="mb-2 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-1 text-[11px] text-surface-500">(5.0)</span>
        </div>

        <div className="mt-auto">
          <div className="mb-2.5">
            {owned ? (
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                Tienes acceso
              </span>
            ) : hasPrice ? (
              <PriceTag price={course.price} comparePrice={course.comparePrice} size="md" />
            ) : (
              <span className="text-base font-bold text-surface-900 dark:text-white">
                {formatPrice(course.price)}
              </span>
            )}
          </div>

          <div className="flex gap-1.5">
            {owned ? (
              <Button href={detailHref} className="h-8 flex-1 gap-1 text-xs">
                <Eye className="h-3.5 w-3.5" /> Ver curso
              </Button>
            ) : (
              <>
                <Button onClick={handleBuy} isLoading={loading} disabled={!hasPrice} className="h-8 flex-1 gap-1 text-xs">
                  <Zap className="h-3.5 w-3.5" /> {hasPrice ? 'Comprar ahora' : 'Incluido'}
                </Button>
                <Button href={detailHref} variant="outline" className="h-8 flex-1 gap-1 text-xs">
                  <Eye className="h-3.5 w-3.5" /> Ver curso
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const { categorySlug } = useParams();
  const activeCategory = categorySlug || params.get('category') || undefined;
  const searchParam = params.get('search') || '';

  const [search, setSearch] = useState(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState(searchParam);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { hasAccess, getAccessType } = useAccess();
  const { categories: allCategories, loading: loadingCats } = useCategories();
  // Dashboard: solo secciones de contenido (sin precio). Las categorías-producto
  // con precio se muestran únicamente en la tienda pública.
  const categories = useMemo(
    () => allCategories.filter((c) => c.price === null || c.price === undefined),
    [allCategories],
  );
  const { courses, loading, meta } = useCourses({
    category: activeCategory,
    search: debouncedSearch || undefined,
    limit: activeCategory || debouncedSearch ? 48 : 500,
    studentView: true,
  });

  const handleCategory = (slug?: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug);
    else next.delete('category');
    setParams(next);
  };

  const groupedCourses = useMemo(() => {
    if (activeCategory || debouncedSearch) return null;

    const map = new Map<string, { category: Category; courses: Course[] }>();
    categories.forEach((cat) => map.set(cat.id, { category: cat, courses: [] }));

    courses.forEach((course) => {
      if (map.has(course.categoryId)) {
        map.get(course.categoryId)!.courses.push(course);
      }
    });

    return Array.from(map.values())
      .filter((g) => g.courses.length > 0)
      .sort((a, b) => (a.category.sortOrder ?? 0) - (b.category.sortOrder ?? 0));
  }, [courses, categories, activeCategory, debouncedSearch]);

  const courseCountByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of courses) {
      map.set(c.categoryId, (map.get(c.categoryId) || 0) + 1);
    }
    return map;
  }, [courses]);

  const showGrouped = groupedCourses !== null;

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white leading-tight">
          Catálogo de cursos
        </h1>
        <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
          {loading ? 'Cargando…' : `${meta.total} cursos disponibles`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 shadow-sm dark:shadow-none px-4 py-3">
        <div className="w-full sm:w-72">
          <Input
            icon={Search}
            placeholder="Buscar cursos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Sidebar + contenido */}
      <div className="flex gap-5">
        {/* Sidebar de categorías */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-20 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm dark:shadow-none p-3">
            <h2 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Categorías
            </h2>
            <nav className="space-y-1">
              <button
                onClick={() => handleCategory(undefined)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                  !activeCategory
                    ? 'bg-primary-600 text-white font-medium'
                    : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                }`}
              >
                <span className="min-w-0 truncate">Todas las categorías</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    !activeCategory
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-100 text-surface-600 dark:bg-surface-800/80 dark:text-surface-400'
                  }`}
                >
                  {courses.length}
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
                          ? 'bg-primary-600 text-white font-medium'
                          : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                      }`}
                    >
                      <span className="min-w-0 truncate">{cat.name}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-100 text-surface-600 dark:bg-surface-800/80 dark:text-surface-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
            </nav>
          </div>
        </aside>

        {/* Grid principal */}
        <section className="flex-1 min-w-0">
          {/* Pills móvil */}
          <div className="lg:hidden mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => handleCategory(undefined)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                !activeCategory
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.slug)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeCategory === cat.slug
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Vista agrupada (sin filtro) */}
          {showGrouped ? (
            loading ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-5 w-64 mb-3" />
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <Skeleton key={j} className="h-64 rounded-lg" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : groupedCourses!.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-surface-300 dark:border-surface-700 text-surface-500">
                No hay cursos disponibles.
              </div>
            ) : (
              <div className="space-y-8">
                {groupedCourses!.map((group, idx) => (
                  <section key={group.category.id}>
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleCategory(group.category.slug)}
                        className="group flex items-center gap-2 text-left"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${colorFor(idx)}`} />
                        <h2 className="text-sm font-semibold text-surface-900 transition-colors group-hover:text-primary-600 dark:text-surface-100 dark:group-hover:text-primary-400">
                          {group.category.name}
                        </h2>
                      </button>
                      <span className="rounded-full border border-surface-200 bg-surface-50 px-2 py-0.5 text-[10px] font-medium text-surface-600 dark:border-surface-700 dark:bg-surface-800/60 dark:text-surface-400">
                        {group.courses.length} {group.courses.length === 1 ? 'curso' : 'cursos'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                      {group.courses.map((course) => (
                        <DashboardStoreCard
                          key={course.id}
                          course={course}
                          owned={hasAccess(course.id)}
                          accessType={getAccessType(course.id)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )
          ) : (
            /* Vista filtrada (grid plano) */
            loading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-surface-300 dark:border-surface-700 text-surface-500">
                No hay cursos en esta categoría.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {courses.map((course) => (
                  <DashboardStoreCard
                    key={course.id}
                    course={course}
                    owned={hasAccess(course.id)}
                    accessType={getAccessType(course.id)}
                  />
                ))}
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}

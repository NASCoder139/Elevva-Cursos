import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Sparkles, ShoppingBag, Crown, Search, Star, Zap, Eye, CheckCircle2 } from 'lucide-react';
import { useAccess } from '../../hooks/useAccess';
import { useCategories } from '../../hooks/useCategories';
import { Spinner } from '../../components/ui/Spinner';
import { Skeleton } from '../../components/ui/Skeleton';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PriceTag } from '../../components/ui/PriceTag';
import type { Course, Category } from '../../types/course.types';
import clsx from 'clsx';

type TabKey = 'all' | 'purchased' | 'plan';
type AccessType = 'MONTHLY' | 'ANNUAL' | 'PURCHASED' | null;

const CATEGORY_COLORS = [
  'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-pink-500', 'bg-violet-500',
  'bg-cyan-500', 'bg-orange-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-fuchsia-500', 'bg-lime-500', 'bg-sky-500', 'bg-red-500', 'bg-purple-500',
];
const colorFor = (idx: number) => CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

function MyCourseCard({
  course,
  owned,
  accessType,
}: {
  course: Course;
  owned: boolean;
  accessType: AccessType;
}) {
  const hasPrice = course.price !== null && course.price !== undefined && Number(course.price) > 0;
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
              <span className="text-base font-bold text-surface-900 dark:text-white">Incluido</span>
            )}
          </div>

          <div className="flex gap-1.5">
            <Button href={detailHref} className="h-8 flex-1 gap-1 text-xs">
              {owned ? <Eye className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
              {owned ? 'Ver curso' : 'Ver detalle'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyCoursesPage() {
  const { myCourses, hasSubscription, hasAccess, getAccessType, loading } = useAccess();
  const { categories: allCategories, loading: loadingCats } = useCategories();
  const [params, setParams] = useSearchParams();

  const [tab, setTab] = useState<TabKey>('all');
  const activeCategorySlug = params.get('category') || undefined;
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

  const handleCategory = (slug?: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug);
    else next.delete('category');
    setParams(next);
  };

  // Solo categorías de contenido (sin precio, igual que en el catálogo)
  const categories = useMemo(
    () => allCategories.filter((c) => c.price === null || c.price === undefined),
    [allCategories],
  );

  // Cursos según el tab activo
  const tabCourses = useMemo(() => {
    if (tab === 'purchased') return myCourses.filter((c) => getAccessType(c.id) === 'PURCHASED');
    if (tab === 'plan') return myCourses.filter((c) => {
      const t = getAccessType(c.id);
      return t === 'MONTHLY' || t === 'ANNUAL';
    });
    return myCourses;
  }, [myCourses, tab, getAccessType]);

  // Aplicar filtro de categoría y búsqueda sobre los cursos del tab
  const filteredCourses = useMemo(() => {
    let result = tabCourses;
    if (activeCategorySlug) {
      result = result.filter((c) => c.category?.slug === activeCategorySlug);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((c) => c.title.toLowerCase().includes(q));
    }
    return result;
  }, [tabCourses, activeCategorySlug, debouncedSearch]);

  const courseCountByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of tabCourses) {
      map.set(c.categoryId, (map.get(c.categoryId) || 0) + 1);
    }
    return map;
  }, [tabCourses]);

  const groupedCourses = useMemo(() => {
    if (activeCategorySlug || debouncedSearch) return null;
    const map = new Map<string, { category: Category; courses: Course[] }>();
    categories.forEach((cat) => map.set(cat.id, { category: cat, courses: [] }));
    tabCourses.forEach((course) => {
      if (map.has(course.categoryId)) {
        map.get(course.categoryId)!.courses.push(course);
      }
    });
    return Array.from(map.values())
      .filter((g) => g.courses.length > 0)
      .sort((a, b) => (a.category.sortOrder ?? 0) - (b.category.sortOrder ?? 0));
  }, [tabCourses, categories, activeCategorySlug, debouncedSearch]);

  const showGrouped = groupedCourses !== null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const purchasedCount = myCourses.filter((c) => getAccessType(c.id) === 'PURCHASED').length;
  const planCount = myCourses.filter((c) => {
    const t = getAccessType(c.id);
    return t === 'MONTHLY' || t === 'ANNUAL';
  }).length;

  const tabs: { key: TabKey; label: string; count: number; icon: React.ElementType }[] = [
    { key: 'all', label: 'Todos', count: myCourses.length, icon: BookOpen },
    { key: 'purchased', label: 'Adquiridos', count: purchasedCount, icon: ShoppingBag },
    { key: 'plan', label: 'Incluidos en mi plan', count: planCount, icon: Crown },
  ];

  const emptyMessageByTab: Record<TabKey, string> = {
    all: 'Aún no tenés cursos',
    purchased: 'Todavía no compraste cursos individuales',
    plan: 'Tu plan no incluye cursos aún',
  };

  return (
    <div className="px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white leading-tight">Mis Cursos</h1>
          <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
            {myCourses.length > 0
              ? `${myCourses.length} curso${myCourses.length !== 1 ? 's' : ''} disponible${myCourses.length !== 1 ? 's' : ''}`
              : 'Aún no tenés cursos'}
          </p>
        </div>
        {hasSubscription && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
            <Sparkles className="h-3.5 w-3.5" /> Suscripción activa
          </span>
        )}
      </div>

      {myCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 dark:border-surface-700 py-16 text-center">
          <BookOpen className="mb-3 h-12 w-12 text-surface-300 dark:text-surface-600" />
          <p className="text-surface-500 dark:text-surface-400">Aún no tenés cursos</p>
          <p className="mt-1 text-sm text-surface-400 dark:text-surface-500">
            Comprá un curso individual o suscribite para acceder a todos
          </p>
          <div className="mt-4 flex gap-3">
            <Link to="/shop" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Ver tienda
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Ver suscripciones
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-surface-200 dark:border-surface-800 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={clsx(
                    'relative flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition',
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  <span
                    className={clsx(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      active
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                        : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
                    )}
                  >
                    {t.count}
                  </span>
                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary-600 dark:bg-primary-400" />
                  )}
                </button>
              );
            })}
          </div>

          {tab === 'purchased' && (
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Cursos comprados individualmente. Son tuyos de forma permanente, aunque canceles la suscripción.
            </p>
          )}
          {tab === 'plan' && (
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Cursos incluidos en tu plan de suscripción. El acceso se mantiene mientras tengas el plan activo.
            </p>
          )}

          {/* Toolbar de búsqueda */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900/50 shadow-sm dark:shadow-none px-4 py-3">
            <div className="w-full sm:w-72">
              <Input
                icon={Search}
                placeholder="Buscar en mis cursos…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {tabCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 dark:border-surface-700 py-12 text-center">
              <BookOpen className="mb-2 h-10 w-10 text-surface-300 dark:text-surface-600" />
              <p className="text-sm text-surface-500 dark:text-surface-400">{emptyMessageByTab[tab]}</p>
              {tab === 'purchased' && (
                <Link to="/shop" className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                  Ir a la tienda
                </Link>
              )}
              {tab === 'plan' && !hasSubscription && (
                <Link to="/pricing" className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                  Ver suscripciones
                </Link>
              )}
            </div>
          ) : (
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
                        !activeCategorySlug
                          ? 'bg-primary-600 text-white font-medium'
                          : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800'
                      }`}
                    >
                      <span className="min-w-0 truncate">Todas las categorías</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          !activeCategorySlug
                            ? 'bg-white/20 text-white'
                            : 'bg-surface-100 text-surface-600 dark:bg-surface-800/80 dark:text-surface-400'
                        }`}
                      >
                        {tabCourses.length}
                      </span>
                    </button>
                    {loadingCats ? (
                      <div className="space-y-1 py-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-9 w-full rounded-lg" />
                        ))}
                      </div>
                    ) : (
                      categories.map((cat) => {
                        const active = activeCategorySlug === cat.slug;
                        const count = courseCountByCat.get(cat.id) ?? 0;
                        if (count === 0) return null;
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
                      !activeCategorySlug
                        ? 'bg-primary-600 text-white'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => {
                    const count = courseCountByCat.get(cat.id) ?? 0;
                    if (count === 0) return null;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategory(cat.slug)}
                        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          activeCategorySlug === cat.slug
                            ? 'bg-primary-600 text-white'
                            : 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                {showGrouped ? (
                  groupedCourses!.length === 0 ? (
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
                              <MyCourseCard
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
                ) : filteredCourses.length === 0 ? (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-surface-300 dark:border-surface-700 text-surface-500">
                    No se encontraron cursos con esos filtros.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {filteredCourses.map((course) => (
                      <MyCourseCard
                        key={course.id}
                        course={course}
                        owned={hasAccess(course.id)}
                        accessType={getAccessType(course.id)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}

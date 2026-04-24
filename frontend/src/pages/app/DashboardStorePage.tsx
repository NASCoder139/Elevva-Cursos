import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShoppingCart, Search, Star, Sparkles, Check, CheckCheck, Zap, Eye, Grid3X3, List, ChevronRight } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useCourses } from '../../hooks/useCourses';
import { useAccess } from '../../hooks/useAccess';
import { useCart } from '../../contexts/CartContext';
import { paymentsApi, type PaymentProvider } from '../../api/payments.api';
import { ProviderPicker } from '../../components/payments/ProviderPicker';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { PriceTag } from '../../components/ui/PriceTag';
import toast from 'react-hot-toast';
import type { Course } from '../../types/course.types';

const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return 'Gratis';
  const n = typeof price === 'string' ? Number(price) : price;
  if (!n || n === 0) return 'Gratis';
  return `$ ${n.toLocaleString('es-CL')}`;
};

const accessLabel: Record<string, string> = {
  MONTHLY: 'Acceso Mensual',
  ANNUAL: 'Acceso Anual',
  PURCHASED: 'Adquirido',
};

function StoreCard({ course, onBuy, owned, accessType }: {
  course: Course;
  onBuy: (course: Course) => void;
  owned: boolean;
  accessType?: string | null;
}) {
  const { add, has } = useCart();
  const hasPrice = course.price !== null && course.price !== undefined && Number(course.price) > 0;
  const inCart = has(course.id);

  const handleAdd = () => {
    if (!hasPrice) return;
    add({
      id: course.id,
      title: course.title,
      slug: course.slug,
      price: Number(course.price),
      comparePrice: course.comparePrice != null ? Number(course.comparePrice) : null,
      thumbnailUrl: course.thumbnailUrl,
    });
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-surface-700/50 bg-surface-900 transition-all duration-200 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-900/20">
      {/* Thumbnail */}
      <Link to={`/course/${course.slug}`} className="relative block aspect-video overflow-hidden bg-surface-800">
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
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {accessType === 'PURCHASED' ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            {accessType ? accessLabel[accessType] : 'Adquirido'}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        <Link to={`/course/${course.slug}`}>
          <h3 className="mb-0.5 line-clamp-2 text-[13px] font-semibold leading-tight text-white group-hover:text-primary-400 transition">
            {course.title}
          </h3>
        </Link>

        {course.category && (
          <p className="mb-2 text-[11px] text-surface-400">{course.category.name}</p>
        )}

        {/* Stars */}
        <div className="mb-2 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="ml-1 text-[11px] text-surface-500">(5.0)</span>
        </div>

        {/* Price */}
        <div className="mt-auto">
          <div className="mb-2.5">
            {owned ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400">
                {accessType === 'PURCHASED' ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                {accessType ? accessLabel[accessType] : 'Adquirido'}
              </span>
            ) : hasPrice ? (
              <PriceTag price={course.price} comparePrice={course.comparePrice} size="md" className="text-white" />
            ) : (
              <span className="text-base font-bold text-white">{formatPrice(course.price)}</span>
            )}
          </div>

          {owned ? (
            <Button href={`/course/${course.slug}`} fullWidth variant="secondary" className="h-8 gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5" /> Ver curso
            </Button>
          ) : (
            <div className="flex gap-1.5">
              <Button onClick={() => hasPrice && onBuy(course)} disabled={!hasPrice} className="h-8 flex-1 gap-1 text-xs">
                <Zap className="h-3.5 w-3.5" /> Comprar ahora
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!hasPrice || inCart}
                variant={inCart ? 'secondary' : 'outline'}
                className="h-8 flex-1 gap-1 text-xs"
              >
                {inCart ? <><Check className="h-3.5 w-3.5" /> Agregado</> : <><ShoppingCart className="h-3.5 w-3.5" /> Agregar al carrito</>}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardStorePage() {
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get('category') || undefined;
  const [search, setSearch] = useState(params.get('search') || '');
  const [buyTarget, setBuyTarget] = useState<Course | null>(null);
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [perPage, setPerPage] = useState(12);
  const { hasAccess, getAccessType } = useAccess();

  const handleBuyNow = async (provider: PaymentProvider) => {
    if (!buyTarget) return;
    try {
      const res = await paymentsApi.checkoutCourse(buyTarget.id, provider);
      const initPoint = (res.data as any)?.data?.initPoint || (res.data as any)?.initPoint;
      if (initPoint) window.location.href = initPoint;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al iniciar el pago');
    }
  };

  const { categories, loading: loadingCats } = useCategories();
  const { courses, loading } = useCourses({ category: activeCategory, search: search || undefined, limit: 48, studentView: true });

  const allPaid = useMemo(
    () => courses.filter((c) => c.price && Number(c.price) > 0),
    [courses],
  );
  const paidCourses = useMemo(() => allPaid.slice(0, perPage), [allPaid, perPage]);
  const totalPaid = allPaid.length;

  const courseCountByCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of courses) {
      map.set(c.categoryId, (map.get(c.categoryId) || 0) + 1);
    }
    return map;
  }, [courses]);
  const totalCourses = courses.length;

  const handleCategory = (slug?: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug);
    else next.delete('category');
    setParams(next);
  };

  return (
    <div className="space-y-5">
      {/* ── Header + Suscripción ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tienda de Cursos</h1>
          <p className="mt-0.5 text-sm text-surface-400">Encuentra cursos de alta calidad al mejor precio.</p>
        </div>
        <Link
          to="/pricing"
          className="flex-shrink-0 rounded-xl bg-gradient-to-b from-surface-800 to-surface-900 border border-surface-700 px-5 py-3 text-center transition hover:border-primary-500"
        >
          <p className="text-[11px] text-surface-400">¿Quieres todo por un solo precio?</p>
          <p className="text-sm font-bold text-white">Suscribete y accede a TODOS los cursos</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-primary-700 transition">
            <Zap className="h-3 w-3 fill-current" />
            Ver suscripciones
            <Zap className="h-3 w-3 fill-current" />
          </span>
        </Link>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-1.5 text-xs text-surface-500">
        <Link to="/dashboard" className="hover:text-white transition">Inicio</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-surface-300">Tienda de Cursos</span>
      </div>

      {/* ── Toolbar: búsqueda + filtros ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-surface-800 bg-surface-900/50 px-4 py-3">
        <div className="w-full sm:w-56">
          <Input icon={Search} placeholder="Buscar cursos…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-surface-400">
            <span>Mostrar</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-white focus:border-primary-500 focus:outline-none"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          <div className="flex items-center gap-1 border-l border-surface-700 pl-4">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded p-1.5 transition ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-surface-400 hover:text-white'}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded p-1.5 transition ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-surface-400 hover:text-white'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 border-l border-surface-700 pl-4 text-xs text-surface-400">
            <span>Ordenar por</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="recent">Más recientes</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Contenido: sidebar + grid ── */}
      <div className="flex gap-5">
        {/* Sidebar categorías */}
        <aside className="hidden lg:block w-[250px] flex-shrink-0">
          <div className="sticky top-20 rounded-2xl border border-surface-800 bg-surface-900 p-4">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-surface-400">
              Categorías
            </h2>
            <nav className="space-y-1">
              <button
                onClick={() => handleCategory(undefined)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] transition ${
                  !activeCategory
                    ? 'bg-primary-600 text-white font-medium'
                    : 'text-surface-300 hover:bg-surface-800'
                }`}
              >
                <span className="min-w-0 truncate">Todas las categorías</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    !activeCategory ? 'bg-white/20 text-white' : 'bg-surface-800/80 text-surface-400'
                  }`}
                >
                  {totalCourses}
                </span>
              </button>
              {loadingCats ? (
                <div className="space-y-1 py-1">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-lg bg-surface-800" />
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
                          : 'text-surface-300 hover:bg-surface-800'
                      }`}
                    >
                      <span className="min-w-0 truncate">{cat.name}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          active ? 'bg-white/20 text-white' : 'bg-surface-800/80 text-surface-400'
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

        {/* Grid de cursos */}
        <section className="flex-1 min-w-0">
          {/* Mobile categories */}
          <div className="lg:hidden mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => handleCategory(undefined)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                !activeCategory ? 'bg-primary-600 text-white' : 'bg-surface-800 text-surface-300'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.slug)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeCategory === cat.slug ? 'bg-primary-600 text-white' : 'bg-surface-800 text-surface-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
            </div>
          ) : paidCourses.length === 0 ? (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-surface-700 text-surface-500">
              No hay cursos a la venta en esta categoría.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {paidCourses.map((c) => (
                  <StoreCard
                    key={c.id}
                    course={c}
                    onBuy={(course) => setBuyTarget(course)}
                    owned={hasAccess(c.id)}
                    accessType={getAccessType(c.id)}
                  />
                ))}
              </div>
              {totalPaid > perPage && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setPerPage((p) => p + 12)}
                    className="rounded-lg border border-surface-700 bg-surface-800 px-6 py-2 text-sm font-medium text-surface-300 transition hover:border-primary-500 hover:text-white"
                  >
                    Ver más cursos
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <ProviderPicker
        open={buyTarget !== null}
        title={buyTarget ? `Comprar: ${buyTarget.title}` : undefined}
        priceCLP={buyTarget ? Number(buyTarget.price) : undefined}
        onClose={() => setBuyTarget(null)}
        onPick={async (provider) => {
          await handleBuyNow(provider);
          setBuyTarget(null);
        }}
      />
    </div>
  );
}

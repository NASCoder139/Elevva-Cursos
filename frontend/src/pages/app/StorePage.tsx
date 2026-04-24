import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, Search, Star, CreditCard, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../hooks/useCategories';
import { useCourses } from '../../hooks/useCourses';
import { paymentsApi } from '../../api/payments.api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { PriceTag } from '../../components/ui/PriceTag';
import type { Course } from '../../types/course.types';

const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return 'Incluido';
  const n = typeof price === 'string' ? Number(price) : price;
  if (!n || n === 0) return 'Incluido';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(n);
};

function StoreCard({ course }: { course: Course }) {
  const [loading, setLoading] = useState(false);
  const hasPrice = course.price !== null && course.price !== undefined && Number(course.price) > 0;

  const handleBuy = async () => {
    if (!hasPrice) return;
    setLoading(true);
    try {
      const res = await paymentsApi.checkoutCourse(course.id);
      const initPoint = (res.data as any)?.data?.initPoint || (res.data as any)?.initPoint;
      if (initPoint) window.location.href = initPoint;
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al iniciar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-800 bg-surface-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:border-primary-600/50">
      <Link to={`/course/${course.slug}`} className="relative aspect-[4/3] overflow-hidden bg-surface-800">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-surface-600">
            <Sparkles className="h-10 w-10" />
          </div>
        )}
        {course.isFeatured && (
          <span className="absolute left-2 top-2 rounded bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            Destacado
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="mb-1 line-clamp-2 text-xs font-semibold leading-snug text-surface-50">
          {course.title}
        </h3>
        {course.category && (
          <span className="mb-1.5 text-[10px] text-surface-500">
            {course.category.name}
          </span>
        )}

        <div className="mb-1.5 flex items-center gap-0.5 text-yellow-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-2.5 w-2.5 fill-current" />
          ))}
          <span className="ml-1 text-[10px] text-surface-500">(5.0)</span>
        </div>

        <div className="mt-auto">
          <div className="mb-2">
            {hasPrice ? (
              <PriceTag price={course.price} comparePrice={course.comparePrice} size="sm" className="text-white" />
            ) : (
              <span className="text-sm font-bold text-white">{formatPrice(course.price)}</span>
            )}
          </div>
          <Button
            onClick={handleBuy}
            isLoading={loading}
            fullWidth
            disabled={!hasPrice}
            className="h-7 gap-1 text-[11px]"
          >
            <ShoppingCart className="h-3 w-3" />
            {hasPrice ? 'Comprar' : 'Incluido'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get('category') || undefined;
  const searchParam = params.get('search') || '';
  const [search, setSearch] = useState(searchParam);

  const { categories, loading: loadingCats } = useCategories();
  const { courses, loading } = useCourses({
    category: activeCategory,
    search: search || undefined,
    limit: 48,
    studentView: true,
  });

  const paidCourses = useMemo(
    () => courses.filter((c) => c.price && Number(c.price) > 0),
    [courses],
  );

  const activeCatName = useMemo(() => {
    if (!activeCategory) return 'Todos los cursos';
    return categories.find((c) => c.slug === activeCategory)?.name || 'Cursos';
  }, [activeCategory, categories]);

  const handleCategory = (slug?: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug);
    else next.delete('category');
    setParams(next);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="lg:w-64 lg:flex-shrink-0">
        <div className="sticky top-20 rounded-2xl bg-surface-900 dark:bg-surface-900 border border-surface-800 p-4 text-white">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-surface-400">
            Categorías del producto
          </h2>
          <nav className="space-y-0.5">
            <button
              onClick={() => handleCategory(undefined)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${!activeCategory
                ? 'bg-primary-600 text-white font-medium'
                : 'text-surface-300 hover:bg-surface-800'
                }`}
            >
              Todos
            </button>
            {loadingCats ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full bg-surface-800" />
                ))}
              </div>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategory(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${activeCategory === cat.slug
                    ? 'bg-primary-600 text-white font-medium'
                    : 'text-surface-300 hover:bg-surface-800'
                    }`}
                >
                  {cat.name}
                </button>
              ))
            )}
          </nav>

          <Link
            to="/pricing"
            className="mt-4 block rounded-xl bg-gradient-to-b from-surface-800 to-surface-900 border border-surface-700 p-4 text-center transition hover:border-primary-500"
          >
            <p className="text-xs text-surface-400">¿Quieres todo por un solo precio?</p>
            <p className="mt-1 text-sm font-bold text-white">Suscribete y accede a TODOS los cursos</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700">
              <Zap className="h-3.5 w-3.5 fill-current" />
              Ver suscripciones
              <Zap className="h-3.5 w-3.5 fill-current" />
            </span>
          </Link>
        </div>
      </aside>

      <section className="flex-1 min-w-0">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{activeCatName}</h1>
            <p className="mt-1 text-sm text-surface-500">
              {loading ? 'Cargando…' : `${paidCourses.length} cursos a la venta`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Input
                icon={Search}
                placeholder="Buscar cursos…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link
              to="/pricing"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              <CreditCard className="h-4 w-4" />
              Acceso total
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-gradient-to-r from-surface-900 via-primary-900/60 to-surface-900 border border-surface-700 p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-surface-300">¿Quieres todo por un solo precio?</p>
            <p className="text-lg font-bold">Suscribete y accede a TODOS los cursos</p>
          </div>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <Zap className="h-4 w-4 fill-current" />
            Ver suscripciones
            <Zap className="h-4 w-4 fill-current" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : paidCourses.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-surface-300 text-surface-500 dark:border-surface-700">
            No hay cursos a la venta en esta categoría.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {paidCourses.map((c) => (
              <StoreCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

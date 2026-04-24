import { useMemo, useState } from 'react';
import { BookOpen, Sparkles, ShoppingBag, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAccess } from '../../hooks/useAccess';
import CourseGrid from '../../components/courses/CourseGrid';
import { Spinner } from '../../components/ui/Spinner';
import clsx from 'clsx';

type TabKey = 'all' | 'purchased' | 'plan';

export default function MyCoursesPage() {
  const { myCourses, hasSubscription, hasAccess, getAccessType, loading } = useAccess();
  const [tab, setTab] = useState<TabKey>('all');

  const { purchasedCourses, planCourses } = useMemo(() => {
    const purchased = myCourses.filter((c) => getAccessType(c.id) === 'PURCHASED');
    const plan = myCourses.filter((c) => {
      const t = getAccessType(c.id);
      return t === 'MONTHLY' || t === 'ANNUAL';
    });
    return { purchasedCourses: purchased, planCourses: plan };
  }, [myCourses, getAccessType]);

  const visibleCourses =
    tab === 'purchased' ? purchasedCourses : tab === 'plan' ? planCourses : myCourses;

  const emptyMessageByTab: Record<TabKey, string> = {
    all: 'Aún no tenés cursos',
    purchased: 'Todavía no compraste cursos individuales',
    plan: 'Tu plan no incluye cursos aún',
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; count: number; icon: React.ElementType }[] = [
    { key: 'all', label: 'Todos', count: myCourses.length, icon: BookOpen },
    { key: 'purchased', label: 'Adquiridos', count: purchasedCourses.length, icon: ShoppingBag },
    { key: 'plan', label: 'Incluidos en mi plan', count: planCourses.length, icon: Crown },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Mis Cursos</h1>
          <p className="mt-0.5 text-sm text-surface-500">
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
          <div className="mb-6 flex gap-1 border-b border-surface-200 dark:border-surface-800 overflow-x-auto">
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

          {/* Info por tab */}
          {tab === 'purchased' && (
            <p className="mb-4 text-xs text-surface-500 dark:text-surface-400">
              Cursos comprados individualmente. Son tuyos de forma permanente, aunque canceles la suscripción.
            </p>
          )}
          {tab === 'plan' && (
            <p className="mb-4 text-xs text-surface-500 dark:text-surface-400">
              Cursos incluidos en tu plan de suscripción. El acceso se mantiene mientras tengas el plan activo.
            </p>
          )}

          {visibleCourses.length === 0 ? (
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
            <CourseGrid courses={visibleCourses} hasAccess={hasAccess} getAccessType={getAccessType} />
          )}
        </>
      )}
    </div>
  );
}

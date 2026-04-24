import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Clock,
  PlayCircle,
  Heart,
  ArrowLeft,
  Sparkles,
  ShoppingCart,
  ChevronDown,
  Check,
  CheckCheck,
  Play,
  Lock,
  BookOpen,
  Award,
  BarChart3,
  FileText,
  Download,
  Eye,
} from 'lucide-react';
import clsx from 'clsx';
import { useCourse } from '../../hooks/useCourses';
import { useAccess } from '../../hooks/useAccess';
import { favoritesApi } from '../../api/favorites.api';
import { paymentsApi } from '../../api/payments.api';
import { progressApi } from '../../api/progress.api';
import { lessonsApi, type LessonDetail } from '../../api/lessons.api';
import { useDemo } from '../../contexts/DemoContext';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Badge } from '../../components/ui/Badge';
import VideoPlayer from '../../components/courses/VideoPlayer';
import ResourceList from '../../components/courses/ResourceList';
import { LockedLessonGate } from '../../components/demo/LockedLessonGate';
import { formatDuration, formatDurationMinutes, formatBytes } from '../../lib/formatters';
import { PriceTag } from '../../components/ui/PriceTag';
import { getAccessToken } from '../../api/axios';
import type { Resource } from '../../types/course.types';

const canPreviewInlineRes = (t: Resource['type']) =>
  t === 'PDF' || t === 'IMAGE' || t === 'AUDIO';

const resourceUrl = (r: Resource, download: boolean) => {
  const token = getAccessToken();
  const base = `/api/resources/${r.id}/${download ? 'download' : 'stream'}`;
  return token ? `${base}?t=${encodeURIComponent(token)}` : base;
};

const formatPrice = (price: number | string | null | undefined): string => {
  if (price === null || price === undefined) return 'Incluido en membresía';
  const n = typeof price === 'string' ? Number(price) : price;
  if (!n) return 'Incluido en membresía';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(n);
};

export default function CourseDetailPage() {
  const { courseSlug } = useParams();
  const navigate = useNavigate();
  const { course, loading, error } = useCourse(courseSlug);
  const { hasAccess: hasAccessCheck, getAccessType } = useAccess();
  const { data: demoData, activate: activateDemo } = useDemo();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);

  useEffect(() => {
    if (course) {
      setIsFavorited(!!course.isFavorited);
      const initial: Record<string, boolean> = {};
      const opened: Record<string, boolean> = {};
      course.modules?.forEach((m, i) => {
        opened[m.id] = i === 0;
        m.lessons.forEach((l) => {
          if (l.isCompleted) initial[l.id] = true;
        });
      });
      setCompleted(initial);
      setOpenModules(opened);
    }
  }, [course?.id]);

  const owned = course ? hasAccessCheck(course.id) : false;
  const hasAccess = useMemo(() => {
    return owned || demoData?.status === 'ACTIVE';
  }, [owned, demoData?.status]);

  const stats = useMemo(() => {
    if (!course?.modules) return { total: 0, done: 0, percent: 0 };
    const lessons = course.modules.flatMap((m) => m.lessons);
    const total = lessons.length;
    const done = lessons.filter((l) => completed[l.id]).length;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }, [course, completed]);

  const allLessons = useMemo(
    () => course?.modules?.flatMap((m) => m.lessons) || [],
    [course],
  );
  const firstLesson = allLessons[0];

  const allResources = useMemo(
    () => course?.modules?.flatMap((m) => m.resources || []) || [],
    [course],
  );

  useEffect(() => {
    if (!selectedLessonId) {
      setLessonDetail(null);
      return;
    }
    let mounted = true;
    setLessonLoading(true);
    setLessonDetail(null);
    lessonsApi
      .getById(selectedLessonId)
      .then((res) => {
        if (mounted) setLessonDetail(res.data.data);
      })
      .catch(() => {
        if (mounted) toast.error('No se pudo cargar la lección');
      })
      .finally(() => {
        if (mounted) setLessonLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedLessonId, demoData?.status]);

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLessonEnded = () => {
    if (!selectedLessonId) return;
    setCompleted((prev) => ({ ...prev, [selectedLessonId]: true }));
    const idx = allLessons.findIndex((l) => l.id === selectedLessonId);
    const next = idx >= 0 ? allLessons[idx + 1] : null;
    if (next) setSelectedLessonId(next.id);
  };

  const handleBuyCourse = async () => {
    if (!course || buyLoading) return;
    setBuyLoading(true);
    try {
      const res = await paymentsApi.checkoutCourse(course.id);
      const { initPoint } = res.data.data;
      if (initPoint) window.location.href = initPoint;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo iniciar el pago');
    } finally {
      setBuyLoading(false);
    }
  };

  const handleActivateDemo = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      await activateDemo();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'No se pudo activar la demo');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!course || favoriteLoading) return;
    setFavoriteLoading(true);
    const wasFavorited = isFavorited;
    setIsFavorited(!wasFavorited);
    try {
      if (wasFavorited) {
        await favoritesApi.remove(course.id);
        toast.success('Quitado de favoritos');
      } else {
        await favoritesApi.add(course.id);
        toast.success('Agregado a favoritos');
      }
    } catch {
      setIsFavorited(wasFavorited);
      toast.error('Error al actualizar favoritos');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const toggleLessonComplete = async (lessonId: string, unlocked: boolean) => {
    if (!unlocked || togglingId) return;
    const wasCompleted = !!completed[lessonId];
    setTogglingId(lessonId);
    setCompleted((prev) => ({ ...prev, [lessonId]: !wasCompleted }));
    try {
      if (!wasCompleted) {
        await progressApi.complete(lessonId);
      } else {
        await progressApi.update(lessonId, 0);
      }
    } catch {
      setCompleted((prev) => ({ ...prev, [lessonId]: wasCompleted }));
      toast.error('No se pudo actualizar el progreso');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="mb-4 text-surface-600 dark:text-surface-400">{error || 'Curso no encontrado'}</p>
        <Button href="/catalog" variant="outline">
          Volver al catálogo
        </Button>
      </div>
    );
  }

  const hasPrice = course.price !== null && course.price !== undefined && Number(course.price) > 0;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <Link
        to="/catalog"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_400px] min-w-0">
        {/* LEFT — Hero + info */}
        <div className="space-y-6">
          {selectedLessonId ? (
            <div className="rounded-2xl overflow-hidden bg-black shadow-xl">
              {lessonLoading ? (
                <div className="flex aspect-video w-full items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : lessonDetail?.hasAccess ? (
                <VideoPlayer
                  lessonId={selectedLessonId}
                  startAt={lessonDetail.progress.watchedSeconds || 0}
                  onEnded={handleLessonEnded}
                  onCompleted={() =>
                    setCompleted((prev) => ({ ...prev, [selectedLessonId]: true }))
                  }
                />
              ) : (
                <div className="p-4">
                  <LockedLessonGate />
                </div>
              )}
              <div className="flex items-center justify-between gap-3 bg-surface-900 px-4 py-3 text-white">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-surface-400">Reproduciendo</p>
                  <p className="truncate text-sm font-medium">{lessonDetail?.title || '…'}</p>
                </div>
                <button
                  onClick={() => setSelectedLessonId(null)}
                  className="text-xs text-surface-400 hover:text-white"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br from-surface-900 to-surface-800 shadow-xl">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/30">
                  <PlayCircle className="h-24 w-24" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="mb-2 flex flex-wrap gap-2">
                  {course.category && (
                    <Badge variant="info" className="bg-primary-600 text-white border-0">
                      {course.category.name}
                    </Badge>
                  )}
                  {course.isFeatured && (
                    <Badge variant="warning" className="bg-yellow-500 text-white border-0">
                      Destacado
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg">
                  {course.title}
                </h1>
                {firstLesson && (
                  <button
                    onClick={() => handleSelectLesson(firstLesson.id)}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-surface-900 shadow-lg transition hover:bg-white"
                  >
                    <Play className="h-4 w-4 fill-current" /> Reproducir
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
                <Clock className="h-3.5 w-3.5" /> Duración
              </div>
              <div className="font-semibold text-surface-900 dark:text-white text-sm sm:text-base break-words">
                {formatDurationMinutes(course.durationMins)}
              </div>
            </div>
            <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
                <BookOpen className="h-3.5 w-3.5" /> Lecciones
              </div>
              <div className="font-semibold text-surface-900 dark:text-white text-sm sm:text-base break-words">{course.lessonCount}</div>
            </div>
            <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
                <BarChart3 className="h-3.5 w-3.5" /> Progreso
              </div>
              <div className="font-semibold text-surface-900 dark:text-white text-sm sm:text-base break-words">{stats.percent}%</div>
            </div>
            <div className="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 sm:p-4 min-w-0">
              <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
                <Award className="h-3.5 w-3.5" /> Certificado
              </div>
              <div className="font-semibold text-surface-900 dark:text-white text-sm sm:text-base break-words">Al completar</div>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-surface-900 dark:text-white mb-3">
              Sobre este curso
            </h2>
            <p className="text-sm sm:text-base text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-line break-words">
              {course.description}
            </p>
          </div>

          {/* Material descargable del curso */}
          {hasAccess && allResources.length > 0 && (
            <ResourceList resources={allResources} title="Material del curso" />
          )}
        </div>

        {/* RIGHT — Action card + Lesson list */}
        <aside className="space-y-4 min-w-0 lg:sticky lg:top-20 lg:self-start">
          {/* Action card */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4 sm:p-5 shadow-sm">
            <div className="mb-4">
              {owned ? (
                <span className="inline-flex items-center gap-2 text-lg font-semibold text-green-600 dark:text-green-400">
                  {(() => {
                    const at = course ? getAccessType(course.id) : null;
                    const Icon = at === 'PURCHASED' ? CheckCheck : Check;
                    const label = at === 'MONTHLY' ? 'Acceso Mensual' : at === 'ANNUAL' ? 'Acceso Anual' : 'Adquirido';
                    return <><Icon className="h-5 w-5" /> {label}</>;
                  })()}
                </span>
              ) : hasPrice ? (
                <PriceTag price={course.price} comparePrice={course.comparePrice} size="lg" />
              ) : (
                <span className="text-2xl font-bold text-surface-900 dark:text-white">{formatPrice(course.price)}</span>
              )}
            </div>
            {stats.total > 0 && (
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-surface-600 dark:text-surface-400">Tu progreso</span>
                  <span className="font-semibold text-surface-900 dark:text-white">
                    {stats.done}/{stats.total}
                  </span>
                </div>
                <ProgressBar value={stats.percent} />
              </div>
            )}
            {firstLesson ? (
              <Button
                fullWidth
                className="gap-2"
                onClick={() => {
                  const nextLesson = allLessons.find((l) => !completed[l.id]) || firstLesson;
                  handleSelectLesson(nextLesson.id);
                }}
              >
                <Play className="h-4 w-4" />
                {stats.done > 0 ? 'Continuar curso' : 'Empezar curso'}
              </Button>
            ) : (
              <Button fullWidth disabled>
                Próximamente
              </Button>
            )}
            {!owned && demoData?.status === 'AVAILABLE' && (
              <Button
                fullWidth
                variant="outline"
                className="mt-2 gap-2"
                onClick={handleActivateDemo}
                isLoading={demoLoading}
              >
                <Sparkles className="h-4 w-4" /> Activar demo 30 min
              </Button>
            )}
            {!owned && hasPrice && (
              <Button
                fullWidth
                variant="outline"
                className="mt-2 gap-2"
                onClick={handleBuyCourse}
                isLoading={buyLoading}
              >
                <ShoppingCart className="h-4 w-4" /> Comprar curso
              </Button>
            )}
            {!owned && (
              <button
                onClick={() => navigate('/pricing')}
                className="mt-3 w-full text-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                Ver planes de suscripción
              </button>
            )}
            <button
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className={clsx(
                'mt-3 flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition',
                isFavorited
                  ? 'border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                  : 'border-surface-300 text-surface-700 hover:bg-surface-50 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800',
              )}
            >
              <Heart className={clsx('h-4 w-4', isFavorited && 'fill-current')} />
              {isFavorited ? 'En favoritos' : 'Añadir a favoritos'}
            </button>
          </div>

          {/* Lesson list */}
          <div className="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200 dark:border-surface-800">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-surface-900 dark:text-white">
                  Contenido
                </h3>
                <p className="text-xs text-surface-500 mt-0.5">
                  {course.modules?.length || 0} módulos · {stats.total} lecciones
                </p>
              </div>
              <div className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                {stats.done}/{stats.total}
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {course.modules?.map((mod, idx) => {
                const isOpen = !!openModules[mod.id];
                const modDone = mod.lessons.filter((l) => completed[l.id]).length;
                const modTotal = mod.lessons.length;
                const modResources = mod.resources || [];
                const counterLabel = modTotal > 0
                  ? `${modDone}/${modTotal}`
                  : modResources.length > 0
                    ? `${modResources.length} recurso${modResources.length === 1 ? '' : 's'}`
                    : '';
                return (
                  <div key={mod.id} className="border-b border-surface-200 dark:border-surface-800 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setOpenModules((p) => ({ ...p, [mod.id]: !p[mod.id] }))}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800/50 transition"
                    >
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-primary-100 text-primary-700 text-xs font-bold dark:bg-primary-900/30 dark:text-primary-400">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                          {mod.title}
                        </h4>
                      </div>
                      <span className="text-xs text-surface-500 tabular-nums">
                        {counterLabel}
                      </span>
                      <ChevronDown
                        className={clsx(
                          'h-4 w-4 text-surface-400 transition-transform',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>
                    {isOpen && (
                      <ul>
                        {mod.lessons.map((lesson, lIdx) => {
                          const unlocked = hasAccess || lesson.isFreePreview;
                          const isDone = !!completed[lesson.id];
                          const isToggling = togglingId === lesson.id;
                          return (
                            <li
                              key={lesson.id}
                              className={clsx(
                                'flex items-center gap-3 px-5 py-2.5 text-sm transition',
                                unlocked ? 'hover:bg-surface-50 dark:hover:bg-surface-800/30' : 'opacity-60',
                              )}
                            >
                              <button
                                onClick={() => toggleLessonComplete(lesson.id, unlocked)}
                                disabled={!unlocked || isToggling}
                                className={clsx(
                                  'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition',
                                  isDone
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : 'border-surface-300 dark:border-surface-600 hover:border-primary-500',
                                  !unlocked && 'cursor-not-allowed',
                                )}
                                title={isDone ? 'Marcar como no vista' : 'Marcar como vista'}
                              >
                                {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
                              </button>

                              <button
                                type="button"
                                onClick={() => unlocked && handleSelectLesson(lesson.id)}
                                disabled={!unlocked}
                                className={clsx(
                                  'flex flex-1 min-w-0 items-center gap-2 text-left',
                                  !unlocked && 'cursor-not-allowed',
                                  selectedLessonId === lesson.id && 'text-primary-600 dark:text-primary-400 font-semibold',
                                )}
                              >
                                <span className="text-xs text-surface-500 tabular-nums w-5">
                                  {lIdx + 1}
                                </span>
                                <span
                                  className={clsx(
                                    'flex-1 truncate',
                                    isDone
                                      ? 'text-surface-500 line-through'
                                      : selectedLessonId === lesson.id
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-surface-800 dark:text-surface-200',
                                  )}
                                >
                                  {lesson.title}
                                </span>
                                {lesson.isFreePreview && !hasAccess && (
                                  <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                    Preview
                                  </span>
                                )}
                                {!unlocked ? (
                                  <Lock className="h-3.5 w-3.5 text-surface-400 flex-shrink-0" />
                                ) : (
                                  <Play className="h-3.5 w-3.5 text-primary-500 flex-shrink-0" />
                                )}
                              </button>

                              <span className="text-xs text-surface-500 tabular-nums flex-shrink-0">
                                {formatDuration(lesson.durationSeconds)}
                              </span>
                            </li>
                          );
                        })}
                        {modResources.map((r) => {
                          const size = formatBytes(r.sizeBytes);
                          const previewable = canPreviewInlineRes(r.type);
                          return (
                            <li
                              key={r.id}
                              className={clsx(
                                'flex items-center gap-3 px-5 py-2.5 text-sm transition',
                                hasAccess ? 'hover:bg-surface-50 dark:hover:bg-surface-800/30' : 'opacity-60',
                              )}
                            >
                              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                                <FileText className="h-4 w-4 text-red-500" />
                              </span>
                              <div className="flex flex-1 min-w-0 flex-col">
                                <span className="truncate text-surface-800 dark:text-surface-200">
                                  {r.title}
                                </span>
                                {size && (
                                  <span className="text-[10px] text-surface-500">
                                    {r.type} · {size}
                                  </span>
                                )}
                              </div>
                              {hasAccess ? (
                                <>
                                  {previewable && (
                                    <a
                                      href={resourceUrl(r, false)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border border-surface-300 text-surface-600 transition hover:bg-surface-100 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-800"
                                      title="Ver"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                  <a
                                    href={resourceUrl(r, true)}
                                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-primary-600 text-white transition hover:bg-primary-500"
                                    title="Descargar"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </a>
                                </>
                              ) : (
                                <Lock className="h-3.5 w-3.5 flex-shrink-0 text-surface-400" />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

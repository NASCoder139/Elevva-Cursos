import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, CheckCircle2, PlayCircle, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { useCourse } from '../../hooks/useCourses';
import VideoPlayer from '../../components/courses/VideoPlayer';
import ResourceList from '../../components/courses/ResourceList';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { formatDuration } from '../../lib/formatters';
import { lessonsApi, type LessonDetail } from '../../api/lessons.api';
import { LockedLessonGate } from '../../components/demo/LockedLessonGate';
import { useDemo } from '../../contexts/DemoContext';
import type { Lesson, Module } from '../../types/course.types';

export default function LessonPlayerPage() {
  const { courseSlug, lessonId } = useParams();
  const navigate = useNavigate();
  const { course, loading } = useCourse(courseSlug);
  const { data: demoData } = useDemo();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    let mounted = true;
    setLessonLoading(true);
    setLessonDetail(null);
    lessonsApi
      .getById(lessonId)
      .then((res) => {
        if (mounted) setLessonDetail(res.data.data);
      })
      .catch(() => null)
      .finally(() => {
        if (mounted) setLessonLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [lessonId, demoData?.status]);

  const flat = useMemo(() => {
    if (!course?.modules) return [] as { lesson: Lesson; module: Module }[];
    const arr: { lesson: Lesson; module: Module }[] = [];
    for (const m of course.modules) for (const l of m.lessons) arr.push({ lesson: l, module: m });
    return arr;
  }, [course]);

  const currentIdx = flat.findIndex((x) => x.lesson.id === lessonId);
  const current = flat[currentIdx];
  const prev = currentIdx > 0 ? flat[currentIdx - 1] : null;
  const next = currentIdx >= 0 && currentIdx < flat.length - 1 ? flat[currentIdx + 1] : null;

  useEffect(() => {
    if (current) setOpenModules(new Set([current.module.id]));
  }, [current?.module.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course || !current) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="mb-4 text-surface-600 dark:text-surface-400">Lección no encontrada</p>
        <Button href={`/course/${courseSlug}`} variant="outline">
          Volver al curso
        </Button>
      </div>
    );
  }

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const goTo = (lid: string) => navigate(`/course/${courseSlug}/learn/${lid}`);

  return (
    <div className="flex min-h-screen bg-surface-950 text-surface-100">
      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-surface-800 px-4 py-3">
          <Link
            to={`/course/${courseSlug}`}
            className="flex items-center gap-2 text-sm text-surface-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <h1 className="truncate text-sm font-medium">{current.lesson.title}</h1>
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded p-1 text-surface-400 hover:text-white"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        <div className="flex-1 p-4 lg:p-8">
          {lessonLoading ? (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-black">
              <Spinner size="lg" />
            </div>
          ) : lessonDetail?.hasAccess ? (
            <VideoPlayer
              lessonId={current.lesson.id}
              startAt={lessonDetail.progress.watchedSeconds || 0}
              onEnded={() => {
                if (next) goTo(next.lesson.id);
              }}
            />
          ) : (
            <LockedLessonGate />
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              disabled={!prev}
              onClick={() => prev && goTo(prev.lesson.id)}
            >
              ← Anterior
            </Button>
            <span className="text-sm text-surface-400">
              {currentIdx + 1} / {flat.length}
            </span>
            <Button disabled={!next} onClick={() => next && goTo(next.lesson.id)}>
              Siguiente →
            </Button>
          </div>

          <h2 className="mt-8 text-xl font-semibold">{current.lesson.title}</h2>
          {current.lesson.description && (
            <p className="mt-2 text-surface-400">{current.lesson.description}</p>
          )}

          {lessonDetail?.hasAccess && lessonDetail.module?.resources && lessonDetail.module.resources.length > 0 && (
            <ResourceList resources={lessonDetail.module.resources} />
          )}
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-full max-w-sm border-l border-surface-800 bg-surface-950">
          <div className="sticky top-0 border-b border-surface-800 bg-surface-950 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-surface-400">Contenido</h3>
            <p className="mt-1 truncate text-base font-medium text-surface-100">{course.title}</p>
          </div>
          <div className="overflow-y-auto">
            {course.modules?.map((mod, mi) => {
              const open = openModules.has(mod.id);
              return (
                <div key={mod.id} className="border-b border-surface-800">
                  <button
                    type="button"
                    onClick={() => toggleModule(mod.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-900"
                  >
                    <div>
                      <div className="text-xs text-surface-500">Módulo {mi + 1}</div>
                      <div className="text-sm font-medium">{mod.title}</div>
                    </div>
                    <ChevronDown
                      className={clsx('h-4 w-4 text-surface-400 transition', open && 'rotate-180')}
                    />
                  </button>
                  {open && (
                    <ul>
                      {mod.lessons.map((l, li) => {
                        const isCurrent = l.id === current.lesson.id;
                        return (
                          <li key={l.id}>
                            <button
                              type="button"
                              onClick={() => goTo(l.id)}
                              className={clsx(
                                'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm',
                                isCurrent
                                  ? 'bg-primary-900/40 text-primary-300'
                                  : 'text-surface-300 hover:bg-surface-900',
                              )}
                            >
                              <span className="w-5 text-xs text-surface-500">{li + 1}</span>
                              {l.isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                              ) : isCurrent ? (
                                <PlayCircle className="h-4 w-4 shrink-0 text-primary-400" />
                              ) : (
                                <PlayCircle className="h-4 w-4 shrink-0 text-surface-600" />
                              )}
                              <span className="flex-1 truncate">{l.title}</span>
                              <span className="shrink-0 text-xs text-surface-500">
                                {formatDuration(l.durationSeconds)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}

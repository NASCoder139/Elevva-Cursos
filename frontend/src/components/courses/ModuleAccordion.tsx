import { useState } from 'react';
import { ChevronDown, Play, Lock, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import type { Module } from '../../types/course.types';
import { formatDuration } from '../../lib/formatters';

interface ModuleAccordionProps {
  module: Module;
  courseSlug: string;
  hasAccess: boolean;
  defaultOpen?: boolean;
}

export default function ModuleAccordion({ module, courseSlug, hasAccess, defaultOpen = false }: ModuleAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const totalSeconds = module.lessons.reduce((acc, l) => acc + l.durationSeconds, 0);

  return (
    <div className="overflow-hidden rounded-lg border border-surface-200 dark:border-surface-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 bg-surface-50 px-4 py-3 text-left transition hover:bg-surface-100 dark:bg-surface-900 dark:hover:bg-surface-800"
      >
        <div>
          <h4 className="font-medium text-surface-900 dark:text-surface-50">{module.title}</h4>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {module.lessons.length} lecciones · {formatDuration(totalSeconds)}
          </p>
        </div>
        <ChevronDown className={clsx('h-5 w-5 text-surface-500 transition', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="divide-y divide-surface-200 bg-white dark:divide-surface-800 dark:bg-surface-950">
          {module.lessons.map((lesson) => {
            const unlocked = hasAccess || lesson.isFreePreview;
            return (
              <li key={lesson.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  {lesson.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : unlocked ? (
                    <Play className="h-5 w-5 text-primary-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-surface-400" />
                  )}
                  <span className="text-sm text-surface-800 dark:text-surface-200">
                    {lesson.title}
                    {lesson.isFreePreview && !hasAccess && (
                      <span className="ml-2 rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        Preview
                      </span>
                    )}
                  </span>
                </div>
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  {formatDuration(lesson.durationSeconds)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {/* courseSlug passed for future navigation to lesson player */}
      <span className="hidden">{courseSlug}</span>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Clock, PlayCircle, Heart, Check, CheckCheck, Crown } from 'lucide-react';
import type { Course } from '../../types/course.types';
import { formatDurationMinutes } from '../../lib/formatters';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { PriceTag } from '../ui/PriceTag';

type AccessType = 'MONTHLY' | 'ANNUAL' | 'PURCHASED' | null;

interface CourseCardProps {
  course: Course;
  owned?: boolean;
  accessType?: AccessType;
  compact?: boolean;
}

const accessLabel: Record<string, string> = {
  MONTHLY: 'Acceso Mensual',
  ANNUAL: 'Acceso Anual',
  PURCHASED: 'Adquirido',
};

export default function CourseCard({ course, owned, accessType, compact }: CourseCardProps) {
  if (compact) {
    return (
      <Link
        to={`/course/${course.slug}`}
        className="group relative flex flex-col overflow-hidden rounded-lg border border-surface-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-surface-800 dark:bg-surface-900"
      >
        <div className="relative aspect-video overflow-hidden bg-surface-100 dark:bg-surface-800">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover transition group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-surface-400">
              <PlayCircle className="h-10 w-10" />
            </div>
          )}
          {owned && (
            <div className="absolute right-1.5 top-1.5 rounded-full bg-green-500 p-1 text-white shadow">
              {accessType === 'PURCHASED' ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-2">
          {course.isFeatured && (
            <Crown className="h-3.5 w-3.5 flex-shrink-0 text-yellow-500" fill="currentColor" />
          )}
          <h3 className="line-clamp-1 text-[13px] font-medium text-surface-800 dark:text-surface-200">
            {course.title}
          </h3>
        </div>
        {typeof course.progressPercent === 'number' && course.progressPercent > 0 && (
          <div className="px-2.5 pb-2">
            <ProgressBar value={course.progressPercent} />
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link
      to={`/course/${course.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-surface-800 dark:bg-surface-900"
    >
      <div className="relative aspect-video overflow-hidden bg-surface-100 dark:bg-surface-800">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-surface-400">
            <PlayCircle className="h-16 w-16" />
          </div>
        )}
        {owned && (
          <div className="absolute right-3 top-3 rounded-full bg-green-500 p-1.5 text-white shadow">
            {accessType === 'PURCHASED' ? <CheckCheck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </div>
        )}
        {!owned && course.isFavorited && (
          <div className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-primary-600 shadow dark:bg-surface-900/90">
            <Heart className="h-4 w-4 fill-current" />
          </div>
        )}
        {course.isFeatured && (
          <div className="absolute left-3 top-3">
            <Badge variant="info">Destacado</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {course.category && (
          <span className="mb-2 text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-400">
            {course.category.name}
          </span>
        )}
        <h3 className="mb-2 line-clamp-2 text-base font-semibold text-surface-900 dark:text-surface-50">
          {course.title}
        </h3>
        {course.shortDesc && (
          <p className="mb-3 line-clamp-2 text-sm text-surface-600 dark:text-surface-400">
            {course.shortDesc}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 text-xs text-surface-500 dark:text-surface-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDurationMinutes(course.durationMins)}
            </span>
            <span className="flex items-center gap-1">
              <PlayCircle className="h-3.5 w-3.5" />
              {course.lessonCount} lecciones
            </span>
          </div>
          {owned ? (
            <span className="inline-flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
              {accessType === 'PURCHASED' ? <CheckCheck className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
              {accessType ? accessLabel[accessType] : 'Adquirido'}
            </span>
          ) : (
            <PriceTag price={course.price} comparePrice={course.comparePrice} size="sm" />
          )}
        </div>

        {typeof course.progressPercent === 'number' && course.progressPercent > 0 && (
          <div className="mt-3">
            <ProgressBar value={course.progressPercent} />
          </div>
        )}
      </div>
    </Link>
  );
}

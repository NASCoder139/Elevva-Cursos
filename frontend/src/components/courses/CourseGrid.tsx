import type { Course } from '../../types/course.types';
import CourseCard from './CourseCard';
import { Skeleton } from '../ui/Skeleton';

interface CourseGridProps {
  courses: Course[];
  loading?: boolean;
  emptyMessage?: string;
  hasAccess?: (courseId: string) => boolean;
  getAccessType?: (courseId: string) => 'MONTHLY' | 'ANNUAL' | 'PURCHASED' | null;
  compact?: boolean;
}

export default function CourseGrid({
  courses,
  loading,
  emptyMessage = 'No hay cursos disponibles.',
  hasAccess,
  getAccessType,
  compact,
}: CourseGridProps) {
  const gridClass = compact
    ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
    : 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: compact ? 12 : 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className={compact ? 'aspect-video rounded-lg' : 'aspect-video rounded-xl'} />
            {!compact && <Skeleton className="h-4 w-1/3" />}
            <Skeleton className="h-4 w-full" />
            {!compact && <Skeleton className="h-4 w-2/3" />}
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-surface-300 text-surface-500 dark:border-surface-700 dark:text-surface-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          owned={hasAccess ? hasAccess(course.id) : undefined}
          accessType={getAccessType ? getAccessType(course.id) : undefined}
          compact={compact}
        />
      ))}
    </div>
  );
}

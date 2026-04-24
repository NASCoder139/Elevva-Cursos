import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import type { Course } from '../../types/course.types';
import { favoritesApi } from '../../api/favorites.api';
import CourseGrid from '../../components/courses/CourseGrid';

export default function FavoritesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    favoritesApi
      .list()
      .then((res) => {
        if (mounted) setCourses(res.data.data);
      })
      .catch(() => null)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary-100 p-2.5 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          <Heart className="h-6 w-6 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Mis Favoritos</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Cursos que guardaste para ver mas tarde.
          </p>
        </div>
      </div>

      <CourseGrid
        courses={courses}
        loading={loading}
        emptyMessage="Aun no has agregado cursos a favoritos."
      />
    </div>
  );
}

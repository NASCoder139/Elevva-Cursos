import { useEffect, useState } from 'react';
import { coursesApi, type CourseFilters } from '../api/courses.api';
import type { Course } from '../types/course.types';

export function useCourses(filters: CourseFilters = {}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(filters);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    coursesApi
      .getAll(filters)
      .then((res) => {
        if (!mounted) return;
        setCourses(res.data.data.data);
        setMeta(res.data.data.meta);
      })
      .catch((e) => {
        if (mounted) setError(e?.response?.data?.message || 'Error al cargar cursos');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { courses, meta, loading, error };
}

export function useFeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    coursesApi
      .getFeatured()
      .then((res) => {
        if (mounted) setCourses(res.data.data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  return { courses, loading };
}

export function useCourse(slug: string | undefined) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    setLoading(true);
    coursesApi
      .getBySlug(slug)
      .then((res) => {
        if (mounted) setCourse(res.data.data);
      })
      .catch((e) => {
        if (mounted) setError(e?.response?.data?.message || 'Curso no encontrado');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [slug]);

  return { course, loading, error };
}

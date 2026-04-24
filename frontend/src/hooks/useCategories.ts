import { useEffect, useState } from 'react';
import { categoriesApi } from '../api/categories.api';
import type { Category } from '../types/course.types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    categoriesApi
      .getAll()
      .then((res) => {
        if (mounted) setCategories(res.data.data);
      })
      .catch((e) => {
        if (mounted) setError(e?.response?.data?.message || 'Error al cargar categorías');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { categories, loading, error };
}

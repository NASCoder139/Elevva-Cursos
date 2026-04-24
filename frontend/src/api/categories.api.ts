import api from './axios';
import type { ApiResponse } from '../types/api.types';
import type { Category, Course } from '../types/course.types';

export const categoriesApi = {
  getAll: () => api.get<ApiResponse<Category[]>>('/categories'),
  getBySlug: (slug: string) =>
    api.get<ApiResponse<Category & { courses: Course[] }>>(`/categories/${slug}`),
};

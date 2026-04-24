import api from './axios';
import type { ApiResponse, PaginatedResponse } from '../types/api.types';
import type { Course } from '../types/course.types';

export interface CourseFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  tag?: string;
  sort?: 'recent' | 'popular' | 'title';
  studentView?: boolean;
}

export const coursesApi = {
  getAll: (filters: CourseFilters = {}) =>
    api.get<ApiResponse<{ data: Course[]; meta: { total: number; page: number; limit: number; totalPages: number } }>>(
      '/courses',
      { params: filters },
    ),
  getFeatured: () => api.get<ApiResponse<Course[]>>('/courses/featured'),
  getBySlug: (slug: string) => api.get<ApiResponse<Course>>(`/courses/${slug}`),
};

export type { PaginatedResponse };

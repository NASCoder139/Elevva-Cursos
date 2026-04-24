import api from './axios';
import type { ApiResponse } from '../types/api.types';
import type { Course } from '../types/course.types';

export const favoritesApi = {
  list: () => api.get<ApiResponse<Course[]>>('/favorites'),
  add: (courseId: string) => api.post<ApiResponse<{ success: boolean }>>(`/favorites/${courseId}`),
  remove: (courseId: string) => api.delete<ApiResponse<{ success: boolean }>>(`/favorites/${courseId}`),
};

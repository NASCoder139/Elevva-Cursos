import api from './axios';
import type { ApiResponse } from '../types/api.types';
import type { Lesson, Module, Resource } from '../types/course.types';

export interface LessonDetail extends Lesson {
  module: Module & {
    course: { id: string; title: string; slug: string; categoryId: string };
    resources?: Resource[];
  };
  progress: { watchedSeconds: number; isCompleted: boolean };
  hasAccess: boolean;
  accessReason: string | null;
}

export const lessonsApi = {
  getById: (id: string) => api.get<ApiResponse<LessonDetail>>(`/lessons/${id}`),
};

import api from './axios';
import type { ApiResponse } from '../types/api.types';

export interface LessonProgressData {
  id?: string;
  lessonId?: string;
  watchedSeconds: number;
  isCompleted: boolean;
  completedAt?: string | null;
  lastWatchedAt?: string;
}

export const progressApi = {
  getLesson: (lessonId: string) =>
    api.get<ApiResponse<LessonProgressData>>(`/progress/lesson/${lessonId}`),
  getCourse: (courseId: string) =>
    api.get<ApiResponse<LessonProgressData[]>>(`/progress/course/${courseId}`),
  update: (lessonId: string, watchedSeconds: number) =>
    api.post<ApiResponse<LessonProgressData>>(`/progress/lesson/${lessonId}`, { watchedSeconds }),
  complete: (lessonId: string) =>
    api.post<ApiResponse<LessonProgressData>>(`/progress/lesson/${lessonId}/complete`),
};

import api from './axios';
import type { ApiResponse } from '../types/api.types';
import type { Course } from '../types/course.types';

export interface DailyActivity {
  date: string;
  day: string;
  minutes: number;
  lessonsCompleted: number;
  cumulativeLessons: number;
}

export interface DashboardData {
  user: { firstName?: string; lastName?: string };
  stats: {
    completedLessons: number;
    favorites: number;
    watchedMinutes: number;
    coursesInProgress: number;
  };
  dailyActivity: DailyActivity[];
  continueWatching: (Course & {
    lastLessonId: string;
    lastLessonTitle: string;
    progressPercent: number;
    completedLessons: number;
    totalLessons: number;
  })[];
  recommended: Course[];
}

export const dashboardApi = {
  get: () => api.get<ApiResponse<DashboardData>>('/dashboard'),
};

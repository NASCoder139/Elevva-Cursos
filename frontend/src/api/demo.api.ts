import api from './axios';
import type { ApiResponse } from '../types/api.types';

export type DemoStatus = 'AVAILABLE' | 'ACTIVE' | 'EXPIRED';

export interface DemoData {
  status: DemoStatus;
  activatedAt: string | null;
  expiresAt: string | null;
  remainingSeconds: number;
}

export const demoApi = {
  status: () => api.get<ApiResponse<DemoData>>('/demo/status'),
  activate: () => api.post<ApiResponse<DemoData>>('/demo/activate'),
};

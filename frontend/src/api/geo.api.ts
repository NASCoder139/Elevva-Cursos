import api from './axios';
import type { ApiResponse } from '../types/api.types';

export interface GeoDetectResponse {
  country: string | null;
  ip: string | null;
}

export const geoApi = {
  detect: () => api.get<ApiResponse<GeoDetectResponse>>('/geo/detect'),
};

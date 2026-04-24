import api from './axios';
import type { ApiResponse } from '../types/api.types';

export interface PromoRibbonPublic {
  enabled: boolean;
  text: string;
  secondaryText: string | null;
  showCountdown: boolean;
  endsAt: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
}

export interface PlansPromoPublic {
  enabled: boolean;
  endsAt: string | null;
}

export const settingsApi = {
  getPromoRibbon: () => api.get<ApiResponse<PromoRibbonPublic>>('/promo-ribbon'),
  getPlansPromo: () => api.get<ApiResponse<PlansPromoPublic>>('/plans-promo'),
};

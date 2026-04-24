import api from './axios';

export interface SubscriptionData {
  id: string;
  plan: 'SUBSCRIPTION_MONTHLY' | 'SUBSCRIPTION_ANNUAL';
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  isActive: boolean;
  isCancelled: boolean;
  accessUntil: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
}

export const subscriptionsApi = {
  getCurrent: () => api.get<{ data: SubscriptionData | null }>('/subscriptions/current'),
  cancel: () => api.post('/subscriptions/cancel'),
};

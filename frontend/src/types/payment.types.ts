export type PaymentType = 'SUBSCRIPTION_MONTHLY' | 'SUBSCRIPTION_ANNUAL' | 'ONE_TIME_COURSE' | 'ONE_TIME_CATEGORY';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'IN_PROCESS';
export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | 'PENDING';

export interface Payment {
  id: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface Subscription {
  id: string;
  plan: PaymentType;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
}

export interface CheckoutResponse {
  preferenceId: string;
  initPoint: string;
}

export interface DemoSession {
  status: 'AVAILABLE' | 'ACTIVE' | 'EXPIRED';
  activatedAt: string | null;
  expiresAt: string | null;
  remainingSeconds: number | null;
}

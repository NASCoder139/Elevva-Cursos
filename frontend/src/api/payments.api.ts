import api from './axios';

export type PaymentProvider = 'MERCADOPAGO' | 'PAYPAL';

export interface CheckoutResponse {
  paymentId?: string;
  subscriptionId?: string;
  preferenceId?: string | number;
  preapprovalId?: string | number;
  providerRef?: string;
  provider?: PaymentProvider;
  initPoint: string;
}

export interface PaymentDetail {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'IN_PROCESS';
  type: 'SUBSCRIPTION_MONTHLY' | 'SUBSCRIPTION_ANNUAL' | 'ONE_TIME_COURSE' | 'ONE_TIME_CATEGORY';
  amount: number | string;
  currency: string;
  provider?: PaymentProvider;
  createdAt: string;
}

export const paymentsApi = {
  checkoutCourse: (courseId: string, provider: PaymentProvider = 'MERCADOPAGO', couponCode?: string) =>
    api.post<{ data: CheckoutResponse }>(`/payments/checkout/course/${courseId}`, { provider, couponCode }),
  checkoutCategory: (categoryId: string, provider: PaymentProvider = 'MERCADOPAGO', couponCode?: string) =>
    api.post<{ data: CheckoutResponse }>(`/payments/checkout/category/${categoryId}`, { provider, couponCode }),
  subscribe: (plan: 'MONTHLY' | 'ANNUAL', provider: PaymentProvider = 'MERCADOPAGO', couponCode?: string) =>
    api.post<{ data: CheckoutResponse }>(`/payments/subscribe`, { plan, provider, couponCode }),
  getPayment: (id: string) => api.get<{ data: PaymentDetail }>(`/payments/${id}`),
  simulateApprove: (id: string) => api.post<{ data: PaymentDetail }>(`/payments/simulate/approve/${id}`),
  simulateSubscription: (id: string) => api.post(`/payments/simulate/subscription/${id}`),
  capturePaypal: (paymentId: string) => api.post<{ data: PaymentDetail }>(`/payments/paypal/capture/${paymentId}`),
  syncPaypalSubscription: (subscriptionId: string) => api.post(`/payments/paypal/sync-subscription/${subscriptionId}`),
};

export interface ValidatedCoupon {
  code: string;
  discountAmount: number;
  finalAmount: number;
  couponId: string;
}

export const couponsApi = {
  validate: (code: string, context: 'COURSE' | 'CATEGORY' | 'PLAN', baseAmount: number) =>
    api.post<{ data: ValidatedCoupon }>('/coupons/validate', { code, context, baseAmount }),
};

export interface PublicPlan {
  id: string;
  key: 'SUBSCRIPTION_MONTHLY' | 'SUBSCRIPTION_ANNUAL';
  label: string;
  price: number | string;
  comparePrice: number | string | null;
  currency: string;
  badge: string | null;
  savings: string | null;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export const plansApi = {
  list: () => api.get<{ data: PublicPlan[] }>('/plans'),
};

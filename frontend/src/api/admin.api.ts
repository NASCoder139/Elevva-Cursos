import api from './axios';

export interface AdminStats {
  totals: {
    users: number;
    courses: number;
    publishedCourses: number;
    lessons: number;
    activeSubs: number;
    approvedPayments: number;
    revenue: number;
  };
  chart: { date: string; revenue: number }[];
  paymentsByProvider: { mercadopago: number; paypal: number };
  paymentStats: { total: number; approved: number; pending: number; rejected: number };
  newUsersWeek: number;
  usersChart: { date: string; day: string; count: number }[];
  recentPayments: any[];
  recentUsers: any[];
  popularCourses: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    enrollments: number;
    revenue: number;
  }[];
  usersByCountry: { country: string; count: number }[];
}

export const adminApi = {
  stats: (days?: number) => api.get<{ data: AdminStats }>('/admin/stats', { params: { days } }),

  courses: {
    list: (q?: string) => api.get<{ data: any[] }>('/admin/courses', { params: { q } }),
    get: (id: string) => api.get<{ data: any }>(`/admin/courses/${id}`),
    create: (data: any) => api.post<{ data: any }>('/admin/courses', data),
    update: (id: string, data: any) => api.patch<{ data: any }>(`/admin/courses/${id}`, data),
    remove: (id: string) => api.delete(`/admin/courses/${id}`),
  },
  modules: {
    create: (data: any) => api.post<{ data: any }>('/admin/modules', data),
    update: (id: string, data: any) => api.patch(`/admin/modules/${id}`, data),
    remove: (id: string) => api.delete(`/admin/modules/${id}`),
  },
  lessons: {
    create: (data: any) => api.post<{ data: any }>('/admin/lessons', data),
    update: (id: string, data: any) => api.patch(`/admin/lessons/${id}`, data),
    remove: (id: string) => api.delete(`/admin/lessons/${id}`),
  },
  categories: {
    list: () => api.get<{ data: any[] }>('/admin/categories'),
    create: (data: any) => api.post('/admin/categories', data),
    update: (id: string, data: any) => api.patch(`/admin/categories/${id}`, data),
    remove: (id: string) => api.delete(`/admin/categories/${id}`),
  },
  users: {
    list: (q?: string) => api.get<{ data: AdminUserRow[] }>('/admin/users', { params: { q } }),
    get: (id: string) => api.get<{ data: AdminUserDetail }>(`/admin/users/${id}`),
    update: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
    remove: (id: string) => api.delete(`/admin/users/${id}`),
  },
  payments: {
    list: (status?: string) => api.get<{ data: any[] }>('/admin/payments', { params: { status } }),
  },
  interests: {
    list: () => api.get<{ data: any[] }>('/admin/interests'),
    create: (data: any) => api.post('/admin/interests', data),
    remove: (id: string) => api.delete(`/admin/interests/${id}`),
  },
  tags: {
    list: () => api.get<{ data: any[] }>('/admin/tags'),
    create: (data: any) => api.post('/admin/tags', data),
    remove: (id: string) => api.delete(`/admin/tags/${id}`),
  },
  plans: {
    list: () => api.get<{ data: AdminPlan[] }>('/admin/plans'),
    update: (id: string, data: Partial<AdminPlan>) => api.patch<{ data: AdminPlan }>(`/admin/plans/${id}`, data),
    seedDefaults: () => api.post<{ data: AdminPlan[] }>('/admin/plans/seed-defaults'),
  },
  coupons: {
    list: () => api.get<{ data: AdminCoupon[] }>('/admin/coupons'),
    create: (data: CreateCouponPayload) => api.post<{ data: AdminCoupon }>('/admin/coupons', data),
    update: (id: string, data: Partial<CreateCouponPayload>) =>
      api.patch<{ data: AdminCoupon }>(`/admin/coupons/${id}`, data),
    remove: (id: string) => api.delete(`/admin/coupons/${id}`),
  },
  siteSettings: {
    get: () => api.get<{ data: AdminSiteSettings }>('/admin/site-settings'),
    updateRibbon: (data: Partial<AdminSiteSettings>) =>
      api.patch<{ data: AdminSiteSettings }>('/admin/promo-ribbon', data),
    updatePlansPromo: (data: { plansPromoEnabled?: boolean; plansPromoEndsAt?: string | null }) =>
      api.patch<{ data: AdminSiteSettings }>('/admin/plans-promo', data),
  },
};

export interface AdminSiteSettings {
  id: string;
  plansPromoEnabled: boolean;
  plansPromoEndsAt: string | null;
  promoRibbonEnabled: boolean;
  promoRibbonText: string;
  promoRibbonSecondaryText: string | null;
  promoRibbonShowCountdown: boolean;
  promoRibbonCtaText: string | null;
  promoRibbonCtaUrl: string | null;
  updatedAt: string;
}

export interface AdminPlan {
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

export type CouponDiscountType = 'PERCENT' | 'FIXED';
export type CouponScope = 'ALL' | 'COURSES' | 'PLANS' | 'CATEGORIES';

export interface AdminCoupon {
  id: string;
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  value: number | string;
  scope: CouponScope;
  validFrom: string | null;
  validUntil: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  value: number;
  scope?: CouponScope;
  validFrom?: string | null;
  validUntil?: string | null;
  usageLimit?: number | null;
  isActive?: boolean;
}

// ─── Users ───────────────────────────────────────────────────────────────
export type AdminPaymentType =
  | 'SUBSCRIPTION_MONTHLY'
  | 'SUBSCRIPTION_ANNUAL'
  | 'ONE_TIME_COURSE'
  | 'ONE_TIME_CATEGORY';

export type AdminPaymentStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'REFUNDED'
  | 'IN_PROCESS';

export type AdminSubscriptionStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PENDING';

export interface AdminUserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  country: string | null;
  role: 'ADMIN' | 'USER';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  subscription: {
    status: AdminSubscriptionStatus;
    plan: AdminPaymentType;
    currentPeriodEnd: string | null;
  } | null;
  _count: { purchases: number; favorites: number; payments: number };
}

export interface AdminUserPayment {
  id: string;
  type: AdminPaymentType;
  amount: number | string;
  currency: string;
  status: AdminPaymentStatus;
  provider: 'MERCADOPAGO' | 'PAYPAL';
  couponCode: string | null;
  discountAmount: number | string | null;
  createdAt: string;
  purchase: {
    id: string;
    course: { id: string; title: string; thumbnailUrl: string | null } | null;
    category: { id: string; name: string } | null;
  } | null;
}

export interface AdminUserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  country: string | null;
  role: 'ADMIN' | 'USER';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  subscription: {
    id: string;
    provider: 'MERCADOPAGO' | 'PAYPAL';
    plan: AdminPaymentType;
    status: AdminSubscriptionStatus;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelledAt: string | null;
    createdAt: string;
  } | null;
  payments: AdminUserPayment[];
  stats: {
    totalSpent: number;
    courseCount: number;
    subscriptionCount: number;
    daysAsCustomer: number;
    paymentCount: number;
    approvedCount: number;
  };
}

import { useCallback, useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import type { Course } from '../types/course.types';

export interface AccessData {
  hasSubscription: boolean;
  subscriptionPlan: string | null;
  purchasedCourseIds: string[];
  purchasedCategoryIds: string[];
  accessibleCourseIds: string[] | 'ALL';
  myCourses: Course[];
}

export function useAccess() {
  const [data, setData] = useState<AccessData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAccess();
      setData((res.data as any).data || res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasAccess = useCallback(
    (courseId: string) => {
      if (!data) return false;
      if (data.hasSubscription) return true;
      if (data.accessibleCourseIds === 'ALL') return true;
      return data.accessibleCourseIds.includes(courseId);
    },
    [data],
  );

  const getAccessType = useCallback(
    (courseId: string): 'MONTHLY' | 'ANNUAL' | 'PURCHASED' | null => {
      if (!data) return null;
      // Individual purchase takes priority — it's permanent
      if (data.purchasedCourseIds.includes(courseId)) return 'PURCHASED';
      // Category purchase is also permanent
      if (!data.hasSubscription && data.accessibleCourseIds !== 'ALL' && data.accessibleCourseIds.includes(courseId)) return 'PURCHASED';
      // Subscription access
      if (data.hasSubscription) {
        return data.subscriptionPlan === 'SUBSCRIPTION_ANNUAL' ? 'ANNUAL' : 'MONTHLY';
      }
      return null;
    },
    [data],
  );

  return {
    ...data,
    loading,
    hasAccess,
    getAccessType,
    myCourses: data?.myCourses || [],
    refresh,
  };
}

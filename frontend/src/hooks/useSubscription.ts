import { useCallback, useEffect, useState } from 'react';
import { subscriptionsApi, type SubscriptionData } from '../api/subscriptions.api';

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriptionsApi.getCurrent();
      setSubscription(res.data.data);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { subscription, loading, refresh };
}

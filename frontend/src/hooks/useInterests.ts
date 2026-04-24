import { useEffect, useState } from 'react';
import { usersApi } from '../api/users.api';
import type { Interest } from '../types/user.types';

export function useInterests() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    usersApi
      .getInterests()
      .then((res) => {
        if (mounted) setInterests(res.data.data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { interests, loading };
}

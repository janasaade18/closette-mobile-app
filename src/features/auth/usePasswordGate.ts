import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useAuth } from './AuthContext';

export function usePasswordGate() {
  const router = useRouter();
  const { loading, profile } = useAuth();

  useEffect(() => {
    if (!loading && profile?.must_change_password) {
      router.replace('/change-password');
    }
  }, [loading, profile?.must_change_password, router]);
}

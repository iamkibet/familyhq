import { useEffect } from 'react';
import { useAuthStore } from '@/src/stores/authStore';

/**
 * Hook to initialize auth state on app mount
 */
export function useAuthInit() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
}


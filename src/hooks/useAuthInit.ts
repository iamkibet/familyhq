import { useEffect } from 'react';
import { useAuthStore } from '@/src/stores/authStore';
import { useCurrencyStore } from '@/src/stores/currencyStore';

/**
 * Hook to initialize auth state and currency preference on app mount
 */
export function useAuthInit() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const initializeCurrency = useCurrencyStore((state) => state.initializeCurrency);

  useEffect(() => {
    // Initialize auth and currency in parallel
    initializeAuth();
    initializeCurrency();
  }, [initializeAuth, initializeCurrency]);
}


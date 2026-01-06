import { useCurrencyStore } from '@/src/stores/currencyStore';
import { formatCurrency as formatCurrencyUtil } from '@/src/utils';

/**
 * Hook to format currency using the selected currency from the store
 */
export function useFormatCurrency() {
  const { currency } = useCurrencyStore();
  
  return (amount: number): string => {
    // Pass the currency symbol as fallback in case formatting fails
    return formatCurrencyUtil(amount, currency.code, currency.locale, currency.symbol);
  };
}


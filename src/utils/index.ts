/**
 * Generate a random invite code for family
 */
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Format currency
 * @param amount - The amount to format
 * @param currencyCode - Optional currency code (e.g., 'USD', 'EUR'). If not provided, defaults to USD
 * @param locale - Optional locale string (e.g., 'en-US', 'en-GB'). If not provided, defaults to 'en-US'
 * 
 * Note: For React components, use the `useFormatCurrency` hook instead to automatically use the selected currency.
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD', locale: string = 'en-US', fallbackSymbol?: string): string {
  try {
    // Try to format with the provided locale
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
    return formatted;
  } catch (error) {
    // If formatting fails, try with a more generic locale based on currency code
    try {
      // Map currency codes to common locales if the provided locale fails
      const localeMap: Record<string, string> = {
        'EUR': 'de-DE',
        'GBP': 'en-GB',
        'JPY': 'ja-JP',
        'CNY': 'zh-CN',
        'INR': 'en-IN',
        'AUD': 'en-AU',
        'CAD': 'en-CA',
        'CHF': 'de-CH',
        'SEK': 'sv-SE',
        'NOK': 'nb-NO',
        'DKK': 'da-DK',
        'PLN': 'pl-PL',
        'RUB': 'ru-RU',
        'BRL': 'pt-BR',
        'MXN': 'es-MX',
        'ZAR': 'en-ZA',
        'KRW': 'ko-KR',
        'SGD': 'en-SG',
        'HKD': 'en-HK',
        'NZD': 'en-NZ',
        'TRY': 'tr-TR',
        'AED': 'ar-AE',
        'SAR': 'ar-SA',
        'KES': 'en-KE',
        'NGN': 'en-NG',
        'EGP': 'ar-EG',
      };
      
      const fallbackLocale = localeMap[currencyCode] || 'en-US';
      return new Intl.NumberFormat(fallbackLocale, {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch (fallbackError) {
      // Last resort: use fallback symbol or default to USD symbol
      console.warn('Currency formatting failed, using manual format:', fallbackError);
      if (fallbackSymbol) {
        // Use the provided symbol with manual formatting
        return `${fallbackSymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      // Final fallback to USD
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date for input (YYYY-MM-DD)
 */
export function formatDateForInput(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is past
 */
export function isPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Format relative time (e.g., "Just now", "5 minutes ago", "Yesterday", "Jan 3, 2024")
 */
export function formatRelativeTime(timestamp: { toMillis: () => number } | Date | string | null | undefined): string {
  // Handle null/undefined
  if (!timestamp) {
    return 'Unknown date';
  }

  let date: Date;
  
  try {
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp && typeof timestamp.toMillis === 'function') {
      // Firestore Timestamp
      date = new Date(timestamp.toMillis());
    } else {
      return 'Unknown date';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
  } catch (error) {
    console.warn('Error formatting relative time:', error);
    return 'Unknown date';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else {
    // For anything older than yesterday, show the actual date
    return formatDate(date);
  }
}

/**
 * Time period types for budget filtering
 */
export type TimePeriod = 'thisWeek' | 'thisMonth' | 'lastMonth' | 'allTime';

/**
 * Get date range for a time period
 */
export function getTimePeriodRange(period: TimePeriod): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let start: Date;
  let end: Date = new Date(today);
  end.setHours(23, 59, 59, 999); // End of today

  switch (period) {
    case 'thisWeek': {
      // Start of this week (Sunday)
      const dayOfWeek = today.getDay();
      start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'thisMonth': {
      // Start of current calendar month (1st day of month at 00:00:00)
      // Budgets are monthly, so this represents the current month's budget period
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      // End is last day of current month at 23:59:59
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'lastMonth': {
      // Start of last month
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      start = new Date(lastMonth);
      start.setHours(0, 0, 0, 0);
      // End of last month
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'allTime':
    default: {
      // All time - use a very old date
      start = new Date(0);
      break;
    }
  }

  return { start, end };
}

/**
 * Check if a timestamp falls within a time period
 */
export function isWithinTimePeriod(
  timestamp: { toMillis: () => number } | Date | string | null | undefined,
  period: TimePeriod
): boolean {
  if (!timestamp) return false;

  let date: Date;
  
  try {
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (timestamp && typeof timestamp.toMillis === 'function') {
      date = new Date(timestamp.toMillis());
    } else {
      return false;
    }

    if (isNaN(date.getTime())) {
      return false;
    }
  } catch (error) {
    return false;
  }

  const { start, end } = getTimePeriodRange(period);
  return date >= start && date <= end;
}

/**
 * Get display label for time period
 */
export function getTimePeriodLabel(period: TimePeriod): string {
  switch (period) {
    case 'thisWeek':
      return 'This Week';
    case 'thisMonth':
      return 'This Month';
    case 'lastMonth':
      return 'Last Month';
    case 'allTime':
      return 'All Time';
    default:
      return 'All Time';
  }
}

/**
 * Check if a date string (YYYY-MM-DD) falls within a date range
 */
export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set time to start/end of day for proper comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  checkDate.setHours(0, 0, 0, 0);
  
  return checkDate >= start && checkDate <= end;
}

/**
 * Check if a budget category is currently active (today is within the budget period)
 */
export function isBudgetActive(startDate: string, endDate: string): boolean {
  const today = formatDateForInput(new Date());
  return isDateInRange(today, startDate, endDate);
}

/**
 * Check if a date is before another date
 */
export function isDateBefore(date1: string, date2: string): boolean {
  return new Date(date1) < new Date(date2);
}

/**
 * Get the number of days between two dates
 */
export function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
}


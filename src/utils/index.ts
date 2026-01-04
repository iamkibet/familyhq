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
export function formatCurrency(amount: number, currencyCode: string = 'USD', locale: string = 'en-US'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    // Fallback to USD if locale/currency is invalid
    console.warn('Invalid currency format, falling back to USD:', error);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
 * Format relative time (e.g., "2 days ago", "Just now", "Created on Jan 3, 2024")
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
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    // For older dates, show the actual date
    return `Created ${formatDate(date)}`;
  }
}


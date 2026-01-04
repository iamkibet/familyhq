import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme, Appearance } from 'react-native';
import { useThemeStore } from '@/src/stores/themeStore';

/**
 * Custom hook that respects user's theme preference
 * Falls back to system theme if 'auto' is selected
 */
export function useThemeScheme() {
  const systemColorScheme = useRNColorScheme();
  const { colorScheme: userPreference, initializeTheme, getEffectiveTheme } = useThemeStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    initializeTheme();
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (hasHydrated) {
      const effectiveTheme = getEffectiveTheme();
      setCurrentTheme(effectiveTheme);
    }
  }, [hasHydrated, userPreference, systemColorScheme, getEffectiveTheme]);

  // Listen to system theme changes when auto is enabled
  useEffect(() => {
    if (userPreference === 'auto' && hasHydrated) {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        setCurrentTheme(colorScheme ?? 'light');
      });
      return () => subscription.remove();
    }
  }, [userPreference, hasHydrated]);

  if (!hasHydrated) {
    return 'light';
  }

  return currentTheme;
}


import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SystemUI from 'expo-system-ui';
import { Appearance, Platform } from 'react-native';

const isEdgeToEdge = Platform.OS === 'android' && Constants.expoConfig?.android?.edgeToEdgeEnabled === true;

type ColorScheme = 'light' | 'dark' | 'auto';

interface ThemeState {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
  initializeTheme: () => Promise<void>;
  getEffectiveTheme: () => 'light' | 'dark';
}

const THEME_STORAGE_KEY = '@familyhq_theme_preference';

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: 'auto',

  getEffectiveTheme: () => {
    const { colorScheme } = get();
    if (colorScheme === 'auto') {
      return Appearance.getColorScheme() ?? 'light';
    }
    return colorScheme;
  },

  initializeTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
        set({ colorScheme: savedTheme as ColorScheme });
        await applyTheme(savedTheme as ColorScheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  },

  setColorScheme: async (scheme: ColorScheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
      set({ colorScheme: scheme });
      await applyTheme(scheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  },
}));

async function applyTheme(scheme: ColorScheme) {
  if (isEdgeToEdge) return; // setBackgroundColorAsync not supported with edge-to-edge
  try {
    if (scheme === 'auto') {
      await SystemUI.setBackgroundColorAsync('transparent');
    } else {
      const backgroundColor = scheme === 'dark' ? '#1C1B1F' : '#FFFFFF';
      await SystemUI.setBackgroundColorAsync(backgroundColor);
    }
  } catch (error) {
    console.warn('Could not set system UI background:', error);
  }
}


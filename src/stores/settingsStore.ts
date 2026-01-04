import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacySettings {
  shareData: boolean;
  analytics: boolean;
  crashReports: boolean;
}

interface SettingsState {
  privacySettings: PrivacySettings;
  loadPrivacySettings: () => Promise<void>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
}

const PRIVACY_SETTINGS_KEY = '@familyhq_privacy_settings';

const defaultPrivacySettings: PrivacySettings = {
  shareData: false,
  analytics: true,
  crashReports: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  privacySettings: defaultPrivacySettings,

  loadPrivacySettings: async () => {
    try {
      const saved = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        set({ privacySettings: { ...defaultPrivacySettings, ...parsed } });
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    }
  },

  updatePrivacySettings: async (settings: Partial<PrivacySettings>) => {
    try {
      const updated = { ...get().privacySettings, ...settings };
      await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(updated));
      set({ privacySettings: updated });
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
    }
  },
}));


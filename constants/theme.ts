/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Material Design 3 inspired colors
const tintColorLight = '#0a7ea4'; // Primary blue
const tintColorDark = '#4FC3F7'; // Light blue for dark mode

export const Colors = {
  light: {
    text: '#1C1B1F', // Material Design 3 on-surface
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#49454F', // Material Design 3 on-surface-variant
    tabIconDefault: '#79747E', // Material Design 3 outline
    tabIconSelected: tintColorLight,
    tabBarBackground: '#FFFFFF',
    tabBarBorder: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    text: '#E6E1E5', // Material Design 3 on-surface
    background: '#1C1B1F',
    tint: tintColorDark,
    icon: '#CAC4D0', // Material Design 3 on-surface-variant
    tabIconDefault: '#938F99', // Material Design 3 outline
    tabIconSelected: tintColorDark,
    tabBarBackground: '#1E1E1E',
    tabBarBorder: 'rgba(255, 255, 255, 0.1)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

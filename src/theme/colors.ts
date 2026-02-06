/**
 * Design system: color palette.
 * Primary = main brand/CTA; Secondary = accents; Neutrals for text/surfaces.
 * Contrast chosen for accessibility (WCAG AA where applicable).
 */
export const colors = {
  light: {
    primary: '#0D47A1',
    primaryContrast: '#FFFFFF',
    secondary: '#1565C0',
    secondaryContrast: '#FFFFFF',
    neutral: {
      900: '#1C1B1F',
      700: '#49454F',
      500: '#79747E',
      300: '#938F99',
      100: '#E6E1E5',
      50: '#F5F5F6',
    },
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F7FA',
    surfaceTertiary: '#FAFBFC',
    background: '#F5F7FA',
    foreground: '#1C1B1F',
    muted: '#79747E',
    border: 'rgba(0,0,0,0.08)',
    borderStrong: 'rgba(0,0,0,0.12)',
    error: '#B3261E',
    success: '#2E7D32',
    warning: '#ED6C02',
  },
  dark: {
    primary: '#4FC3F7',
    primaryContrast: '#0D1117',
    secondary: '#81D4FA',
    secondaryContrast: '#0D1117',
    neutral: {
      900: '#E6E1E5',
      700: '#CAC4D0',
      500: '#938F99',
      300: '#79747E',
      100: '#49454F',
      50: '#2C2C2E',
    },
    surface: '#1C1B1F',
    surfaceSecondary: '#0D1117',
    surfaceTertiary: '#161B22',
    background: '#0D1117',
    foreground: '#E6E1E5',
    muted: '#938F99',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.12)',
    error: '#F2B8B5',
    success: '#81C784',
    warning: '#FFB74D',
  },
} as const;

export type ColorScheme = keyof typeof colors;

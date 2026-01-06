export type WebThemeShape = {
  colors: {
    bg: string;
    surface: string;
    surface2: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    primary2: string;
    warning: string;
    danger: string;
    success: string;
  };
  radius: {
    md: number;
    lg: number;
  };
  shadow: {
    card: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
};

export const DarkWebTheme: WebThemeShape = {
  colors: {
    bg: '#0B1220',
    surface: '#0F1B33',
    surface2: '#122146',
    text: '#EAF0FF',
    textMuted: 'rgba(234, 240, 255, 0.72)',
    border: 'rgba(234, 240, 255, 0.12)',
    primary: '#4FC3F7',
    primary2: '#0a7ea4',
    warning: '#FFB020',
    danger: '#FF5A5F',
    success: '#2DD4BF',
  },
  radius: {
    md: 14,
    lg: 18,
  },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 22,
      elevation: 10,
    },
  },
};

export const LightWebTheme: WebThemeShape = {
  colors: {
    bg: '#FFFFFF',
    surface: '#FFFFFF',
    surface2: '#F4F7FB',
    text: '#101828',
    textMuted: 'rgba(16, 24, 40, 0.72)',
    border: 'rgba(16, 24, 40, 0.12)',
    primary: '#0a7ea4',
    primary2: '#4FC3F7',
    warning: '#B7791F',
    danger: '#E11D48',
    success: '#0EA5A4',
  },
  radius: {
    md: 14,
    lg: 18,
  },
  shadow: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  },
};

export function getWebTheme(mode: 'light' | 'dark'): WebThemeShape {
  return mode === 'dark' ? DarkWebTheme : LightWebTheme;
}



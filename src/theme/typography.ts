/**
 * Design system: type scale.
 * Heading = hero/section; Subheading = card titles; Body = content; Caption = labels/metadata.
 */
export const typography = {
  /** Large hero or screen title */
  heading: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  /** Section titles */
  headingSmall: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.35,
    lineHeight: 26,
  },
  /** Card titles, list headers */
  subheading: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  /** Primary body text */
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  /** Small labels, captions, metadata */
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  captionSmall: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    sm: 18,
    md: 22,
    lg: 26,
  },
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  sm: 18,
  md: 22,
  lg: 26,
} as const;

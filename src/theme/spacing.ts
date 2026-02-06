/**
 * Layout: grid and spacing.
 * Base unit 4px; sections use 16/24 for rhythm.
 */
export const spacing = {
  /** Base unit */
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  /** Screen horizontal padding */
  screenHorizontal: 24,
  /** Section vertical rhythm */
  sectionGap: 24,
  /** Between related items */
  itemGap: 12,
} as const;

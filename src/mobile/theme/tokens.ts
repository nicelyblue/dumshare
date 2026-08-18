/**
 * Light mode color tokens
 * Primary palette for light theme (backgrounds are light, text is dark)
 */
export type ColorTokens = {
  appBackground: string;
  groupedSurface: string;
  card: string;
  inputBackground: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  accent: string;
  accentForeground: string;
  accentAlt: string;
  subtleSurface: string;
  subtleBorder: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  scrim: string;
  inverse: string;
  inverseSoft: string;
  inverseBorder: string;
  inverseMuted: string;
  inverseSecondary: string;
  mutedSubtleText: string;
};

export const lightColorTokens = {
  appBackground: '#F6F7F8',
  groupedSurface: '#E9ECEF',
  card: '#FFFFFF',
  inputBackground: '#FFFFFF',
  border: '#C9CED3',
  textPrimary: '#1D2329',
  textSecondary: '#3D464F',
  textMuted: '#5D6872',
  primary: '#365F7D',
  accent: '#365F7D',
  accentForeground: '#FFFFFF',
  accentAlt: '#DCE7EF',
  subtleSurface: '#F0F2F4',
  subtleBorder: '#DDE1E5',
  destructive: '#B33A3A',
  destructiveForeground: '#FFFFFF',
  success: '#347353',
  successForeground: '#FFFFFF',
  scrim: 'rgba(20, 26, 31, 0.42)',
  // Legacy aliases for backward compatibility
  inverse: '#000000',
  inverseSoft: '#101114',
  inverseBorder: '#333845',
  inverseMuted: '#9B9EA7',
  inverseSecondary: '#B3B5BE',
  mutedSubtleText: '#A09DAE',
} as const satisfies ColorTokens;

/**
 * Dark mode color tokens
 * Inverse palette for dark theme (backgrounds are dark, text is light)
 * Carefully tuned for readability and visual hierarchy
 */
export const darkColorTokens = {
  appBackground: '#111519',
  groupedSurface: '#20262B',
  card: '#191E23',
  inputBackground: '#20262B',
  border: '#394149',
  textPrimary: '#F2F4F5',
  textSecondary: '#D1D6DA',
  textMuted: '#AEB7BE',
  primary: '#A9C5D8',
  accent: '#A9C5D8',
  accentForeground: '#142532',
  accentAlt: '#293C49',
  subtleSurface: '#20262B',
  subtleBorder: '#30373E',
  destructive: '#E77A7A',
  destructiveForeground: '#2D1111',
  success: '#75C69A',
  successForeground: '#10271B',
  scrim: 'rgba(0, 0, 0, 0.5)',
  // Legacy aliases for backward compatibility
  inverse: '#FFFFFF',
  inverseSoft: '#F5F4F8',
  inverseBorder: '#C5C0D0',
  inverseMuted: '#8F8A9A',
  inverseSecondary: '#A89FB5',
  mutedSubtleText: '#8F8A9A',
} as const satisfies ColorTokens;

/**
 * Default export for backward compatibility (light mode)
 */
export const colorTokens = lightColorTokens;

/**
 * Get color tokens for a specific theme
 */
export function getColorTokensByTheme(
  theme: 'light' | 'dark'
): ColorTokens {
  return theme === 'light' ? lightColorTokens : darkColorTokens;
}

export const spacingTokens = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  x2l: 32,
  x3l: 48,
} as const;

export const radiusTokens = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const elevationTokens = {
  card: 1,
  popover: 3,
} as const;

export const touchTarget = {
  minimum: 44,
} as const;

export const shellLayoutTokens = {
  tabBarHeight: 64,
} as const;

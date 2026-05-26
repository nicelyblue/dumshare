/**
 * Light mode color tokens
 * Primary palette for light theme (backgrounds are light, text is dark)
 */
export const lightColorTokens = {
  appBackground: '#F8F7FA',
  groupedSurface: '#DFD9EC',
  card: '#FFFFFF',
  inputBackground: '#EAE7F0',
  border: '#CEC9D9',
  textPrimary: '#3D3C4F',
  textSecondary: '#6B6880',
  textMuted: '#A09DAE',
  accent: '#8A79AB',
  accentAlt: '#E6A5B8',
  subtleSurface: '#F1F0F4',
  subtleBorder: '#ECEAF2',
  destructive: '#D95C5C',
  success: '#4F9C77',
  scrim: 'rgba(61, 60, 79, 0.3)',
  // Legacy aliases for backward compatibility
  inverse: '#000000',
  inverseSoft: '#101114',
  inverseBorder: '#333845',
  inverseMuted: '#9B9EA7',
  inverseSecondary: '#B3B5BE',
  mutedSubtleText: '#A09DAE',
} as const;

/**
 * Dark mode color tokens
 * Inverse palette for dark theme (backgrounds are dark, text is light)
 * Carefully tuned for readability and visual hierarchy
 */
export const darkColorTokens = {
  appBackground: '#0D0C14',
  groupedSurface: '#1A1922',
  card: '#16151D',
  inputBackground: '#1F1E27',
  border: '#2F2D37',
  textPrimary: '#F5F4F8',
  textSecondary: '#C5C0D0',
  textMuted: '#8F8A9A',
  accent: '#B49DC8',
  accentAlt: '#E6A5B8',
  subtleSurface: '#1F1E27',
  subtleBorder: '#2A2833',
  destructive: '#FF6B6B',
  success: '#5ECB7F',
  scrim: 'rgba(0, 0, 0, 0.5)',
  // Legacy aliases for backward compatibility
  inverse: '#FFFFFF',
  inverseSoft: '#F5F4F8',
  inverseBorder: '#C5C0D0',
  inverseMuted: '#8F8A9A',
  inverseSecondary: '#A89FB5',
  mutedSubtleText: '#8F8A9A',
} as const;

/**
 * Default export for backward compatibility (light mode)
 */
export const colorTokens = lightColorTokens;

/**
 * Get color tokens for a specific theme
 */
export function getColorTokensByTheme(
  theme: 'light' | 'dark'
): typeof lightColorTokens {
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

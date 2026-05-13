export const colorTokens = {
  appBackground: '#F8F7FA',
  groupedSurface: '#DFD9EC',
  card: '#FFFFFF',
  inputBackground: '#EAE7F0',
  border: '#CEC9D9',
  textPrimary: '#3D3C4F',
  textMuted: '#6B6880',
  accent: '#8A79AB',
  accentAlt: '#E6A5B8',
  inverse: '#000000',
  destructive: '#D95C5C',
  success: '#4F9C77',
} as const;

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

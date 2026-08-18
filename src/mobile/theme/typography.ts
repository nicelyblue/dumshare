import type { TextStyle } from 'react-native';

export const typographyTokens = {
  body: {
    fontSize: 16,
    lineHeight: 23,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600' as const,
  },
  heading: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700' as const,
  },
  display: {
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '700' as const,
  },
  sectionLabel: {
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    fontWeight: '700' as const,
  },
  money: {
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },
} as const;

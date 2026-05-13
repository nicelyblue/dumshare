import { colorTokens } from './tokens';

export const typographyTokens = {
  body: {
    fontSize: 16,
    lineHeight: 23,
    color: colorTokens.textPrimary,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600' as const,
    color: colorTokens.textMuted,
  },
  heading: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700' as const,
    color: colorTokens.textPrimary,
  },
  display: {
    fontSize: 32,
    lineHeight: 35,
    fontWeight: '700' as const,
    color: colorTokens.textPrimary,
  },
  sectionLabel: {
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    fontWeight: '700' as const,
    color: colorTokens.textMuted,
  },
  money: {
    fontVariant: ['tabular-nums'] as const,
  },
} as const;

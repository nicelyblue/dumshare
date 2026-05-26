import { radiusTokens, spacingTokens } from './tokens';

export const layoutTokens = {
  screenPadding: spacingTokens.lg,
  screenPaddingCompact: spacingTokens.md,
  cardPadding: spacingTokens.lg,
  sectionGap: spacingTokens.xl,
  itemGap: spacingTokens.md,
  cardRadius: radiusTokens.md,
  formBottomBarReserve: 112,
  contentMaxCompact: 640,
  contentMaxMedium: 860,
  contentMaxExpanded: 1120,
} as const;

export function getResponsiveMaxWidth(width: number): number {
  if (width >= 1200) {
    return layoutTokens.contentMaxExpanded;
  }
  if (width >= 840) {
    return layoutTokens.contentMaxMedium;
  }
  return layoutTokens.contentMaxCompact;
}

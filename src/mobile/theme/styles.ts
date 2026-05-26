/**
 * Unified style composition utilities
 * Central place for reusable style patterns that ensure coherence across the app
 * Reduces duplication and makes design system changes systematic
 */

import { StyleSheet, useWindowDimensions } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens, touchTarget, elevationTokens } from './tokens';
import { typographyTokens } from './typography';

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

/**
 * Responsive breakpoints for adaptive layouts
 * Aligns with Android window size class recommendations
 */
export const breakpoints = {
  compact: 600, // phones in portrait
  medium: 840, // tablets or phones in landscape
  expanded: 1200, // large tablets
} as const;

export function useWindowClass() {
  const { width } = useWindowDimensions();
  if (width < breakpoints.compact) return 'compact' as const;
  if (width < breakpoints.medium) return 'medium' as const;
  return 'expanded' as const;
}

export function getMaxContentWidth(windowClass: ReturnType<typeof useWindowClass>): number {
  if (windowClass === 'compact') return 600;
  if (windowClass === 'medium') return 840;
  return 1200;
}

// ============================================================================
// CARD STYLES
// ============================================================================

export const cardStyles = StyleSheet.create({
  // Standard card with border
  standard: {
    backgroundColor: colorTokens.card,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: colorTokens.border,
    padding: spacingTokens.lg,
  },
  // Card with larger border radius for more prominent appearance
  prominent: {
    backgroundColor: colorTokens.card,
    borderRadius: radiusTokens.lg,
    borderWidth: 1,
    borderColor: colorTokens.border,
    padding: spacingTokens.lg,
  },
  // Grouped surface card (lighter background)
  grouped: {
    backgroundColor: colorTokens.groupedSurface,
    borderRadius: radiusTokens.md,
    padding: spacingTokens.lg,
  },
  // Minimal card with no border, just background
  flat: {
    backgroundColor: colorTokens.card,
    borderRadius: radiusTokens.md,
    padding: spacingTokens.lg,
  },
  // Subtle surface card for nested content
  subtle: {
    backgroundColor: colorTokens.subtleSurface,
    borderRadius: radiusTokens.md,
    padding: spacingTokens.md,
  },
});

// ============================================================================
// BUTTON STYLES
// ============================================================================

export const buttonStyles = StyleSheet.create({
  // Primary action button
  primary: {
    minHeight: touchTarget.minimum,
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.md,
  },
  // Secondary action button (outlined)
  secondary: {
    minHeight: touchTarget.minimum,
    backgroundColor: colorTokens.card,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: colorTokens.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.md,
  },
  // Tertiary button (minimal, text-based)
  tertiary: {
    minHeight: touchTarget.minimum,
    backgroundColor: 'transparent',
    borderRadius: radiusTokens.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.md,
  },
  // Destructive button
  destructive: {
    minHeight: touchTarget.minimum,
    backgroundColor: colorTokens.destructive,
    borderRadius: radiusTokens.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.md,
  },
  // Success button
  success: {
    minHeight: touchTarget.minimum,
    backgroundColor: colorTokens.success,
    borderRadius: radiusTokens.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.md,
  },
  // Compact button for dense layouts
  compact: {
    minHeight: 36,
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.sm,
  },
  // Icon-only button (square, touchable)
  icon: {
    width: touchTarget.minimum,
    height: touchTarget.minimum,
    borderRadius: radiusTokens.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ============================================================================
// TEXT STYLES
// ============================================================================

export const textStyles = StyleSheet.create({
  // Display/hero text
  display: {
    ...typographyTokens.display,
  },
  // Heading
  heading: {
    ...typographyTokens.heading,
  },
  // Subheading (smaller than heading but larger than body)
  subheading: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    color: colorTokens.textPrimary,
  },
  // Body text (default reading text)
  body: {
    ...typographyTokens.body,
  },
  // Small body text
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    color: colorTokens.textPrimary,
  },
  // Label (emphasized, muted)
  label: {
    ...typographyTokens.label,
  },
  // Section label (uppercase, smaller)
  sectionLabel: {
    ...typographyTokens.sectionLabel,
  },
  // Caption/meta text (small, muted)
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: colorTokens.textMuted,
  },
  // Caption with subtle color (even more muted)
  captionSubtle: {
    fontSize: 12,
    lineHeight: 16,
    color: colorTokens.mutedSubtleText,
  },
  // Money amounts (uses tabular figures)
  money: {
    ...typographyTokens.body,
    ...typographyTokens.money,
    fontWeight: '600' as const,
  },
  // Error/destructive text
  error: {
    color: colorTokens.destructive,
    fontSize: 14,
  },
  // Success text
  success: {
    color: colorTokens.success,
    fontSize: 14,
  },
  // Accent text
  accent: {
    color: colorTokens.accent,
    fontSize: 14,
  },
});

// ============================================================================
// LAYOUT & SPACING PATTERNS
// ============================================================================

export const layoutStyles = StyleSheet.create({
  // Screen wrapper with safe padding
  screen: {
    flex: 1,
    backgroundColor: colorTokens.appBackground,
  },
  // Screen content with consistent padding
  screenContent: {
    padding: spacingTokens.lg,
    gap: spacingTokens.xl,
  },
  // Container for grouped content
  section: {
    gap: spacingTokens.lg,
  },
  // Stack of items with uniform spacing
  stack: {
    gap: spacingTokens.md,
  },
  // Compact stack (smaller gaps)
  stackCompact: {
    gap: spacingTokens.sm,
  },
  // Row layout (horizontal flex)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.md,
  },
  // Spacer between elements in row
  spacer: {
    flex: 1,
  },
  // Divider line
  divider: {
    height: 1,
    backgroundColor: colorTokens.subtleBorder,
  },
  // Divider with inset
  dividerInset: {
    height: 1,
    backgroundColor: colorTokens.subtleBorder,
    marginHorizontal: spacingTokens.lg,
  },
});

// ============================================================================
// LIST & ITEM STYLES
// ============================================================================

export const listStyles = StyleSheet.create({
  // Container for lists
  container: {
    gap: spacingTokens.sm,
  },
  // Standard list item/row
  item: {
    paddingVertical: spacingTokens.md,
    paddingHorizontal: spacingTokens.lg,
    backgroundColor: colorTokens.card,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: colorTokens.border,
  },
  // Item content (when item uses multiple views)
  itemContent: {
    flex: 1,
    gap: spacingTokens.xs,
  },
  // Item label/title
  itemLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colorTokens.textPrimary,
  },
  // Item meta/description
  itemMeta: {
    fontSize: 13,
    color: colorTokens.textMuted,
  },
  // Highlighted list item
  itemHighlighted: {
    borderColor: colorTokens.accent,
    borderWidth: 2,
  },
  // Empty state container
  emptyContainer: {
    paddingVertical: spacingTokens.x2l,
    paddingHorizontal: spacingTokens.lg,
    alignItems: 'center',
    gap: spacingTokens.md,
  },
  // Empty state heading
  emptyHeading: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colorTokens.textPrimary,
  },
  // Empty state description
  emptyDescription: {
    fontSize: 14,
    color: colorTokens.textMuted,
    textAlign: 'center' as const,
  },
});

// ============================================================================
// INPUT FIELD STYLES
// ============================================================================

export const inputStyles = StyleSheet.create({
  // Standard input wrapper
  container: {
    gap: spacingTokens.sm,
  },
  // Input label
  label: {
    ...textStyles.label,
  },
  // Input field itself
  input: {
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.sm,
    backgroundColor: colorTokens.inputBackground,
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    borderColor: colorTokens.subtleBorder,
    fontSize: 16,
    color: colorTokens.textPrimary,
  },
  // Focused input
  inputFocused: {
    borderColor: colorTokens.accent,
    borderWidth: 2,
  },
  // Error input
  inputError: {
    borderColor: colorTokens.destructive,
    borderWidth: 1,
  },
  // Helper/description text
  helper: {
    fontSize: 13,
    color: colorTokens.textMuted,
  },
  // Error message
  errorMessage: {
    fontSize: 13,
    color: colorTokens.destructive,
  },
});

// ============================================================================
// AVATAR & ICON STYLES
// ============================================================================

export const avatarStyles = StyleSheet.create({
  // Large avatar
  large: {
    width: 56,
    height: 56,
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.subtleSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Medium avatar
  medium: {
    width: 48,
    height: 48,
    borderRadius: radiusTokens.sm,
    backgroundColor: colorTokens.subtleSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Small avatar
  small: {
    width: 36,
    height: 36,
    borderRadius: radiusTokens.sm,
    backgroundColor: colorTokens.subtleSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Circular avatar (uses pill radius)
  circular: {
    width: 48,
    height: 48,
    borderRadius: radiusTokens.pill,
    backgroundColor: colorTokens.subtleSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Avatar text/emoji
  text: {
    fontSize: 24,
    lineHeight: 28,
  },
});

// ============================================================================
// MODAL & SHEET STYLES
// ============================================================================

export const modalStyles = StyleSheet.create({
  // Modal overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  // Modal container
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  // Modal content area
  content: {
    backgroundColor: colorTokens.card,
    borderTopLeftRadius: radiusTokens.lg,
    borderTopRightRadius: radiusTokens.lg,
    paddingTop: spacingTokens.lg,
    paddingHorizontal: spacingTokens.lg,
    paddingBottom: spacingTokens.xl,
  },
  // Modal handle/drag indicator
  handle: {
    width: 40,
    height: 4,
    borderRadius: radiusTokens.pill,
    backgroundColor: colorTokens.border,
    alignSelf: 'center',
    marginBottom: spacingTokens.md,
  },
  // Modal header
  header: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colorTokens.textPrimary,
    marginBottom: spacingTokens.lg,
  },
});

export const modalSheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colorTokens.scrim,
  },
  sheetCard: {
    backgroundColor: colorTokens.card,
    borderTopLeftRadius: radiusTokens.lg,
    borderTopRightRadius: radiusTokens.lg,
    paddingHorizontal: spacingTokens.lg,
    paddingTop: spacingTokens.md,
  },
});

// ============================================================================
// BADGE & CHIP STYLES
// ============================================================================

export const badgeStyles = StyleSheet.create({
  // Rounded pill badge
  pill: {
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.xs,
    borderRadius: radiusTokens.pill,
    backgroundColor: colorTokens.groupedSurface,
  },
  // Badge text
  text: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colorTokens.textMuted,
  },
  // Accent badge
  accent: {
    backgroundColor: colorTokens.accent,
  },
  // Accent badge text (inverse color)
  accentText: {
    color: colorTokens.card,
  },
  // Success badge
  success: {
    backgroundColor: colorTokens.success,
  },
  // Destructive badge
  destructive: {
    backgroundColor: colorTokens.destructive,
  },
});

// ============================================================================
// ICON SIZES
// ============================================================================

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

// ============================================================================
// SHADOW UTILITIES
// ============================================================================

export const shadows = {
  // Subtle elevation for cards
  card: {
    shadowColor: colorTokens.inverse,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: elevationTokens.card,
  },
  // Elevated for popovers/sheets
  popover: {
    shadowColor: colorTokens.inverse,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: elevationTokens.popover,
  },
} as const;

// ============================================================================
// COMMON COMBINATIONS
// ============================================================================

/**
 * Convenience functions for common style combinations
 */

export function getFocusedInputStyle(isFocused: boolean, hasError?: boolean) {
  const base = { ...inputStyles.input };
  if (isFocused) {
    return { ...base, ...inputStyles.inputFocused };
  }
  if (hasError) {
    return { ...base, ...inputStyles.inputError };
  }
  return base;
}

export function getStatusColor(status: 'positive' | 'negative' | 'neutral' | 'accent'): string {
  switch (status) {
    case 'positive':
      return colorTokens.success;
    case 'negative':
      return colorTokens.destructive;
    case 'accent':
      return colorTokens.accent;
    case 'neutral':
    default:
      return colorTokens.textMuted;
  }
}

export function getStatusTextStyle(status: 'positive' | 'negative' | 'neutral' | 'accent') {
  return {
    color: getStatusColor(status),
    fontWeight: '600' as const,
  };
}

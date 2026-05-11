import { colors } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';

export const componentTokens = {
  button: {
    base: {
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    regular: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    compact: {
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    primary: {
      borderColor: colors.border.success,
      backgroundColor: colors.border.success,
      textColor: colors.text.onAccent,
    },
    secondary: {
      borderColor: colors.accent.secondary,
      backgroundColor: colors.background.panelSoft,
      textColor: colors.text.link,
    },
    danger: {
      borderColor: colors.border.danger,
      backgroundColor: colors.background.dangerSoft,
      textColor: colors.text.danger,
    },
  },
  card: {
    base: {
      borderRadius: radius.lg,
      borderWidth: 1,
      backgroundColor: colors.background.panel,
      borderColor: colors.border.default,
      padding: spacing.lg,
      gap: spacing.sm,
    },
  },
  input: {
    base: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      backgroundColor: colors.background.panel,
      paddingHorizontal: 14,
      paddingVertical: spacing.md,
      color: colors.text.strong,
    },
  },
} as const;

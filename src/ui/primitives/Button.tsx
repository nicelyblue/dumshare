import React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { componentTokens, typography } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  compact?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, variant = 'primary', compact = false, fullWidth = false, disabled, style, ...props }: ButtonProps) {
  const tone = variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.danger;
  const toneLabel = variant === 'primary' ? styles.primaryLabel : variant === 'secondary' ? styles.secondaryLabel : styles.dangerLabel;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[styles.base, fullWidth ? styles.fullWidth : null, compact ? styles.compact : styles.regular, tone, disabled ? styles.disabled : null, style]}
      {...props}
    >
      <Text style={[styles.label, fullWidth ? styles.fullWidthLabel : null, toneLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    ...componentTokens.button.base,
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  regular: componentTokens.button.regular,
  compact: componentTokens.button.compact,
  primary: {
    borderColor: componentTokens.button.primary.borderColor,
    backgroundColor: componentTokens.button.primary.backgroundColor,
  },
  secondary: {
    borderColor: componentTokens.button.secondary.borderColor,
    backgroundColor: componentTokens.button.secondary.backgroundColor,
  },
  danger: {
    borderColor: componentTokens.button.danger.borderColor,
    backgroundColor: componentTokens.button.danger.backgroundColor,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.labelStrong,
  },
  fullWidthLabel: {
    textAlign: 'center',
  },
  primaryLabel: {
    color: componentTokens.button.primary.textColor,
  },
  secondaryLabel: {
    color: componentTokens.button.secondary.textColor,
  },
  dangerLabel: {
    color: componentTokens.button.danger.textColor,
  },
});

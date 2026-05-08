import React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type ActionButtonTone = 'primary' | 'secondary' | 'danger';

type ActionButtonProps = PressableProps & {
  label: string;
  tone?: ActionButtonTone;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ActionButton({ label, tone = 'primary', compact = false, disabled, style, ...props }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        tone === 'primary' ? styles.primary : tone === 'secondary' ? styles.secondary : styles.danger,
        disabled ? styles.disabled : null,
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.label,
          tone === 'primary' ? styles.primaryLabel : tone === 'secondary' ? styles.secondaryLabel : styles.dangerLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  regular: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  compact: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  primary: {
    borderColor: '#00a7a0',
    backgroundColor: '#00a7a0',
  },
  secondary: {
    borderColor: '#5f6fff',
    backgroundColor: '#eef4ff',
  },
  danger: {
    borderColor: '#d74d66',
    backgroundColor: '#fff1f5',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  primaryLabel: {
    color: '#ffffff',
  },
  secondaryLabel: {
    color: '#4f57d8',
  },
  dangerLabel: {
    color: '#d74d66',
  },
});

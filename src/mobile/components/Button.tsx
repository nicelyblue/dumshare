/**
 * Shared button components
 * Ensures consistent button styling, sizing, and behavior across the app
 */

import { forwardRef, type ReactNode, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  StyleSheet,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { radiusTokens, spacingTokens, touchTarget } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'success';
type ButtonSize = 'large' | 'medium' | 'compact';

type ButtonProps = Omit<PressableProps, 'children'> & {
  children: string | ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

/**
 * Unified button component with consistent styling and behavior
 */
export const Button = forwardRef<View, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'large',
      fullWidth = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      style,
      onPress,
      accessibilityState,
      ...pressableProps
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const isDisabled = disabled || loading;
    
    const dynamicStyles = useMemo(() => {
      return {
        primary: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        secondary: {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        tertiary: {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        },
        destructive: {
          backgroundColor: colors.destructive,
          borderColor: colors.destructive,
        },
        success: {
          backgroundColor: colors.success,
          borderColor: colors.success,
        },
      };
    }, [colors]);

    // Get variant-specific style
    let variantStyle: ViewStyle;
    switch (variant) {
      case 'secondary':
        variantStyle = dynamicStyles.secondary;
        break;
      case 'tertiary':
        variantStyle = dynamicStyles.tertiary;
        break;
      case 'destructive':
        variantStyle = dynamicStyles.destructive;
        break;
      case 'success':
        variantStyle = dynamicStyles.success;
        break;
      case 'primary':
      default:
        variantStyle = dynamicStyles.primary;
        break;
    }

    // Get text color based on variant
    let textColor: string;
    switch (variant) {
      case 'secondary':
      case 'tertiary':
        textColor = colors.textPrimary;
        break;
      case 'destructive':
        textColor = colors.destructiveForeground;
        break;
      case 'success':
        textColor = colors.successForeground;
        break;
      case 'primary':
      default:
        textColor = colors.accentForeground;
        break;
    }

    const containerStyle = [
      styles.base,
      styles[size],
      variantStyle,
      fullWidth && styles.fullWidth,
      isDisabled && styles.disabled,
    ];

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityState={{ ...accessibilityState, disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={loading ? undefined : onPress}
        style={(state) => [
          containerStyle,
          state.pressed && !isDisabled && styles.pressed,
          typeof style === 'function' ? style(state) : style,
        ]}
        {...pressableProps}
      >
        <View style={styles.content}>
          {loading ? <ActivityIndicator color={textColor} size="small" /> : leftIcon}
          {typeof children === 'string' ? (
            <Text
              style={[
                styles.label,
                {
                  color: textColor,
                },
              ]}
            >
              {loading ? 'Loading...' : children}
            </Text>
          ) : (
            loading ? null : children
          )}
          {loading ? null : rightIcon}
        </View>
      </Pressable>
    );
  },
);

Button.displayName = 'Button';

// ============================================================================
// ICON BUTTON COMPONENT
// ============================================================================

type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  backgroundColor?: string;
};

/**
 * Icon-only button component
 */
export const IconButton = forwardRef<View, IconButtonProps>(
  (
    {
      icon,
      variant = 'secondary',
      size = 'medium',
      disabled = false,
      backgroundColor,
      style,
      onPress,
      accessibilityState,
      ...pressableProps
    },
    ref,
  ) => {
    const { colors } = useTheme();

    const sizeStyle = {
      small: { width: touchTarget.minimum, height: touchTarget.minimum },
      medium: { width: 44, height: 44 },
      large: { width: 52, height: 52 },
    }[size];

    const containerStyle = [
      sizeStyle,
      styles.iconButtonBase,
      {
        backgroundColor:
          backgroundColor ??
          (variant === 'primary'
            ? colors.accent
            : variant === 'destructive'
              ? colors.destructive
              : variant === 'success'
                ? colors.success
                : colors.card),
        borderColor:
          variant === 'secondary' ? colors.border : 'transparent',
      },
      disabled && styles.disabled,
    ];

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityState={{ ...accessibilityState, disabled }}
        disabled={disabled}
        onPress={onPress}
        style={(state) => [
          containerStyle,
          state.pressed && !disabled && styles.pressed,
          typeof style === 'function' ? style(state) : style,
        ]}
        {...pressableProps}
      >
        {icon}
      </Pressable>
    );
  },
);

IconButton.displayName = 'IconButton';

// ============================================================================
// BUTTON GROUP COMPONENT
// ============================================================================

type ButtonGroupProps = {
  buttons: Array<{
    label: string;
    value: string;
    disabled?: boolean;
  }>;
  selectedValue?: string;
  onSelect: (value: string) => void;
  variant?: 'pills' | 'tabs' | 'segments';
  fullWidth?: boolean;
};

/**
 * Group of buttons for selection (like tabs or segmented controls)
 */
export function ButtonGroup({
  buttons,
  selectedValue,
  onSelect,
  variant = 'pills',
  fullWidth = false,
}: ButtonGroupProps): JSX.Element {
  const { colors } = useTheme();
  
  const dynamicGroupStyles = useMemo(() => ({
    groupButton: {
      paddingHorizontal: spacingTokens.md,
      paddingVertical: spacingTokens.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: touchTarget.minimum,
    },
    groupButtonSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    groupButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    groupButtonTextSelected: {
      color: colors.accentForeground,
    },
  }), [colors]);
  
  const groupStyle = [styles.group, fullWidth && styles.groupFullWidth];
  const buttonStyle = fullWidth ? { flex: 1 } : undefined;

  return (
    <View style={groupStyle}>
      {buttons.map((button) => {
        const isSelected = button.value === selectedValue;
        return (
          <Pressable
            key={button.value}
            disabled={button.disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: button.disabled, selected: isSelected }}
            onPress={() => onSelect(button.value)}
            style={[
              dynamicGroupStyles.groupButton,
              variant === 'segments' && styles.segmentButton,
              isSelected && dynamicGroupStyles.groupButtonSelected,
              button.disabled && styles.disabled,
              buttonStyle,
            ]}
          >
            <Text
              style={[
                dynamicGroupStyles.groupButtonText,
                isSelected && dynamicGroupStyles.groupButtonTextSelected,
              ]}
            >
              {button.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ============================================================================
// FLOATING ACTION BUTTON (FAB)
// ============================================================================

type FABProps = Omit<PressableProps, 'children'> & {
  icon: ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

/**
 * Floating action button component
 * Typically positioned at bottom-right of screen
 */
export const FAB = forwardRef<View, FABProps>(
  (
    {
      icon,
      label,
      variant = 'primary',
      disabled = false,
      style,
      onPress,
      accessibilityState,
      ...pressableProps
    },
    ref,
  ) => {
    const { colors } = useTheme();
    
    const backgroundColor = variant === 'primary' ? colors.accent : colors.card;
    const foregroundColor = variant === 'primary' ? colors.accentForeground : colors.textPrimary;

    const containerStyle = [
      styles.fab,
      { backgroundColor },
      disabled && styles.disabled,
    ];

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityState={{ ...accessibilityState, disabled }}
        disabled={disabled}
        onPress={onPress}
        style={(state) => [
          containerStyle,
          state.pressed && !disabled && styles.fabPressed,
          typeof style === 'function' ? style(state) : style,
        ]}
        {...pressableProps}
      >
        <View style={styles.fabContent}>
          {icon}
          {label ? <Text style={[styles.fabLabel, { color: foregroundColor }]}>{label}</Text> : null}
        </View>
      </Pressable>
    );
  },
);

FAB.displayName = 'FAB';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.minimum,
    borderRadius: radiusTokens.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingTokens.lg,
  },
  large: {
    paddingVertical: spacingTokens.md,
  },
  medium: {
    paddingVertical: spacingTokens.sm,
  },
  compact: {
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.xs,
  },
  // Button content layout
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingTokens.sm,
  },
  // Button label text
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  // Pressed state opacity
  pressed: {
    opacity: 0.8,
  },
  // Full width button
  fullWidth: {
    width: '100%',
  },
  // Disabled button
  disabled: {
    opacity: 0.5,
  },

  // Icon button
  iconButtonBase: {
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Button group (segmented/tabs)
  group: {
    flexDirection: 'row',
    gap: spacingTokens.sm,
  },
  groupFullWidth: {
    width: '100%',
  },
  segmentButton: {
    borderWidth: 0,
    borderRadius: 12,
  },

  // FAB (Floating Action Button)
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.8,
  },
  fabContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacingTokens.xs,
  },
  fabLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
});

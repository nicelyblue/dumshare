/**
 * Shared form field components
 * Ensures consistent input styling, validation display, and behavior across the app
 */

import { forwardRef, useState, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { radiusTokens, spacingTokens, touchTarget } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

// ============================================================================
// TEXT INPUT FIELD
// ============================================================================

type FormTextInputProps = TextInputProps & {
  label?: string;
  placeholder?: string;
  error?: string;
  helper?: string;
  required?: boolean;
};

/**
 * Unified text input field with label, validation, and helper text
 * Ensures consistency across all forms
 */
export const FormTextInput = forwardRef<TextInput, FormTextInputProps>(
  (
    {
      label,
      placeholder,
      error,
      helper,
      required,
      onFocus,
      onBlur,
      style,
      editable = true,
      ...textInputProps
    },
    ref,
  ) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    function handleFocus(e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) {
      setIsFocused(true);
      onFocus?.(e);
    }

    function handleBlur(e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) {
      setIsFocused(false);
      onBlur?.(e);
    }

    const dynamicInputStyles = useMemo(() => ({
      input: {
        minHeight: 44,
        paddingHorizontal: spacingTokens.md,
        paddingVertical: spacingTokens.sm,
        backgroundColor: colors.inputBackground,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.subtleBorder,
        fontSize: 16,
        color: colors.textPrimary,
      },
      inputFocused: {
        borderColor: colors.accent,
        borderWidth: 2,
      },
      inputError: {
        borderColor: colors.destructive,
        borderWidth: 1,
      },
      errorMessage: {
        fontSize: 13,
        color: colors.destructive,
      },
      helper: {
        fontSize: 13,
        color: colors.textMuted,
      },
    }), [colors]);

    const inputStyle = [
      dynamicInputStyles.input,
      isFocused && !error && dynamicInputStyles.inputFocused,
      error && dynamicInputStyles.inputError,
      !editable && styles.disabled,
      style,
    ];

    return (
      <View style={styles.fieldContainer}>
        {label ? (
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {label}
            {required ? <Text style={{ color: colors.destructive }}> *</Text> : null}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          accessibilityState={{ disabled: !editable }}
          style={inputStyle}
          {...textInputProps}
        />
        {error ? (
          <Text accessibilityLiveRegion="polite" style={dynamicInputStyles.errorMessage}>{error}</Text>
        ) : helper ? (
          <Text style={dynamicInputStyles.helper}>{helper}</Text>
        ) : null}
      </View>
    );
  },
);

FormTextInput.displayName = 'FormTextInput';

// ============================================================================
// NUMERIC INPUT FIELD
// ============================================================================

type FormNumberInputProps = Omit<FormTextInputProps, 'keyboardType'> & {
  value?: number | string;
  onChangeNumber?: (value: number) => void;
};

/**
 * Numeric input with currency-style formatting
 * Handles decimal places and validates numeric input
 */
export const FormNumberInput = forwardRef<TextInput, FormNumberInputProps>(
  ({ value, onChangeNumber, onChangeText, ...props }, ref) => {
    function handleChangeText(text: string) {
      // Allow only numbers and one decimal point
      const numericValue = text.replace(/[^0-9.]/g, '');
      const parts = numericValue.split('.');
      let cleanedValue = parts[0];
      if (parts.length > 1) {
        cleanedValue += '.' + parts[1].slice(0, 2); // Max 2 decimal places
      }
      onChangeText?.(cleanedValue);
      const numValue = parseFloat(cleanedValue);
      if (!Number.isNaN(numValue)) {
        onChangeNumber?.(numValue);
      }
    }

    return (
      <FormTextInput
        ref={ref}
        value={value?.toString() ?? ''}
        onChangeText={handleChangeText}
        keyboardType="decimal-pad"
        {...props}
      />
    );
  },
);

FormNumberInput.displayName = 'FormNumberInput';

// ============================================================================
// SELECT/PICKER FIELD
// ============================================================================

type FormSelectProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  options: Array<{ label: string; value: string }>;
  error?: string;
  helper?: string;
  required?: boolean;
  onSelect: (value: string) => void;
  disabled?: boolean;
};

/**
 * Select field component - basic wrapper (actual picker logic depends on navigation)
 */
export function FormSelect({
  label,
  value,
  placeholder,
  options,
  error,
  helper,
  required,
  onSelect,
  disabled,
}: FormSelectProps): JSX.Element {
  const { colors } = useTheme();
  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label ?? placeholder ?? 'Select...';

  const dynamicSelectStyles = useMemo(() => ({
    label: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '500' as const,
    },
    required: {
      color: colors.destructive,
    },
    selectField: {
      minHeight: touchTarget.minimum,
      paddingHorizontal: spacingTokens.md,
      paddingVertical: spacingTokens.sm,
      backgroundColor: colors.inputBackground,
      borderRadius: radiusTokens.sm,
      borderWidth: 1,
      borderColor: error ? colors.destructive : colors.subtleBorder,
      justifyContent: 'center' as const,
    },
    selectText: {
      color: colors.textPrimary,
      fontSize: 16,
    },
    selectPlaceholder: {
      color: colors.textMuted,
    },
    errorMessage: {
      fontSize: 13,
      color: colors.destructive,
    },
    helper: {
      fontSize: 13,
      color: colors.textMuted,
    },
  }), [colors, error]);

  return (
    <View style={styles.fieldContainer}>
      {label ? (
        <Text style={dynamicSelectStyles.label}>
          {label}
          {required ? <Text style={dynamicSelectStyles.required}> *</Text> : null}
        </Text>
      ) : null}
      <Pressable
        onPress={() => !disabled && onSelect(value ?? '')}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={[
          dynamicSelectStyles.selectField,
          disabled && styles.disabled,
        ]}
      >
        <Text style={[dynamicSelectStyles.selectText, !selectedOption && dynamicSelectStyles.selectPlaceholder]}>
          {displayText}
        </Text>
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={dynamicSelectStyles.errorMessage}>{error}</Text>
      ) : helper ? (
        <Text style={dynamicSelectStyles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

// ============================================================================
// CHECKBOX FIELD
// ============================================================================

type FormCheckboxProps = {
  label?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  helper?: string;
  disabled?: boolean;
};

/**
 * Checkbox field component
 */
export function FormCheckbox({
  label,
  value,
  onChange,
  error,
  helper,
  disabled,
}: FormCheckboxProps): JSX.Element {
  const { colors } = useTheme();

  const dynamicCheckboxStyles = useMemo(() => ({
    checkboxBox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxBoxChecked: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    checkboxBoxError: {
      borderColor: colors.destructive,
    },
    checkboxCheck: {
      color: colors.accentForeground,
      fontSize: 14,
      fontWeight: '700' as const,
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      color: colors.textPrimary,
    },
    errorMessage: {
      fontSize: 13,
      color: colors.destructive,
    },
    helper: {
      fontSize: 13,
      color: colors.textMuted,
    },
  }), [colors]);

  return (
    <View style={styles.checkboxContainer}>
      <Pressable
        onPress={() => !disabled && onChange(!value)}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value, disabled }}
        style={styles.checkboxRow}
      >
        <View
          style={[
            dynamicCheckboxStyles.checkboxBox,
            value && dynamicCheckboxStyles.checkboxBoxChecked,
            error && dynamicCheckboxStyles.checkboxBoxError,
            disabled && styles.disabled,
          ]}
        >
          {value ? <Text style={dynamicCheckboxStyles.checkboxCheck}>✓</Text> : null}
        </View>
        {label ? <Text style={dynamicCheckboxStyles.checkboxLabel}>{label}</Text> : null}
      </Pressable>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={dynamicCheckboxStyles.errorMessage}>{error}</Text>
      ) : helper ? (
        <Text style={dynamicCheckboxStyles.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  fieldContainer: {
    gap: spacingTokens.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  disabled: {
    opacity: 0.5,
  },
  checkboxContainer: {
    gap: spacingTokens.sm,
  },
  checkboxRow: {
    minHeight: touchTarget.minimum,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.md,
  },
});

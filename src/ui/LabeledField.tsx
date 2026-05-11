import React, { forwardRef, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { initializeKeyboardFocusTracking, scrollFocusedElementIntoView } from './focusScroll';
import { colors, typography } from '../theme';
import { Input } from './primitives';

type LabeledFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
};

export const LabeledField = forwardRef<TextInput, LabeledFieldProps>(function LabeledField(
  { label, helperText, style, ...props }: LabeledFieldProps,
  ref,
) {
  useEffect(() => {
    initializeKeyboardFocusTracking();
  }, []);

  return (
    <View style={styles.container} className="gap-2">
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Input
        {...props}
        ref={ref}
        style={[styles.input, style]}
        onFocus={(event) => {
          scrollFocusedElementIntoView((event as { target?: unknown }).target);
          props.onFocus?.(event);
        }}
      />
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    ...typography.label,
    color: colors.text.muted,
  },
  input: {
    fontSize: 16,
  },
  helper: {
    ...typography.bodySmall,
    color: colors.text.muted,
  },
});

import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

type LabeledFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
};

export function LabeledField({ label, helperText, style, ...props }: LabeledFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={[styles.input, style]} placeholderTextColor="#8a8a8a" />
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: '#7a634b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d0bf',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    color: '#10203a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  helperText: {
    color: '#51617a',
    fontSize: 13,
    lineHeight: 18,
  },
});
import React from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { colors, componentTokens } from '../../theme';

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.placeholder} {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  input: {
    ...componentTokens.input.base,
    fontSize: 16,
  },
});

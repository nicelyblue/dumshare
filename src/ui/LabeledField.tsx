import React, { useEffect } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { initializeKeyboardFocusTracking, scrollFocusedElementIntoView } from './focusScroll';

type LabeledFieldProps = TextInputProps & {
  label: string;
  helperText?: string;
};

export function LabeledField({ label, helperText, style, ...props }: LabeledFieldProps) {
  useEffect(() => {
    initializeKeyboardFocusTracking();
  }, []);

  return (
    <View className="gap-2">
      {label ? <Text className="text-xs font-bold uppercase tracking-[1.2px] text-muted">{label}</Text> : null}
      <TextInput
        {...props}
        style={style}
        className="rounded-field border border-border bg-panel px-3.5 py-3 text-base text-ink"
        placeholderTextColor="#8090ad"
        onFocus={(event) => {
          scrollFocusedElementIntoView((event as { target?: unknown }).target);
          props.onFocus?.(event);
        }}
      />
      {helperText ? <Text className="text-[13px] leading-[18px] text-muted">{helperText}</Text> : null}
    </View>
  );
}

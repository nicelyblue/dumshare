import React from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Button } from './primitives';

type ActionButtonTone = 'primary' | 'secondary' | 'danger';

type ActionButtonProps = PressableProps & {
  label: string;
  tone?: ActionButtonTone;
  compact?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ActionButton({ label, tone = 'primary', compact = false, fullWidth = false, disabled, style, ...props }: ActionButtonProps) {
  return <Button label={label} variant={tone} compact={compact} fullWidth={fullWidth} disabled={disabled} style={style} {...props} />;
}

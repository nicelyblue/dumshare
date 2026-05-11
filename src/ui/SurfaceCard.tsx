import React from 'react';
import type { ViewProps } from 'react-native';
import { Card } from './primitives';

type SurfaceCardProps = ViewProps & {
  emphasis?: 'default' | 'soft' | 'accent';
};

export function SurfaceCard({ emphasis = 'default', style, ...props }: SurfaceCardProps) {
  return <Card tone={emphasis} style={style} {...props} />;
}

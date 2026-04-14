'use client';

import { useTheme } from '../ThemeProvider';
import type { CSSProperties } from 'react';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  style?: CSSProperties;
  className?: string;
}

export function Divider({ orientation = 'horizontal', style, className }: DividerProps) {
  const { tokens: colors } = useTheme();
  return (
    <div className={className} style={{
      border: 'none', margin: 0, backgroundColor: colors.border,
      width: orientation === 'vertical' ? 1 : '100%', height: orientation === 'horizontal' ? 1 : '100%', ...style,
    }} />
  );
}

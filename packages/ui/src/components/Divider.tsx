import { tokens } from '../tokens';
import type { CSSProperties } from 'react';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  style?: CSSProperties;
  className?: string;
}

export function Divider({ orientation = 'horizontal', style, className }: DividerProps) {
  return (
    <div
      className={className}
      style={{
        border: 'none',
        margin: 0,
        backgroundColor: tokens.colors.border,
        width: orientation === 'vertical' ? 1 : '100%',
        height: orientation === 'horizontal' ? 1 : '100%',
        ...style,
      }}
    />
  );
}

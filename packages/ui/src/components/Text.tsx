'use client';

import { tokens } from '../tokens';
import { useTheme } from '../ThemeProvider';
import type { CSSProperties, ElementType, ComponentProps } from 'react';

type As = 'p' | 'span' | 'div' | 'label' | 'small' | 'code' | 'pre';

export interface TextProps {
  children: React.ReactNode;
  muted?: boolean;
  error?: boolean;
  success?: boolean;
  warning?: boolean;
  size?: keyof typeof tokens.fontSizes;
  fontWeight?: keyof typeof tokens.fontWeights | number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  style?: CSSProperties;
  className?: string;
  as?: As;
  truncate?: boolean;
}

export function Text({ children, muted = false, error = false, success = false, warning = false, size = 'md', fontWeight = 'normal', textAlign, lineHeight, style, className, as: Component = 'p', truncate = false }: TextProps) {
  const { tokens: colors } = useTheme();
  const color = error ? colors.error : success ? colors.success : warning ? colors.warning : muted ? colors.muted : colors.text;
  const weight = typeof fontWeight === 'string' ? tokens.fontWeights[fontWeight as keyof typeof tokens.fontWeights] ?? fontWeight : fontWeight;

  return (
    <Component
      className={className}
      style={{
        margin: 0,
        color,
        fontSize: tokens.fontSizes[size],
        lineHeight: lineHeight ?? 1.6,
        fontWeight: weight,
        textAlign,
        overflow: truncate ? 'hidden' : undefined,
        textOverflow: truncate ? 'ellipsis' : undefined,
        whiteSpace: truncate ? 'nowrap' : undefined,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

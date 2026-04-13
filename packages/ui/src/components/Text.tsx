import { tokens } from '../tokens';
import type { CSSProperties, ReactNode } from 'react';

export interface TextProps {
  children: ReactNode;
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
  as?: 'p' | 'span' | 'div' | 'label' | 'small' | 'code' | 'pre';
  truncate?: boolean;
}

export function Text({
  children,
  muted = false,
  error = false,
  success = false,
  warning = false,
  size = 'md',
  fontWeight = 'normal',
  textAlign,
  lineHeight,
  style,
  className,
  as: Component = 'p',
  truncate = false,
}: TextProps) {
  const color = error ? tokens.colors.error
    : success ? tokens.colors.success
      : warning ? tokens.colors.warning
        : muted ? tokens.colors.muted
          : tokens.colors.text;

  const weight = typeof fontWeight === 'string'
    ? tokens.fontWeights[fontWeight as keyof typeof tokens.fontWeights] ?? fontWeight
    : fontWeight;

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

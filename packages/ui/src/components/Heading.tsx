import { tokens } from '../tokens';
import type { CSSProperties, ReactNode } from 'react';

export interface HeadingProps {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5;
  textAlign?: 'left' | 'center' | 'right';
  style?: CSSProperties;
  className?: string;
  gradient?: boolean;
}

const levelConfig = {
  1: { fontSize: tokens.fontSizes['4xl'], fontWeight: tokens.fontWeights.bold, margin: '0 0 16px' },
  2: { fontSize: tokens.fontSizes['3xl'], fontWeight: tokens.fontWeights.bold, margin: '0 0 12px' },
  3: { fontSize: tokens.fontSizes['2xl'], fontWeight: tokens.fontWeights.semibold, margin: '0 0 8px' },
  4: { fontSize: tokens.fontSizes.xl, fontWeight: tokens.fontWeights.semibold, margin: '0 0 8px' },
  5: { fontSize: tokens.fontSizes.lg, fontWeight: tokens.fontWeights.semibold, margin: '0 0 4px' },
} as const;

export function Heading({
  children,
  level = 2,
  textAlign,
  style,
  className,
  gradient = false,
}: HeadingProps) {
  const Component = `h${level}` as const;
  const config = levelConfig[level];

  return (
    <Component
      className={className}
      style={{
        margin: config.margin,
        color: gradient ? 'transparent' : tokens.colors.text,
        fontSize: config.fontSize,
        fontWeight: config.fontWeight,
        textAlign,
        lineHeight: 1.3,
        ...(gradient && {
          backgroundImage: `linear-gradient(135deg, ${tokens.colors.primary}, ${tokens.colors.success})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
        }),
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

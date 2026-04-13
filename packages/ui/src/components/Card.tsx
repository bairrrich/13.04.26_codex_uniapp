import { tokens } from '../tokens';
import type { CSSProperties, ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  padding?: keyof typeof tokens.space;
  hoverable?: boolean;
  clickable?: boolean;
  style?: CSSProperties;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  variant?: 'default' | 'outlined' | 'elevated' | 'ghost';
}

export function Card({
  children,
  padding = 'lg',
  hoverable = false,
  clickable = false,
  style,
  className,
  onClick,
  variant = 'default',
}: CardProps) {
  const paddingValue = typeof padding === 'string' ? tokens.space[padding as keyof typeof tokens.space] ?? padding : padding;

  const variantStyles: Record<string, CSSProperties> = {
    default: {
      background: tokens.colors.surface,
      borderColor: tokens.colors.border,
    },
    outlined: {
      background: 'transparent',
      borderColor: tokens.colors.borderHover,
    },
    elevated: {
      background: tokens.colors.surface,
      borderColor: tokens.colors.border,
      boxShadow: tokens.shadows.md,
    },
    ghost: {
      background: 'transparent',
      border: 'none',
    },
  };

  const v = variantStyles[variant];

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        padding: typeof paddingValue === 'number' ? `${paddingValue}px` : paddingValue,
        backgroundColor: v.background as string,
        borderRadius: tokens.radius.xl,
        borderWidth: v.border ? 1 : 0,
        borderStyle: v.border ? 'solid' : undefined,
        borderColor: v.borderColor,
        boxShadow: v.boxShadow,
        transition: `all ${tokens.transitions.base}`,
        cursor: clickable || onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLElement).style.borderColor = tokens.colors.borderFocus;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLElement).style.boxShadow = tokens.shadows.lg;
        }
        if (clickable || onClick) {
          (e.currentTarget as HTMLElement).style.background = tokens.colors.surfaceHover;
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLElement).style.borderColor = tokens.colors.border;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = v.boxShadow ?? 'none';
        }
        if (clickable || onClick) {
          (e.currentTarget as HTMLElement).style.background = v.background as string;
        }
      }}
    >
      {children}
    </div>
  );
}

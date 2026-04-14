'use client';

import { tokens } from '../tokens';
import { useTheme } from '../ThemeProvider';
import type { CSSProperties, ReactNode, MouseEvent } from 'react';

export interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  style?: CSSProperties;
  className?: string;
  icon?: ReactNode;
}

export function Button({ children, variant = 'primary', size = 'md', fullWidth = false, loading = false, disabled, onPress, onClick, type = 'button', style, className, icon }: ButtonProps) {
  const { tokens: colors } = useTheme();
  const sizeMap: Record<string, { padding: string; fontSize: number; gap: number; borderRadius: number }> = {
    xs: { padding: '4px 8px', fontSize: tokens.fontSizes.xs, gap: 4, borderRadius: tokens.radius.md },
    sm: { padding: '6px 12px', fontSize: tokens.fontSizes.sm, gap: 6, borderRadius: tokens.radius.md },
    md: { padding: '10px 16px', fontSize: tokens.fontSizes.md, gap: 8, borderRadius: tokens.radius.lg },
    lg: { padding: '14px 24px', fontSize: tokens.fontSizes.lg, gap: 10, borderRadius: tokens.radius.lg },
  };

  const variantMap: Record<string, { background: string; color: string; hover: string; border?: string }> = {
    primary: { background: colors.primary, color: '#ffffff', hover: colors.primaryHover },
    secondary: { background: colors.surface, color: colors.text, hover: colors.surfaceHover, border: colors.border },
    ghost: { background: 'transparent', color: colors.text, hover: colors.surface },
    danger: { background: colors.error, color: '#ffffff', hover: 'rgba(239,68,68,0.9)' },
    success: { background: colors.success, color: '#ffffff', hover: 'rgba(34,197,94,0.9)' },
  };

  const s = sizeMap[size];
  const v = variantMap[variant];
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={(e) => { onClick?.(e); if (!isDisabled) onPress?.(); }}
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: s.gap,
        padding: s.padding, fontSize: s.fontSize, fontWeight: tokens.fontWeights.semibold,
        fontFamily: 'inherit', background: v.background, color: v.color,
        border: v.border ? `1px solid ${v.border}` : 'none', borderRadius: s.borderRadius,
        width: fullWidth ? '100%' : undefined, cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1, transition: `all ${tokens.transitions.fast}`,
        boxShadow: variant === 'primary' ? `0 2px 8px ${colors.primaryLight}` : 'none',
        position: 'relative', overflow: 'hidden', whiteSpace: 'nowrap', ...style,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLElement).style.background = v.hover;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${colors.primaryLight}`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLElement).style.background = v.background;
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = variant === 'primary' ? `0 2px 8px ${colors.primaryLight}` : 'none';
        }
      }}
    >
      {loading && (
        <span style={{ width: 14, height: 14, border: `2px solid ${v.color}40`, borderTopColor: v.color, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      )}
      {!loading && icon}
      {children}
    </button>
  );
}

'use client';

import { tokens } from '../tokens';
import { useTheme } from '../ThemeProvider';
import type { CSSProperties, ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  style?: CSSProperties;
  className?: string;
}

const sizeMap = {
  xs: { padding: '2px 6px', fontSize: tokens.fontSizes.xs, borderRadius: tokens.radius.sm, gap: 4 },
  sm: { padding: '3px 8px', fontSize: 12, borderRadius: tokens.radius.md, gap: 5 },
  md: { padding: '4px 12px', fontSize: tokens.fontSizes.sm, borderRadius: tokens.radius.md, gap: 6 },
} as const;

export function Badge({ children, variant = 'default', size = 'sm', dot = false, style, className }: BadgeProps) {
  const { tokens: colors } = useTheme();
  const s = sizeMap[size];

  const bgMap: Record<string, string> = {
    default: colors.surface,
    success: colors.successBg,
    error: colors.errorBg,
    warning: colors.warningBg,
    info: colors.infoBg,
    primary: colors.primaryLight,
  };
  const colorMap: Record<string, string> = {
    default: colors.textSecondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    primary: colors.primary,
  };
  const borderMap: Record<string, string> = {
    default: colors.border,
    success: `${colors.success}33`,
    error: `${colors.error}33`,
    warning: `${colors.warning}33`,
    info: `${colors.info}33`,
    primary: `${colors.primary}33`,
  };

  return (
    <span className={className} style={{
      display: 'inline-flex', alignItems: 'center', gap: s.gap, padding: s.padding,
      fontSize: s.fontSize, fontWeight: tokens.fontWeights.medium, borderRadius: s.borderRadius,
      backgroundColor: bgMap[variant], color: colorMap[variant], border: `1px solid ${borderMap[variant]}`,
      lineHeight: 1.4, ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: colorMap[variant], flexShrink: 0 }} />}
      {children}
    </span>
  );
}

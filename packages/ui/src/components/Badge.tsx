import { tokens } from '../tokens';
import type { CSSProperties, ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  style?: CSSProperties;
  className?: string;
}

const variantMap = {
  default: { background: tokens.colors.surface, color: tokens.colors.textSecondary, border: tokens.colors.border },
  success: { background: tokens.colors.successBg, color: tokens.colors.success, border: `${tokens.colors.success}33` },
  error: { background: tokens.colors.errorBg, color: tokens.colors.error, border: `${tokens.colors.error}33` },
  warning: { background: tokens.colors.warningBg, color: tokens.colors.warning, border: `${tokens.colors.warning}33` },
  info: { background: tokens.colors.infoBg, color: tokens.colors.info, border: `${tokens.colors.info}33` },
  primary: { background: tokens.colors.primaryLight, color: tokens.colors.primary, border: `${tokens.colors.primary}33` },
} as const;

const sizeMap = {
  xs: { padding: '2px 6px', fontSize: tokens.fontSizes.xs, borderRadius: tokens.radius.sm, gap: 4 },
  sm: { padding: '3px 8px', fontSize: 12, borderRadius: tokens.radius.md, gap: 5 },
  md: { padding: '4px 12px', fontSize: tokens.fontSizes.sm, borderRadius: tokens.radius.md, gap: 6 },
} as const;

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  style,
  className,
}: BadgeProps) {
  const v = variantMap[variant];
  const s = sizeMap[size];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: tokens.fontWeights.medium,
        borderRadius: s.borderRadius,
        backgroundColor: v.background,
        color: v.color,
        border: `1px solid ${v.border}`,
        lineHeight: 1.4,
        ...style,
      }}
    >
      {dot && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: v.color,
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}

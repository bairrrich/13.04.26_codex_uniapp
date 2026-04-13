import { tokens } from '../tokens';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'primary';
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
  className?: string;
}

const variantMap = {
  default: { backgroundColor: tokens.colors.surface, color: tokens.colors.text },
  success: { backgroundColor: tokens.colors.success, color: '#ffffff' },
  error: { backgroundColor: tokens.colors.error, color: '#ffffff' },
  warning: { backgroundColor: tokens.colors.warning, color: '#000000' },
  primary: { backgroundColor: tokens.colors.primary, color: '#ffffff' },
} as const;

const sizeMap = {
  sm: { padding: '2px 8px', fontSize: tokens.fontSizes.xs, borderRadius: tokens.radius.sm },
  md: { padding: '4px 12px', fontSize: tokens.fontSizes.sm, borderRadius: tokens.radius.md },
} as const;

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  style,
  className,
}: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        fontWeight: 500,
        ...sizeMap[size],
        ...variantMap[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

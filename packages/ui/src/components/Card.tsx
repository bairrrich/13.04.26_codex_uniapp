import { tokens } from '../tokens';

export interface CardProps {
  children: React.ReactNode;
  padding?: keyof typeof tokens.space;
  hoverable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export function Card({
  children,
  padding = 'lg',
  hoverable = false,
  style,
  className,
  onClick,
}: CardProps) {
  const paddingMap = {
    xs: tokens.space.xs,
    sm: tokens.space.sm,
    md: tokens.space.md,
    lg: tokens.space.lg,
    xl: tokens.space.xl,
    '2xl': tokens.space['2xl'],
    '3xl': tokens.space['3xl'],
    '4xl': tokens.space['4xl'],
  };

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        padding: `${paddingMap[padding]}px`,
        backgroundColor: tokens.colors.surface,
        borderRadius: tokens.radius.xl,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: tokens.colors.border,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

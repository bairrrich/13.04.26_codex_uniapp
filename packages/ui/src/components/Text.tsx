import { tokens } from '../tokens';

export interface TextProps {
  children: React.ReactNode;
  muted?: boolean;
  error?: boolean;
  success?: boolean;
  size?: keyof typeof tokens.fontSizes;
  fontWeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'label';
}

export function Text({
  children,
  muted = false,
  error = false,
  success = false,
  size = 'md',
  fontWeight,
  textAlign,
  style,
  className,
  as: Component = 'p',
}: TextProps) {
  const color = error ? tokens.colors.error : success ? tokens.colors.success : muted ? tokens.colors.muted : tokens.colors.text;

  return (
    <Component
      className={className}
      style={{
        margin: 0,
        color,
        fontSize: tokens.fontSizes[size],
        lineHeight: 1.5,
        fontWeight: fontWeight ?? 400,
        textAlign,
        ...style,
      }}
    >
      {children}
    </Component>
  );
}

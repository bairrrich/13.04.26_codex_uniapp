import { tokens } from '../tokens';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  onPress,
  onClick,
  type = 'button',
  style,
  className,
}: ButtonProps) {
  const sizeMap = {
    sm: { padding: '6px 12px', fontSize: tokens.fontSizes.sm },
    md: { padding: '10px 16px', fontSize: tokens.fontSizes.md },
    lg: { padding: '12px 20px', fontSize: tokens.fontSizes.lg },
  };

  const variantMap = {
    primary: {
      backgroundColor: tokens.colors.primary,
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: tokens.colors.surface,
      color: tokens.colors.text,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: tokens.colors.text,
    },
    danger: {
      backgroundColor: tokens.colors.error,
      color: '#ffffff',
    },
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={(e) => {
        onClick?.(e);
        onPress?.();
      }}
      className={className}
      style={{
        ...sizeMap[size],
        ...variantMap[variant],
        width: fullWidth ? '100%' : undefined,
        borderRadius: tokens.radius.lg,
        border: variant === 'ghost' ? 'none' : 'none',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'transform 0.15s, opacity 0.15s',
        opacity: disabled || loading ? 0.6 : 1,
        ...style,
      }}
    >
      {loading ? '...' : children}
    </button>
  );
}

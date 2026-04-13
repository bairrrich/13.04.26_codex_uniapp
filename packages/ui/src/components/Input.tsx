import { tokens } from '../tokens';

export interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  error = false,
  fullWidth = false,
  disabled,
  style,
  className,
}: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={className}
      style={{
        width: fullWidth ? '100%' : undefined,
        padding: '10px 12px',
        borderRadius: tokens.radius.lg,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: error ? tokens.colors.error : tokens.colors.border,
        backgroundColor: tokens.colors.surface,
        color: tokens.colors.text,
        fontSize: tokens.fontSizes.md,
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}

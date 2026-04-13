import { tokens } from '../tokens';

export interface TextAreaProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  rows?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function TextArea({
  value,
  onChange,
  placeholder,
  error = false,
  fullWidth = false,
  disabled,
  rows = 3,
  style,
  className,
}: TextAreaProps) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
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
        resize: 'vertical',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}

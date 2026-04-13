import { tokens } from '../tokens';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  error?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  error = false,
  fullWidth = false,
  disabled,
  style,
  className,
}: SelectProps) {
  return (
    <select
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
        color: value ? tokens.colors.text : tokens.colors.muted,
        fontSize: tokens.fontSizes.md,
        outline: 'none',
        boxSizing: 'border-box',
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {!value && <option value="" disabled>{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

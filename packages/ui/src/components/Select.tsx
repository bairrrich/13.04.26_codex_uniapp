import { tokens } from '../tokens';
import type { CSSProperties, ReactNode, ChangeEvent } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export function Select({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Выберите...',
  error = false,
  errorMessage,
  fullWidth = false,
  disabled = false,
  style,
  className,
  id,
  name,
  required,
}: SelectProps) {
  const hasValue = value !== undefined;

  return (
    <div>
      <select
        id={id}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={className}
        style={{
          width: fullWidth ? '100%' : undefined,
          padding: '10px 32px 10px 12px',
          borderRadius: tokens.radius.lg,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: error ? tokens.colors.error : tokens.colors.border,
          backgroundColor: disabled ? tokens.colors.backgroundSecondary : tokens.colors.surface,
          color: hasValue ? tokens.colors.text : tokens.colors.muted,
          fontSize: tokens.fontSizes.md,
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          transition: `all ${tokens.transitions.fast}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          ...style,
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = error ? tokens.colors.error : tokens.colors.borderFocus;
            e.target.style.boxShadow = `0 0 0 3px ${error ? tokens.colors.errorBg : tokens.colors.primaryLight}`;
          }
        }}
        onBlurCapture={(e) => {
          e.target.style.borderColor = error ? tokens.colors.error : tokens.colors.border;
          e.target.style.boxShadow = 'none';
        }}
      >
        {!hasValue && <option value="" disabled>{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {errorMessage && (
        <p style={{
          margin: '4px 0 0',
          fontSize: tokens.fontSizes.xs,
          color: tokens.colors.error,
        }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}

import { tokens } from '../tokens';
import type { CSSProperties, ChangeEvent } from 'react';

export interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: CSSProperties;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export function Input({
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  onBlur,
  error = false,
  errorMessage,
  fullWidth = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  className,
  id,
  name,
  required,
  autoFocus,
}: InputProps) {
  const baseStyle: CSSProperties = {
    width: fullWidth ? '100%' : undefined,
    padding: leftIcon ? '10px 12px 10px 36px' : '10px 12px',
    paddingRight: rightIcon ? 36 : undefined,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: error ? tokens.colors.error : tokens.colors.border,
    backgroundColor: disabled ? tokens.colors.backgroundSecondary : tokens.colors.surface,
    color: disabled ? tokens.colors.muted : tokens.colors.text,
    fontSize: tokens.fontSizes.md,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: `all ${tokens.transitions.fast}`,
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  return (
    <div style={{ position: 'relative' }}>
      {leftIcon && (
        <div style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: tokens.colors.muted,
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {leftIcon}
        </div>
      )}

      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        className={className}
        style={baseStyle}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = error ? tokens.colors.error : tokens.colors.borderFocus;
            e.target.style.boxShadow = `0 0 0 3px ${error ? tokens.colors.errorBg : tokens.colors.primaryLight}`;
          }
        }}
        onBlurCapture={(e) => {
          e.target.style.borderColor = error ? tokens.colors.error : tokens.colors.border;
          e.target.style.boxShadow = 'none';
          onBlur?.(e);
        }}
      />

      {rightIcon && (
        <div style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: tokens.colors.muted,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
        }}>
          {rightIcon}
        </div>
      )}

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

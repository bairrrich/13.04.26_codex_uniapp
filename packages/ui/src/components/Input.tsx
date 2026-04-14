'use client';

import { tokens } from '../tokens';
import { useTheme } from '../ThemeProvider';
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
  step?: string | number;
  min?: string | number;
  max?: string | number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function Input({ type = 'text', placeholder, value, defaultValue, onChange, onBlur, error = false, errorMessage, fullWidth = false, disabled = false, leftIcon, rightIcon, style, className, id, name, required, autoFocus, step, min, max, onKeyDown }: InputProps) {
  const { tokens: colors } = useTheme();

  return (
    <div style={{ position: 'relative' }}>
      {leftIcon && (
        <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.muted, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>{leftIcon}</div>
      )}
      <input
        type={type} id={id} name={name} placeholder={placeholder} value={value} defaultValue={defaultValue}
        onChange={onChange} onBlur={onBlur} disabled={disabled} required={required} autoFocus={autoFocus}
        step={step} min={min} max={max} onKeyDown={onKeyDown} className={className}
        style={{
          width: fullWidth ? '100%' : undefined,
          padding: leftIcon ? '10px 12px 10px 36px' : rightIcon ? '10px 36px 10px 12px' : '10px 12px',
          borderRadius: tokens.radius.lg, borderWidth: 1, borderStyle: 'solid',
          borderColor: error ? colors.error : colors.border,
          backgroundColor: disabled ? colors.backgroundSecondary : colors.surface,
          color: disabled ? colors.muted : colors.text, fontSize: tokens.fontSizes.md, fontFamily: 'inherit',
          outline: 'none', boxSizing: 'border-box', transition: `all ${tokens.transitions.fast}`,
          opacity: disabled ? 0.6 : 1, ...style,
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.borderColor = error ? colors.error : colors.borderFocus;
            e.target.style.boxShadow = `0 0 0 3px ${error ? colors.errorBg : colors.primaryLight}`;
          }
        }}
        onBlurCapture={(e) => {
          e.target.style.borderColor = error ? colors.error : colors.border;
          e.target.style.boxShadow = 'none';
          onBlur?.(e);
        }}
      />
      {rightIcon && (
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: colors.muted, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>{rightIcon}</div>
      )}
      {errorMessage && (
        <p style={{ margin: '4px 0 0', fontSize: tokens.fontSizes.xs, color: colors.error }}>{errorMessage}</p>
      )}
    </div>
  );
}

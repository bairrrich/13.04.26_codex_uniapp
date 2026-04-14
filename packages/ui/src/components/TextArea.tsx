'use client';

import { tokens } from '../tokens';
import { useTheme } from '../ThemeProvider';
import type { CSSProperties, ChangeEvent } from 'react';

export interface TextAreaProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  rows?: number;
  resize?: 'none' | 'vertical' | 'both' | 'horizontal';
  style?: CSSProperties;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
}

export function TextArea({ value, defaultValue, onChange, placeholder, error = false, errorMessage, fullWidth = false, disabled = false, rows = 3, resize = 'vertical', style, className, id, name, required, maxLength, autoFocus }: TextAreaProps) {
  const { tokens: colors } = useTheme();

  return (
    <div>
      <textarea id={id} name={name} value={value} defaultValue={defaultValue} onChange={onChange} placeholder={placeholder} disabled={disabled} rows={rows} required={required} maxLength={maxLength} autoFocus={autoFocus} className={className}
        style={{
          width: fullWidth ? '100%' : undefined, padding: '12px', borderRadius: tokens.radius.lg,
          borderWidth: 1, borderStyle: 'solid', borderColor: error ? colors.error : colors.border,
          backgroundColor: disabled ? colors.backgroundSecondary : colors.surface,
          color: disabled ? colors.muted : colors.text, fontSize: tokens.fontSizes.md, fontFamily: 'inherit',
          outline: 'none', resize, boxSizing: 'border-box', transition: `all ${tokens.transitions.fast}`,
          lineHeight: 1.6, ...style,
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
        }}
      />
      {errorMessage && <p style={{ margin: '4px 0 0', fontSize: tokens.fontSizes.xs, color: colors.error }}>{errorMessage}</p>}
    </div>
  );
}

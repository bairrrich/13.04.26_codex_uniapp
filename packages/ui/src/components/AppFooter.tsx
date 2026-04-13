'use client';

import { tokens } from '../tokens';
import type { CSSProperties, ReactNode } from 'react';

export interface AppFooterProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function AppFooter({ children, style, className }: AppFooterProps) {
  return (
    <footer
      className={className}
      style={{
        padding: '16px 24px',
        borderTop: `1px solid ${tokens.colors.border}`,
        background: tokens.colors.backgroundSecondary,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        ...style,
      }}
    >
      {children || (
        <>
          <p style={{ margin: 0, fontSize: tokens.fontSizes.xs, color: tokens.colors.muted }}>
            © {new Date().getFullYear()} SuperApp — Life Management OS
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/settings" style={{ fontSize: tokens.fontSizes.xs, color: tokens.colors.muted, textDecoration: 'none' }}>
              Настройки
            </a>
            <a href="#" style={{ fontSize: tokens.fontSizes.xs, color: tokens.colors.muted, textDecoration: 'none' }}>
              Помощь
            </a>
            <a href="#" style={{ fontSize: tokens.fontSizes.xs, color: tokens.colors.muted, textDecoration: 'none' }}>
              О приложении
            </a>
          </div>
        </>
      )}
    </footer>
  );
}

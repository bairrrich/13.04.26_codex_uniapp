'use client';

import { tokens } from '../tokens';
import { useTheme } from '../ThemeProvider';
import type { CSSProperties, ReactNode } from 'react';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  style?: CSSProperties;
  className?: string;
  themeColors?: ReturnType<typeof useTheme>['tokens'];
}

export function AppHeader({ title, subtitle, leftContent, rightContent, style, className }: AppHeaderProps) {
  const { tokens: colors } = useTheme();
  return (
    <header
      className={className}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: `1px solid ${colors.border}`,
        background: colors.background, position: 'sticky', top: 0, zIndex: 50, minHeight: 64, ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {leftContent}
        <div>
          {title && <h1 style={{ margin: 0, fontSize: tokens.fontSizes['2xl'], fontWeight: tokens.fontWeights.bold, color: colors.text, lineHeight: 1.3 }}>{title}</h1>}
          {subtitle && <p style={{ margin: 0, fontSize: tokens.fontSizes.sm, color: colors.muted }}>{subtitle}</p>}
        </div>
      </div>
      {rightContent && <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{rightContent}</div>}
    </header>
  );
}

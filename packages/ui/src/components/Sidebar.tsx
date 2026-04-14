'use client';

import { useTheme } from '../ThemeProvider';
import { tokens } from '../tokens';
import type { CSSProperties, ReactNode } from 'react';

export interface SidebarProps {
  children: ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
  width?: number;
  style?: CSSProperties;
  className?: string;
}

export function Sidebar({
  children,
  collapsed = false,
  onToggle,
  width = 260,
  style,
  className,
}: SidebarProps) {
  const { tokens: themeTokens } = useTheme();

  return (
    <aside
      className={className}
      style={{
        width: collapsed ? 64 : width,
        minWidth: collapsed ? 64 : width,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: themeTokens.backgroundSecondary,
        borderRight: `1px solid ${themeTokens.border}`,
        display: 'flex',
        flexDirection: 'column',
        transition: `width ${tokens.transitions.base}`,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </aside>
  );
}

export interface SidebarSectionProps {
  children: ReactNode;
  title?: string;
  style?: CSSProperties;
  className?: string;
}

export function SidebarSection({ children, title, style, className }: SidebarSectionProps) {
  const { tokens: themeTokens } = useTheme();

  return (
    <div className={className} style={{ padding: '12px 0', ...style }}>
      {title && (
        <div style={{
          padding: '0 16px',
          fontSize: tokens.fontSizes.xs,
          fontWeight: tokens.fontWeights.semibold,
          color: themeTokens.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 8,
        }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  href?: string;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function SidebarItem({
  icon,
  label,
  href,
  active = false,
  badge,
  onClick,
  style,
  className,
}: SidebarItemProps) {
  const { tokens: themeTokens } = useTheme();

  const content = (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        margin: '2px 8px',
        borderRadius: tokens.radius.md,
        cursor: 'pointer',
        background: active ? themeTokens.surfaceActive : 'transparent',
        color: active ? themeTokens.primary : themeTokens.textSecondary,
        transition: `all ${tokens.transitions.fast}`,
        textDecoration: 'none',
        position: 'relative',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = themeTokens.surfaceHover;
          (e.currentTarget as HTMLElement).style.color = themeTokens.text;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = active ? themeTokens.surfaceActive : 'transparent';
          (e.currentTarget as HTMLElement).style.color = active ? themeTokens.primary : themeTokens.textSecondary;
        }
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>{icon}</span>
      <span style={{ fontSize: tokens.fontSizes.sm, fontWeight: active ? tokens.fontWeights.semibold : tokens.fontWeights.normal, flex: 1 }}>
        {label}
      </span>
      {badge && (
        <span style={{
          background: themeTokens.primary,
          color: themeTokens.text,
          fontSize: tokens.fontSizes.xs,
          fontWeight: tokens.fontWeights.semibold,
          padding: '2px 6px',
          borderRadius: tokens.radius.full,
          minWidth: 18,
          textAlign: 'center',
        }}>
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none' }}>
        {content}
      </a>
    );
  }

  return content;
}

export interface SidebarFooterProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function SidebarFooter({ children, style, className }: SidebarFooterProps) {
  const { tokens: themeTokens } = useTheme();

  return (
    <div className={className} style={{
      marginTop: 'auto',
      padding: 16,
      borderTop: `1px solid ${themeTokens.border}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

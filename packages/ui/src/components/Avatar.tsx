'use client';

import { tokens } from '../tokens';
import { useTheme } from '../ThemeProvider';
import type { CSSProperties } from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: CSSProperties;
  className?: string;
}

const sizeMap = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 } as const;
const avatarColors = ['#5B6CFF', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function Avatar({ src, alt, name, size = 'md', style, className }: AvatarProps) {
  const { tokens: colors } = useTheme();
  const s = sizeMap[size];
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? getColor(name) : colors.primary;

  return (
    <div className={className} style={{ width: s, height: s, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, position: 'relative', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${colors.border}`, ...style }}>
      {src ? (
        <img src={src} alt={alt ?? name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ color: '#fff', fontSize: s * 0.35, fontWeight: 600, lineHeight: 1 }}>{initials}</span>
      )}
    </div>
  );
}

import { tokens } from '../tokens';
import type { CSSProperties, ReactNode } from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: CSSProperties;
  className?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
} as const;

const colors = ['#5B6CFF', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  style,
  className,
}: AvatarProps) {
  const s = sizeMap[size];
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? getColor(name) : tokens.colors.primary;

  return (
    <div
      className={className}
      style={{
        width: s,
        height: s,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? name ?? ''}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <span style={{
          color: '#fff',
          fontSize: s * 0.35,
          fontWeight: 600,
          lineHeight: 1,
        }}>
          {initials}
        </span>
      )}
    </div>
  );
}

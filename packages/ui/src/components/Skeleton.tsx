import { tokens } from '../tokens';
import type { CSSProperties } from 'react';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  variant?: 'rect' | 'circular' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
  style?: CSSProperties;
  className?: string;
}

export function Skeleton({
  width,
  height = 20,
  borderRadius,
  variant = 'rect',
  animation = 'pulse',
  style,
  className,
}: SkeletonProps) {
  const radius = variant === 'circular' ? '50%' : borderRadius ?? tokens.radius.md;

  return (
    <div
      className={className}
      style={{
        width: typeof width === 'number' ? `${width}px` : width ?? '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
        background: `linear-gradient(90deg, ${tokens.colors.surface} 25%, ${tokens.colors.surfaceHover} 50%, ${tokens.colors.surface} 75%)`,
        backgroundSize: '200% 100%',
        animation: animation === 'wave' ? 'skeleton-wave 1.5s ease-in-out infinite' 
          : animation === 'pulse' ? 'skeleton-pulse 1.5s ease-in-out infinite' 
          : 'none',
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ padding: 20, backgroundColor: tokens.colors.surface, borderRadius: tokens.radius.xl, border: `1px solid ${tokens.colors.border}` }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <Skeleton variant="circular" width={40} height={40} />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={`${85 - i * 15}%`}
          height={12}
          style={{ marginBottom: 8 }}
        />
      ))}
    </div>
  );
}

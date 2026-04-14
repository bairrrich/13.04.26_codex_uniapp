'use client';

import { tokens } from '../tokens';
import type { CSSProperties, ReactNode } from 'react';

export interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

export function StatCard({ icon, label, value, color, style, className }: StatCardProps) {
  return (
    <div
      className={className}
      style={{
        padding: 16,
        borderRadius: tokens.radius.xl,
        backgroundColor: 'var(--card-bg, transparent)',
        border: 'var(--card-border, none)',
        boxShadow: 'var(--card-shadow, none)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
        <div>
          <div
            style={{
              fontSize: tokens.fontSizes.xs,
              color: 'var(--color-text-secondary, #475569)',
              marginBottom: 2,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: tokens.fontSizes.xl,
              fontWeight: tokens.fontWeights.bold,
              color: color || 'var(--color-text, #1E293B)',
              lineHeight: 1.2,
            }}
          >
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

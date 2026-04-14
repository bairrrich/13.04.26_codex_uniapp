'use client';

import { tokens } from '../tokens';
import { useTheme } from '../ThemeProvider';
import type { CSSProperties, ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: CSSProperties;
  className?: string;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const sizeMap = {
  sm: { maxWidth: 400 },
  md: { maxWidth: 560 },
  lg: { maxWidth: 720 },
  xl: { maxWidth: 960 },
} as const;

export function Modal({ isOpen, onClose, title, children, size = 'md', style, className, closeOnOverlayClick = true, showCloseButton = true }: ModalProps) {
  const { tokens: colors } = useTheme();
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: tokens.zIndex.modal, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={closeOnOverlayClick ? onClose : undefined}>
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out' }} />

      {/* Modal Content */}
      <div className={`modal-content ${className || ''}`} onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', width: '100%', ...sizeMap[size], maxHeight: 'calc(100vh - 48px)',
        display: 'flex', flexDirection: 'column', background: colors.surface,
        borderRadius: tokens.radius.xl, border: `1px solid ${colors.border}`,
        boxShadow: tokens.shadows.xl, animation: 'slideInUp 0.25s ease-out', overflow: 'hidden', ...style,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: tokens.fontSizes.lg, fontWeight: tokens.fontWeights.semibold, color: colors.text }}>{title}</h2>
          {showCloseButton && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.muted, cursor: 'pointer', padding: 6, borderRadius: tokens.radius.md, fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: `all ${tokens.transitions.fast}` }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = colors.text; (e.currentTarget as HTMLElement).style.background = colors.surfaceHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = colors.muted; (e.currentTarget as HTMLElement).style.background = 'none'; }}
              title="Закрыть"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

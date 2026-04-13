// Design tokens - comprehensive design system
export const tokens = {
  colors: {
    // Primary
    primary: '#5B6CFF',
    primaryHover: '#4A5AEF',
    primaryActive: '#3D4BD8',
    primaryLight: 'rgba(91, 108, 255, 0.15)',

    // Background
    background: '#0B1020',
    backgroundSecondary: '#0F1525',
    surface: '#111827',
    surfaceHover: '#1a2332',
    surfaceActive: '#1e2a4a',

    // Border
    border: '#1e293b',
    borderHover: '#334155',
    borderFocus: '#5B6CFF',

    // Text
    text: '#F4F7FF',
    textSecondary: '#CBD5E1',
    muted: '#64748B',
    mutedLight: '#475569',

    // States
    success: '#22c55e',
    successBg: 'rgba(34, 197, 94, 0.15)',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.15)',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    info: '#3b82f6',
    infoBg: 'rgba(59, 130, 246, 0.15)',
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 22,
    '3xl': 28,
    '4xl': 36,
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 4px 6px rgba(0,0,0,0.3)',
    lg: '0 10px 15px rgba(0,0,0,0.4)',
    xl: '0 20px 25px rgba(0,0,0,0.5)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  zIndex: {
    dropdown: 100,
    sticky: 200,
    modal: 300,
    toast: 400,
  },
} as const;

export type Token = typeof tokens;

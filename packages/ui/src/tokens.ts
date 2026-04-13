// Design tokens
export const tokens = {
  colors: {
    primary: '#5B6CFF',
    primaryHover: '#4A5AEF',
    background: '#0B1020',
    surface: '#111827',
    surfaceHover: '#1e2a4a',
    border: '#333333',
    borderHover: '#5B6CFF',
    text: '#F4F7FF',
    muted: '#888888',
    success: '#34d399',
    error: '#ff6b6b',
    warning: '#fbbf24',
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
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  fontSizes: {
    xs: 12,
    sm: 13,
    md: 15,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
} as const;

export type Token = typeof tokens;

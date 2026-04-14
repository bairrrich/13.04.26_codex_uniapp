'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { darkTheme, lightTheme, type ThemeColors } from './themes';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  tokens: ThemeColors;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function ThemeProvider({ children, defaultTheme = 'dark' }: { children: ReactNode; defaultTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.style.colorScheme = theme;

    // Apply CSS custom properties and body styles
    const root = document.documentElement;
    const c = theme === 'dark' ? darkTheme.colors : lightTheme.colors;
    root.style.setProperty('--color-background', c.background);
    root.style.setProperty('--color-background-secondary', c.backgroundSecondary);
    root.style.setProperty('--color-surface', c.surface);
    root.style.setProperty('--color-surface-hover', c.surfaceHover);
    root.style.setProperty('--color-surface-active', c.surfaceActive);
    root.style.setProperty('--color-border', c.border);
    root.style.setProperty('--color-border-hover', c.borderHover);
    root.style.setProperty('--color-text', c.text);
    root.style.setProperty('--color-text-secondary', c.textSecondary);
    root.style.setProperty('--color-muted', c.muted);
    root.style.setProperty('--color-primary', c.primary);
    root.style.setProperty('--color-primary-light', c.primaryLight);
    root.style.setProperty('--color-success', c.success);
    root.style.setProperty('--color-error', c.error);
    root.style.setProperty('--color-warning', c.warning);

    // Apply body styles directly
    document.body.style.background = c.background;
    document.body.style.color = c.text;
  }, [theme]);

  const tokens = (theme === 'dark' ? darkTheme.colors : lightTheme.colors) as ThemeColors;

  return (
    <ThemeContext.Provider value={{ theme, tokens, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

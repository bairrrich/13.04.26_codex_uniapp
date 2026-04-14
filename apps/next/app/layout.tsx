import type { ReactNode } from 'react';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ThemeProvider } from '@superapp/ui';

export const metadata = {
  title: 'SuperApp',
  description: 'Life Management OS'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes skeleton-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes skeleton-wave {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-12px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(20px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          * {
            scrollbar-width: thin;
            scrollbar-color: var(--color-border-hover, #334155) var(--color-surface, #111827);
          }
          *::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          *::-webkit-scrollbar-track {
            background: var(--color-surface, #111827);
          }
          *::-webkit-scrollbar-thumb {
            background: var(--color-border-hover, #334155);
            border-radius: 4px;
          }
          *::-webkit-scrollbar-thumb:hover {
            background: var(--color-muted, #475569);
          }
          ::selection {
            background: var(--color-primary-light, rgba(91, 108, 255, 0.3));
            color: var(--color-text, #F4F7FF);
          }
          input::placeholder, textarea::placeholder {
            color: var(--color-muted, #475569);
          }
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          /* Responsive grids */
          @media (max-width: 768px) {
            .grid-responsive {
              grid-template-columns: 1fr !important;
            }
            .grid-2col {
              grid-template-columns: 1fr 1fr !important;
            }
            .hide-mobile {
              display: none !important;
            }
            .flex-wrap-mobile {
              flex-wrap: wrap !important;
            }
          }
          /* Modal full screen on mobile */
          @media (max-width: 640px) {
            .modal-content {
              max-width: 100vw !important;
              max-height: 100vh !important;
              margin: 0 !important;
              border-radius: 0 !important;
            }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, -apple-system, sans-serif', background: 'var(--color-background, #0B1020)', color: 'var(--color-text, #F4F7FF)' }}>
        <ThemeProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}

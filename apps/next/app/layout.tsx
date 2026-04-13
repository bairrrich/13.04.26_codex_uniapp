import type { ReactNode } from 'react';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

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
          * {
            scrollbar-width: thin;
            scrollbar-color: #334155 #111827;
          }
          *::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          *::-webkit-scrollbar-track {
            background: #111827;
          }
          *::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 4px;
          }
          *::-webkit-scrollbar-thumb:hover {
            background: #475569;
          }
          ::selection {
            background: rgba(91, 108, 255, 0.3);
            color: #F4F7FF;
          }
          input::placeholder, textarea::placeholder {
            color: #475569;
          }
          body {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}</style>
      </head>
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, -apple-system, sans-serif', background: '#0B1020', color: '#F4F7FF' }}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

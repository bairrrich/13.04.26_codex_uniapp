import type { ReactNode } from 'react';
import { UserProfile } from '../src/components/UserProfile';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

export const metadata = {
  title: 'SuperApp',
  description: 'Life Management OS'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', background: '#0B1020', color: '#F4F7FF' }}>
        <ErrorBoundary>
          <UserProfile />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

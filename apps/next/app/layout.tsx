import type { ReactNode } from 'react';

export const metadata = {
  title: 'SuperApp',
  description: 'Life Management OS'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>{children}</body>
    </html>
  );
}

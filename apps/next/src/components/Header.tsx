'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Text } from '@superapp/ui';

const navItems = [
  { path: '/diary', label: 'Дневник', icon: '📔' },
  { path: '/finance', label: 'Финансы', icon: '💰' },
  { path: '/nutrition', label: 'Питание', icon: '🍽️' },
  { path: '/fitness', label: 'Фитнес', icon: '🏋️' },
  { path: '/collections', label: 'Коллекции', icon: '📚' },
  { path: '/feed', label: 'Лента', icon: '📰' },
];

export function Header() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  return (
    <header style={{
      borderBottom: '1px solid #333',
      background: '#0B1020',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <nav style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        overflowX: 'auto',
        height: 56,
      }}>
        <Link href="/" style={{ textDecoration: 'none', marginRight: 16, flexShrink: 0 }}>
          <Text fontWeight={700} size="lg" style={{ color: '#5B6CFF' }}>SuperApp</Text>
        </Link>

        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            style={{
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: 8,
              background: isActive(item.path) ? '#1e2a4a' : 'transparent',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            <Text
              size="sm"
              style={{
                color: isActive(item.path) ? '#5B6CFF' : '#888',
                fontWeight: isActive(item.path) ? 600 : 400,
              }}
            >
              {item.icon} {item.label}
            </Text>
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        <Link
          href="/settings"
          style={{
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 8,
            background: isActive('/settings') ? '#1e2a4a' : 'transparent',
            transition: 'background 0.15s',
            flexShrink: 0,
          }}
        >
          <Text
            size="sm"
            style={{
              color: isActive('/settings') ? '#5B6CFF' : '#888',
              fontWeight: isActive('/settings') ? 600 : 400,
            }}
          >
            ⚙️ Настройки
          </Text>
        </Link>
      </nav>
    </header>
  );
}

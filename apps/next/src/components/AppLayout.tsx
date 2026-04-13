'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar, SidebarSection, SidebarItem, SidebarFooter,
  AppHeader, AppFooter,
  Avatar, Text, Badge, Button
} from '@superapp/ui';
import { tokens } from '@superapp/ui';

interface AppLayoutProps {
  children: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerRight?: ReactNode;
}

const navItems = [
  { section: 'Главная', icon: '🏠', href: '/' },
  { section: 'Модули', icon: '📦', href: null },
  { section: 'Дневник', icon: '📔', href: '/diary' },
  { section: 'Финансы', icon: '💰', href: '/finance' },
  { section: 'Питание', icon: '🍽️', href: '/nutrition' },
  { section: 'Фитнес', icon: '🏋️', href: '/fitness' },
  { section: 'Коллекции', icon: '📚', href: '/collections' },
  { section: 'Лента', icon: '📰', href: '/feed' },
];

export function AppLayout({
  children,
  headerTitle,
  headerSubtitle,
  headerRight,
}: AppLayoutProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (href: string | null) => {
    if (!href) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: tokens.colors.background }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none', // TODO: Add responsive behavior
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Sidebar */}
      <Sidebar collapsed={collapsed} width={260}>
        {/* Logo */}
        <div style={{
          padding: '16px 16px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <span style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${tokens.colors.primary}, ${tokens.colors.success})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}>
              S
            </span>
            {!collapsed && (
              <span style={{
                fontSize: tokens.fontSizes.lg,
                fontWeight: tokens.fontWeights.bold,
                color: tokens.colors.text,
              }}>
                SuperApp
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none',
              border: 'none',
              color: tokens.colors.muted,
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              fontSize: 16,
            }}
            title={collapsed ? 'Развернуть' : 'Свернуть'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <SidebarSection>
            {navItems.filter(item => item.section === 'Главная').map((item) => (
              <SidebarItem
                key={item.href!}
                icon={item.icon}
                label={item.section}
                href={item.href!}
                active={isActive(item.href)}
              />
            ))}
          </SidebarSection>

          <SidebarSection title={!collapsed ? 'Модули' : undefined}>
            {navItems.filter(item => item.section !== 'Главная' && item.href).map((item) => (
              <SidebarItem
                key={item.href!}
                icon={item.icon}
                label={item.section}
                href={item.href!}
                active={isActive(item.href)}
              />
            ))}
          </SidebarSection>
        </div>

        {/* User section */}
        <SidebarFooter>
          <Link href="/settings" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar size="sm" name="User" />
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fontWeight="semibold" truncate>Настройки</Text>
              </div>
            )}
          </Link>
        </SidebarFooter>
      </Sidebar>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top header */}
        <AppHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          rightContent={headerRight}
        />

        {/* Page content */}
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {children}
        </main>

        {/* Footer */}
        <AppFooter />
      </div>
    </div>
  );
}

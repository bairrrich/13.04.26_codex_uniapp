'use client';

import { useState, type ReactNode, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppHeader, AppFooter,
  Avatar, Text, type ThemeColors
} from '@superapp/ui';
import { tokens } from '@superapp/ui';
import { useIsMobile } from '../hooks/useIsMobile';
import { useTheme } from '@superapp/ui';

interface AppLayoutProps {
  children: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerRight?: ReactNode;
}

const navItems = [
  { section: 'Главная', icon: '🏠', href: '/' },
  { section: 'Дневник', icon: '📔', href: '/diary' },
  { section: 'Финансы', icon: '💰', href: '/finance' },
  { section: 'Питание', icon: '🍽️', href: '/nutrition' },
  { section: 'Фитнес', icon: '🏋️', href: '/fitness' },
  { section: 'Коллекции', icon: '📚', href: '/collections' },
  { section: 'Лента', icon: '📰', href: '/feed' },
];

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 72;

export function AppLayout({ children, headerTitle, headerSubtitle, headerRight }: AppLayoutProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile(768);
  const { theme, tokens: themeColors } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved === 'true';
    }
    return false;
  });

  // Persist collapsed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(collapsed));
    }
  }, [collapsed]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const isActive = (href: string | null) => {
    if (!href) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname?.startsWith(href + '/');
  };

  // Mobile
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: tokens.colors.background, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${tokens.colors.border}`, background: tokens.colors.backgroundSecondary, position: 'sticky', top: 0, zIndex: 50 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: tokens.colors.text, cursor: 'pointer', padding: 8, fontSize: 22, borderRadius: 8 }}>☰</button>
          <Link href="/" style={{ textDecoration: 'none', flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${tokens.colors.primary}, ${tokens.colors.success})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#fff' }}>S</div>
            <Text fontWeight={700} size="lg" style={{ color: tokens.colors.text }}>SuperApp</Text>
          </Link>
          {headerRight}
          {!headerRight && <Link href="/settings" style={{ textDecoration: 'none' }}><Avatar size="sm" name="User" /></Link>}
        </div>

        {headerTitle && (
          <div style={{ padding: '8px 16px 0', background: tokens.colors.backgroundSecondary }}>
            <Text size="xl" fontWeight="bold">{headerTitle}</Text>
            {headerSubtitle && <Text muted size="sm">{headerSubtitle}</Text>}
          </div>
        )}

        {sidebarOpen && (
          <>
            <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 99, animation: 'fadeIn 0.2s ease-out' }} />
            <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 'min(300px, 85vw)', background: tokens.colors.backgroundSecondary, zIndex: 100, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease-out', borderRight: `1px solid ${tokens.colors.border}` }}>
              <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${tokens.colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${tokens.colors.primary}, ${tokens.colors.success})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }}>S</div>
                  <Text fontWeight={700} size="lg">Меню</Text>
                </div>
                <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: tokens.colors.muted, cursor: 'pointer', fontSize: 22, padding: 6, borderRadius: 8 }}>✕</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', margin: '2px 8px', borderRadius: tokens.radius.md, background: isActive(item.href) ? tokens.colors.surfaceActive : 'transparent', color: isActive(item.href) ? tokens.colors.primary : tokens.colors.textSecondary }}>
                      <span style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: 'center' }}>{item.icon}</span>
                      <span style={{ fontSize: tokens.fontSizes.md, fontWeight: isActive(item.href) ? tokens.fontWeights.semibold : tokens.fontWeights.normal, flex: 1 }}>{item.section}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ padding: 16, borderTop: `1px solid ${tokens.colors.border}` }}>
                <Link href="/settings" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar size="sm" name="User" />
                  <div><Text size="sm" fontWeight="semibold">Настройки</Text><Text muted size="xs">v0.1.0</Text></div>
                </Link>
              </div>
            </div>
          </>
        )}

        <main style={{ flex: 1, padding: 16 }}>
          {children}
        </main>
        <div style={{ padding: 12, borderTop: `1px solid ${tokens.colors.border}`, textAlign: 'center' }}><Text muted size="xs">© {new Date().getFullYear()} SuperApp</Text></div>
      </div>
    );
  }

  // Desktop
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: themeColors.background, color: themeColors.text }}>
      <DesktopSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} activePath={pathname} isActive={isActive} items={navItems} themeColors={themeColors} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppHeader title={headerTitle} subtitle={headerSubtitle} rightContent={headerRight} />
        <main style={{ flex: 1, padding: 24, overflowY: 'auto', background: themeColors.background, color: themeColors.text }}>{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}

function DesktopSidebar({ collapsed, onToggle, isActive, items, themeColors: tc }: { collapsed: boolean; onToggle: () => void; activePath: string; isActive: (href: string) => boolean; items: typeof navItems; themeColors: ThemeColors }) {
  return (
    <aside style={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH, minWidth: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH, height: '100vh', position: 'sticky', top: 0, background: tc.backgroundSecondary, borderRight: `1px solid ${tc.border}`, display: 'flex', flexDirection: 'column', transition: `all ${tokens.transitions.base}`, overflow: 'hidden', zIndex: 50 }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '16px 0' : '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 10 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${tc.primary}, ${tc.success})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0, boxShadow: `0 4px 12px ${tc.primary}40` }}>S</div>
          {!collapsed && <span style={{ fontSize: tokens.fontSizes.lg, fontWeight: tokens.fontWeights.bold, color: tc.text, letterSpacing: '-0.02em' }}>SuperApp</span>}
        </Link>
      </div>

      {/* Items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {items.map((item) => (
          <DesktopSidebarItem key={item.href} icon={item.icon} label={item.section} href={item.href} active={isActive(item.href)} collapsed={collapsed} themeColors={tc} />
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        style={{ margin: '0 8px 8px', padding: collapsed ? '10px 0' : '10px 16px', borderRadius: 10, border: `1px solid ${tokens.colors.border}`, background: 'transparent', color: tokens.colors.muted, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: `all ${tokens.transitions.fast}`, width: `calc(100% - 16px)`, fontFamily: 'inherit' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tokens.colors.primary; (e.currentTarget as HTMLElement).style.color = tokens.colors.primary; (e.currentTarget as HTMLElement).style.background = tokens.colors.surfaceHover; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = tokens.colors.border; (e.currentTarget as HTMLElement).style.color = tokens.colors.muted; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        title={collapsed ? 'Развернуть' : 'Свернуть'}
      >
        <span style={{ fontSize: 18 }}>{collapsed ? '→' : '←'}</span>
        {!collapsed && <span style={{ fontWeight: tokens.fontWeights.medium }}>Свернуть</span>}
      </button>

      {/* Footer */}
      <div style={{ padding: collapsed ? '12px 8px' : '12px 16px', borderTop: `1px solid ${tokens.colors.border}` }}>
        <Link href="/settings" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '4px 0' : '4px 0' }}>
          <Avatar size="sm" name="User" />
          {!collapsed && <div><Text size="sm" fontWeight="semibold" truncate>Настройки</Text><Text muted size="xs">v0.1.0</Text></div>}
        </Link>
      </div>
    </aside>
  );
}

function DesktopSidebarItem({ icon, label, href, active, collapsed, themeColors: tc }: { icon: string; label: string; href: string; active: boolean; collapsed: boolean; themeColors: ThemeColors }) {
  const [hovered, setHovered] = useState(false);
  const [tooltipTop, setTooltipTop] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    setHovered(true);
    if (collapsed && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setTooltipTop(rect.top + rect.height / 2);
    }
  };

  return (
    <Link href={href} style={{ textDecoration: 'none', position: 'relative' }}>
      <div
        ref={ref}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '10px 0' : '10px 12px', margin: '2px 8px', borderRadius: tokens.radius.md, background: active ? tc.primaryLight : hovered ? tc.surfaceHover : 'transparent', color: active ? tc.primary : tc.textSecondary, justifyContent: collapsed ? 'center' : 'flex-start', transition: `all ${tokens.transitions.fast}` }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
      >
        {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: '60%', borderRadius: '0 2px 2px 0', background: tc.primary }} />}
        <span style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: 'center', transition: `transform ${tokens.transitions.fast}`, transform: hovered && !active ? 'scale(1.1)' : 'scale(1)' }}>{icon}</span>
        {!collapsed && <span style={{ fontSize: tokens.fontSizes.sm, fontWeight: active ? tokens.fontWeights.semibold : tokens.fontWeights.medium, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: tc.text }}>{label}</span>}
      </div>
      {collapsed && hovered && (
        <div style={{ position: 'fixed', left: SIDEBAR_COLLAPSED + 8, top: tooltipTop, transform: 'translateY(-50%)', padding: '6px 12px', borderRadius: tokens.radius.md, background: tc.surface, border: `1px solid ${tc.border}`, boxShadow: tokens.shadows.md, whiteSpace: 'nowrap', fontSize: tokens.fontSizes.sm, color: active ? tc.primary : tc.text, fontWeight: active ? tokens.fontWeights.semibold : tokens.fontWeights.normal, pointerEvents: 'none', zIndex: 9999, animation: 'fadeIn 0.15s ease-out' }}>{label}</div>
      )}
    </Link>
  );
}

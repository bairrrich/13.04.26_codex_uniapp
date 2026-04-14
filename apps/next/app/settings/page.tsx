'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { AppLayout } from '../../src/components/AppLayout';
import { Card, Text, Input, Button, Avatar, Badge, useTheme, type Theme } from '@superapp/ui';
import { tokens } from '@superapp/ui';

const TIMEZONES = [
  'Europe/Moscow', 'Europe/Kaliningrad', 'Europe/Samara', 'Asia/Yekaterinburg',
  'Asia/Omsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Yakutsk',
  'Asia/Vladivostok', 'Asia/Magadan', 'Asia/Kamchatka',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai',
];

const SECTIONS = [
  { id: 'profile', label: '👤 Профиль' },
  { id: 'appearance', label: '🎨 Оформление' },
  { id: 'security', label: '🔒 Безопасность' },
  { id: 'account', label: '📋 Аккаунт' },
] as const;
type Section = typeof SECTIONS[number]['id'];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState<Section>('profile');

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setDisplayName(user.user_metadata?.name ?? '');
        setTimezone(user.user_metadata?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
    });
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const { error } = await supabase.auth.updateUser({ data: { name: displayName, timezone } });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdSaving(true);
    setPwdError('');
    if (newPassword.length < 6) {
      setPwdError('Пароль должен содержать минимум 6 символов');
      setPwdSaving(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Пароли не совпадают');
      setPwdSaving(false);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwdSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setPwdSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (!user) {
    return (
      <AppLayout headerTitle="Настройки" headerSubtitle="Профиль и аккаунт">
        <Text muted>Необходима авторизация</Text>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      headerTitle="Настройки"
      headerSubtitle="Профиль и аккаунт"
      headerRight={<Button variant="danger" size="sm" onPress={handleSignOut}>Выйти</Button>}
    >
      <div style={{ maxWidth: 720 }}>
        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              style={{
                padding: '8px 16px',
                borderRadius: tokens.radius.md,
                border: `1px solid ${section === s.id ? tokens.colors.primary : tokens.colors.border}`,
                background: section === s.id ? tokens.colors.primaryLight : 'transparent',
                color: section === s.id ? tokens.colors.primary : tokens.colors.textSecondary,
                fontWeight: section === s.id ? tokens.fontWeights.semibold : tokens.fontWeights.medium,
                fontSize: tokens.fontSizes.sm,
                cursor: 'pointer',
                transition: `all ${tokens.transitions.fast}`,
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Profile section */}
        {section === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card padding="2xl">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Avatar size="xl" name={displayName || user.email} />
                <div style={{ flex: 1 }}>
                  <Text fontWeight="semibold" size="lg">{displayName || 'Без имени'}</Text>
                  <Text muted>{user.email}</Text>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Имя</Text>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ваше имя" fullWidth />
                </div>
                <div>
                  <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Часовой пояс</Text>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: tokens.radius.lg,
                      border: `1px solid ${tokens.colors.border}`,
                      background: tokens.colors.surface,
                      color: tokens.colors.text,
                      fontSize: tokens.fontSizes.md,
                      fontFamily: 'inherit',
                    }}
                  >
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
                <Button onPress={handleSaveProfile} loading={saving} fullWidth size="lg">
                  Сохранить
                </Button>
                {saved && <Text success>✓ Настройки сохранены!</Text>}
              </div>
            </Card>
          </div>
        )}

        {/* Appearance section */}
        {section === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card padding="2xl">
              <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>🎨 Тема оформления</Text>
              <div style={{ display: 'flex', gap: 12 }}>
                <ThemeOption
                  theme="dark"
                  current={theme}
                  onClick={() => setTheme('dark')}
                />
                <ThemeOption
                  theme="light"
                  current={theme}
                  onClick={() => setTheme('light')}
                />
              </div>
            </Card>

            <Card padding="2xl">
              <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>🎨 Предпросмотр цветов</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                <ColorSwatch label="Primary" color="var(--color-primary, #5B6CFF)" />
                <ColorSwatch label="Success" color="var(--color-success, #22c55e)" />
                <ColorSwatch label="Error" color="var(--color-error, #ef4444)" />
                <ColorSwatch label="Warning" color="var(--color-warning, #f59e0b)" />
                <ColorSwatch label="Surface" color="var(--color-surface, #111827)" />
                <ColorSwatch label="Background" color="var(--color-background, #0B1020)" />
              </div>
            </Card>
          </div>
        )}

        {/* Security section */}
        {section === 'security' && (
          <Card padding="2xl">
            <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>🔒 Смена пароля</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Новый пароль</Text>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Минимум 6 символов" fullWidth />
              </div>
              <div>
                <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Подтверждение</Text>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторите пароль" fullWidth />
              </div>
              {pwdError && <Text error>{pwdError}</Text>}
              {pwdSuccess && <Text success>✓ Пароль изменён!</Text>}
              <Button onPress={handleChangePassword} loading={pwdSaving} fullWidth size="lg" disabled={!newPassword || !confirmPassword}>
                Изменить пароль
              </Button>
            </div>
          </Card>
        )}

        {/* Account section */}
        {section === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card padding="2xl">
              <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>📋 Информация об аккаунте</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <InfoRow label="Email" value={user.email || '—'} />
                <InfoRow label="ID" value={user.id} mono />
                <InfoRow label="Создан" value={new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })} />
                <InfoRow label="Последний вход" value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
                <InfoRow label="Email подтверждён" value={user.email_confirmed_at ? 'Да' : 'Нет'} />
              </div>
            </Card>

            <Card padding="2xl" style={{ borderColor: tokens.colors.error }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <Text fontWeight="semibold" size="lg" style={{ color: tokens.colors.error }}>⚠️ Выход из аккаунта</Text>
                  <Text muted size="sm">Завершите текущую сессию</Text>
                </div>
                <Button variant="danger" onPress={handleSignOut}>Выйти</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${tokens.colors.border}` }}>
      <Text muted size="sm">{label}</Text>
      <Text size="sm" fontWeight="medium" style={{ fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? 12 : undefined, wordBreak: 'break-all', maxWidth: 300, textAlign: 'right' }}>{value}</Text>
    </div>
  );
}

function ThemeOption({ theme, current, onClick }: { theme: Theme; current: Theme; onClick: () => void }) {
  const isDark = theme === 'dark';
  const isSelected = theme === current;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: 16,
        borderRadius: tokens.radius.xl,
        border: `2px solid ${isSelected ? tokens.colors.primary : tokens.colors.border}`,
        background: isDark ? '#0B1020' : '#F8FAFC',
        cursor: 'pointer',
        transition: `all ${tokens.transitions.fast}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* Preview circles */}
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: isDark ? '#111827' : '#FFFFFF', border: `1px solid ${isDark ? '#1e293b' : '#E2E8F0'}` }} />
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: isDark ? '#1e2a4a' : '#EEF2FF' }} />
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#5B6CFF' }} />
      </div>
      <Text fontWeight={isSelected ? 'bold' : 'medium'} size="sm" style={{ color: isSelected ? tokens.colors.primary : tokens.colors.text }}>
        {isDark ? '🌙 Тёмная' : '☀️ Светлая'}
      </Text>
      {isSelected && (
        <Badge variant="primary" size="sm">Выбрана</Badge>
      )}
    </button>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ height: 32, borderRadius: tokens.radius.md, background: color, border: `1px solid ${tokens.colors.border}` }} />
      <Text muted size="xs" style={{ textAlign: 'center' }}>{label}</Text>
    </div>
  );
}

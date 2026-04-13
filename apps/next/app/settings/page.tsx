'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { AppLayout } from '../../src/components/AppLayout';
import { Card, Text, Heading, Input, Button, Avatar, Divider } from '@superapp/ui';
import { tokens } from '@superapp/ui';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setDisplayName(user.user_metadata?.name ?? '');
        setTimezone(user.user_metadata?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: displayName, timezone },
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setLoading(false);
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
      headerRight={
        <Button variant="danger" size="sm" onPress={handleSignOut}>Выйти</Button>
      }
    >
      <div style={{ maxWidth: 640 }}>
        {/* Profile */}
        <Card padding="2xl" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <Avatar size="xl" name={displayName || user.email} />
            <div>
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
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Europe/Moscow" fullWidth />
            </div>

            <Button onPress={handleSave} loading={loading} fullWidth size="lg">
              Сохранить
            </Button>

            {success && <Text success>Настройки сохранены!</Text>}
          </div>
        </Card>

        {/* Account Info */}
        <Card padding="2xl">
          <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>Аккаунт</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InfoRow label="ID" value={user.id.slice(0, 8) + '...'} />
            <InfoRow label="Создан" value={new Date(user.created_at).toLocaleDateString('ru-RU')} />
            <InfoRow label="Последний вход" value={user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('ru-RU') : '—'} />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${tokens.colors.border}` }}>
      <Text muted size="sm">{label}</Text>
      <Text size="sm" fontWeight="medium">{value}</Text>
    </div>
  );
}

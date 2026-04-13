'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Heading, Card, Text, Input, Button } from '@superapp/ui';

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

  if (!user) {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
        <Text muted>Необходима авторизация</Text>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <Heading style={{ marginBottom: 24 }}>⚙️ Настройки</Heading>

      <Card padding="2xl" style={{ marginBottom: 16 }}>
        <Text fontWeight={600} size="lg" style={{ marginBottom: 16 }}>Профиль</Text>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Email</Text>
            <Text>{user.email}</Text>
          </div>

          <div>
            <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Имя</Text>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ваше имя"
              fullWidth
            />
          </div>

          <div>
            <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Часовой пояс</Text>
            <Input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Europe/Moscow"
              fullWidth
            />
          </div>

          <Button onPress={handleSave} loading={loading} fullWidth size="lg">
            Сохранить
          </Button>

          {success && <Text success>Настройки сохранены!</Text>}
        </div>
      </Card>

      <Card padding="2xl">
        <Text fontWeight={600} size="lg" style={{ marginBottom: 12 }}>Аккаунт</Text>
        <Text muted size="sm">ID: {user.id}</Text>
        <Text muted size="sm">Создан: {new Date(user.created_at).toLocaleDateString('ru-RU')}</Text>
      </Card>
    </main>
  );
}

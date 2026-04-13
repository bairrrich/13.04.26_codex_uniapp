'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '../../src/components/AppLayout';
import { Card, Text, Skeleton, Button } from '@superapp/ui';
import { tokens } from '@superapp/ui';

const moduleTabs = [
  { label: 'Посты', href: '/feed' },
  { label: 'Активность', href: '/feed/activity' },
  { label: 'Комментарии', href: '/feed/comments' },
];

export default function FeedPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppLayout
      headerTitle="Лента"
      headerSubtitle="Посты и события активности"
      headerRight={
        <Button variant="primary" size="sm">+ Новый пост</Button>
      }
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {moduleTabs.map((tab) => (
          <a key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
            <Button variant={tab.href === '/feed' ? 'primary' : 'ghost'} size="sm">{tab.label}</Button>
          </a>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <Card key={i} padding="lg">
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <Skeleton variant="circular" width={36} height={36} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="30%" height={14} style={{ marginBottom: 4 }} />
                  <Skeleton width="20%" height={12} />
                </div>
              </div>
              <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={12} />
            </Card>
          ))}
        </div>
      ) : (
        <Card padding="2xl" variant="outlined">
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
            <Text muted size="xl" style={{ marginBottom: 8 }}>Лента пуста</Text>
            <Text muted>Создайте первый пост или дождитесь событий из других модулей</Text>
          </div>
        </Card>
      )}
    </AppLayout>
  );
}

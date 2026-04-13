'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../src/components/AppLayout';
import { Card, Text, Badge, Skeleton, Button } from '@superapp/ui';
import { tokens } from '@superapp/ui';

const moduleTabs = [
  { label: 'Все', href: '/collections' },
  { label: 'Книги', href: '/collections?type=book' },
  { label: 'Фильмы', href: '/collections?type=movie' },
  { label: 'Рецепты', href: '/collections?type=recipe' },
  { label: 'Добавки', href: '/collections?type=supplement' },
];

export default function CollectionsPage() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ book: 0, movie: 0, recipe: 0, supplement: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setCounts({ book: 5, movie: 12, recipe: 3, supplement: 2 });
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppLayout
      headerTitle="Коллекции"
      headerSubtitle="Книги, фильмы, рецепты и добавки"
      headerRight={
        <Button variant="primary" size="sm">+ Добавить</Button>
      }
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {moduleTabs.map((tab) => (
          <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
            <Button variant={tab.href === '/collections' ? 'primary' : 'ghost'} size="sm">{tab.label}</Button>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="lg">
              <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={24} />
            </Card>
          ))
        ) : (
          <>
            <TypeStatCard icon="📚" label="Книги" count={counts.book} color={tokens.colors.primary} />
            <TypeStatCard icon="🎬" label="Фильмы" count={counts.movie} color={tokens.colors.info} />
            <TypeStatCard icon="🍳" label="Рецепты" count={counts.recipe} color={tokens.colors.warning} />
            <TypeStatCard icon="💊" label="Добавки" count={counts.supplement} color={tokens.colors.success} />
          </>
        )}
      </div>

      <Card padding="2xl" variant="outlined">
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <Text muted size="xl" style={{ marginBottom: 8 }}>Раздел в разработке</Text>
          <Text muted>Здесь будет управление коллекциями с фильтрами, рейтингами и статусами</Text>
        </div>
      </Card>
    </AppLayout>
  );
}

function TypeStatCard({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
  return (
    <Card padding="lg">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <Text muted>{label}</Text>
      </div>
      <Text size="xl" fontWeight="bold" style={{ color }}>{count}</Text>
    </Card>
  );
}

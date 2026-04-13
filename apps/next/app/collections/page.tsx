'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heading, Card, Text, Badge, Skeleton } from '@superapp/ui';
import { CollectionForm } from '../../src/features/collections/components/CollectionForm';
import { CollectionList } from '../../src/features/collections/components/CollectionList';
import {
  collectionsService,
  type CollectionItem,
  type CollectionType,
  type TypeCount,
} from '../../src/features/collections/services/collectionsService';
import { AppLayout } from '../../src/components/AppLayout';

const typeEmojis: Record<CollectionType, string> = { book: '📚', movie: '🎬', recipe: '🍳', supplement: '💊' };
const typeLabels: Record<CollectionType, string> = { book: 'Книги', movie: 'Фильмы', recipe: 'Рецепты', supplement: 'Добавки' };
const typeBadgeVariant: Record<CollectionType, 'primary' | 'info' | 'warning' | 'success'> = {
  book: 'primary',
  movie: 'info',
  recipe: 'warning',
  supplement: 'success',
};

const typeTabs: (CollectionType | 'all')[] = ['all', 'book', 'movie', 'recipe', 'supplement'];

function StatsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} padding="md" variant="outlined">
          <Skeleton width="40px" height="24px" />
          <Skeleton width="80px" height="16px" style={{ marginTop: 6 }} />
        </Card>
      ))}
    </div>
  );
}

export default function CollectionsPage() {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<CollectionType | 'all'>('all');
  const [typeCounts, setTypeCounts] = useState<TypeCount[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const options = typeFilter === 'all' ? undefined : { type: typeFilter };
      const result = await collectionsService.list(options);
      setItems(result.data);
    } catch (e) {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const counts = await collectionsService.countByType();
      setTypeCounts(counts);
    } catch {
      // Stats error is non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalCount = typeCounts.reduce((sum, c) => sum + c.count, 0);

  return (
    <AppLayout headerTitle="Коллекции" headerSubtitle="Книги, фильмы, рецепты и добавки">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Stats section */}
        {statsLoading ? (
          <StatsSkeleton />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            <Card padding="md" variant="outlined" style={{ textAlign: 'center' }}>
              <Text size="2xl" fontWeight={700}>{totalCount}</Text>
              <Text size="sm" muted>Всего</Text>
            </Card>
            {typeCounts.map(({ type, count }) => (
              <Card
                key={type}
                padding="md"
                variant="outlined"
                clickable
                onClick={() => setTypeFilter(type)}
                style={{
                  textAlign: 'center',
                  borderColor: typeFilter === type ? undefined : undefined,
                }}
              >
                <Text size="xl">{typeEmojis[type]}</Text>
                <Text size="xl" fontWeight={700}>{count}</Text>
                <Badge variant={typeBadgeVariant[type]} size="xs">
                  {typeLabels[type]}
                </Badge>
              </Card>
            ))}
          </div>
        )}

        {/* Type filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {typeTabs.map((tab) => {
            const isActive = typeFilter === tab;
            const count = tab === 'all'
              ? totalCount
              : (typeCounts.find((c) => c.type === tab)?.count ?? 0);

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setTypeFilter(tab)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: isActive ? 'none' : '1px solid #1e293b',
                  backgroundColor: isActive ? '#5B6CFF' : 'transparent',
                  color: isActive ? '#fff' : '#CBD5E1',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 200ms',
                }}
              >
                {tab !== 'all' && typeEmojis[tab as CollectionType]}
                {tab === 'all' ? 'Все' : typeLabels[tab as CollectionType]}
                <span style={{
                  fontSize: 12,
                  opacity: 0.7,
                }}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Error state */}
        {error && (
          <Card padding="md" variant="outlined" style={{ marginBottom: 16, borderColor: '#ef4444' }}>
            <Text style={{ color: '#ef4444' }}>{error}</Text>
          </Card>
        )}

        {/* Form section */}
        <CollectionForm onSuccess={fetchData} />

        {/* List section */}
        <CollectionList
          items={items}
          loading={loading}
          onRefresh={fetchData}
          typeFilter={typeFilter}
        />
      </div>
    </AppLayout>
  );
}

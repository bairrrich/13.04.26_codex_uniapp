'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../src/components/AppLayout';
import { Card, Text, Badge, Button, Skeleton, useTheme, StatCard } from '@superapp/ui';
import { collectionsService, type CollectionStats, type CollectionType } from '../../src/features/collections/services/collectionsService';
import { BooksTab } from '../../src/features/collections/components/BooksTab';
import { MoviesTab } from '../../src/features/collections/components/MoviesTab';
import { RecipesTab } from '../../src/features/collections/components/RecipesTab';
import { SupplementsTab } from '../../src/features/collections/components/SupplementsTab';
import { useIsMobile } from '../../src/hooks/useIsMobile';

const TABS = ['Обзор', 'Книги', 'Фильмы', 'Рецепты', 'Добавки'] as const;
type Tab = (typeof TABS)[number];

const typeIcons: Record<CollectionType, string> = { book: '📚', movie: '🎬', recipe: '🍳', supplement: '💊' };
const typeLabels: Record<CollectionType, string> = { book: 'Книги', movie: 'Фильмы', recipe: 'Рецепты', supplement: 'Добавки' };

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Обзор');
  const { tokens: c } = useTheme();
  const isMobile = useIsMobile(768);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CollectionStats | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await collectionsService.getStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  return (
    <AppLayout
      headerTitle="Коллекции"
      headerSubtitle="Книги, фильмы, рецепты и добавки"
    >
      {/* Tabs */}
      <div style={{ display: 'flex', gap: isMobile ? 2 : 4, marginBottom: 24, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 8 }}>
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            size={isMobile ? 'xs' : 'sm'}
            onPress={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Обзор' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} padding="lg">
                  <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
                  <Skeleton width="40%" height={24} />
                </Card>
              ))
            ) : stats && (
              <>
                <StatCard icon="📦" label="Всего" value={String(stats.total)} />
                {(['book', 'movie', 'recipe', 'supplement'] as CollectionType[]).map((type) => (
                  <StatCard key={type} icon={typeIcons[type]} label={typeLabels[type]} value={String(stats.byType[type])} />
                ))}
              </>
            )}
          </div>

          {/* Status Breakdown */}
          {stats && !loading && (
            <Card padding="lg">
              <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>📊 По статусам</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {[
                  { key: 'planned' as const, icon: '📋', label: 'Запланировано' },
                  { key: 'in_progress' as const, icon: '⏳', label: 'В процессе' },
                  { key: 'completed' as const, icon: '✅', label: 'Завершено' },
                  { key: 'dropped' as const, icon: '❌', label: 'Отменено' },
                ].map(({ key, icon, label }) => (
                  <div key={key} style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: c.surfaceHover }}>
                    <Text size="2xl" fontWeight="bold">{stats.byStatus[key]}</Text>
                    <Text muted size="sm">{icon} {label}</Text>
                  </div>
                ))}
              </div>
              {stats.avgRating && (
                <Text muted size="sm" style={{ marginTop: 12, textAlign: 'center' }}>
                  ⭐ Средний рейтинг: {stats.avgRating.toFixed(1)}/5
                </Text>
              )}
            </Card>
          )}

          {/* Quick Navigation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {(['book', 'movie', 'recipe', 'supplement'] as CollectionType[]).map((type) => {
              const tabName = type === 'book' ? 'Книги' : type === 'movie' ? 'Фильмы' : type === 'recipe' ? 'Рецепты' : 'Добавки';
              return (
                <div
                  key={type}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveTab(tabName)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveTab(tabName);
                    }
                  }}
                >
                  <Card padding="lg" hoverable>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 36 }}>{typeIcons[type]}</span>
                      <div>
                        <Text fontWeight="semibold" size="lg">{typeLabels[type]}</Text>
                        <Text muted size="sm">
                          {stats ? `${stats.byType[type]} записей` : 'Загрузка...'}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Type Tabs */}
      {activeTab === 'Книги' && <BooksTab />}
      {activeTab === 'Фильмы' && <MoviesTab />}
      {activeTab === 'Рецепты' && <RecipesTab />}
      {activeTab === 'Добавки' && <SupplementsTab />}
    </AppLayout>
  );
}

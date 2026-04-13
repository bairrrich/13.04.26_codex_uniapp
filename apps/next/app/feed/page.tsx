'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heading, Card, Text, Badge, SkeletonCard, tokens } from '@superapp/ui';
import { FeedPostForm } from '../../src/features/feed/components/FeedPostForm';
import { FeedList } from '../../src/features/feed/components/FeedList';
import { feedService, type FeedPost, type ActivityEvent } from '../../src/features/feed/services/feedService';
import { AppLayout } from '../../src/components/AppLayout';

interface FeedStats {
  totalPosts: number;
  totalEvents: number;
}

function StatsSkeleton() {
  return (
    <Card padding="lg">
      <div style={{ display: 'flex', gap: tokens.space.lg, justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'center' }}>
          <SkeletonCard lines={1} />
          <div style={{ marginTop: tokens.space.sm }}>
            <SkeletonCard lines={1} />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <SkeletonCard lines={1} />
          <div style={{ marginTop: tokens.space.sm }}>
            <SkeletonCard lines={1} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function StatsHeader({ stats, loading }: { stats: FeedStats | null; loading: boolean }) {
  if (loading) {
    return <StatsSkeleton />;
  }

  if (!stats) return null;

  return (
    <Card padding="lg" style={{ marginBottom: tokens.space.lg }}>
      <div style={{ display: 'flex', gap: tokens.space['2xl'], justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'center' }}>
          <Heading level={2} style={{ margin: 0, fontSize: tokens.fontSizes['2xl'] }}>
            {stats.totalPosts}
          </Heading>
          <Text muted size="sm" style={{ marginTop: tokens.space.xs }}>
            Постов
          </Text>
        </div>
        <div style={{ width: 1, background: tokens.colors.border }} />
        <div style={{ textAlign: 'center' }}>
          <Heading level={2} style={{ margin: 0, fontSize: tokens.fontSizes['2xl'] }}>
            {stats.totalEvents}
          </Heading>
          <Text muted size="sm" style={{ marginTop: tokens.space.xs }}>
            Событий
          </Text>
        </div>
      </div>
    </Card>
  );
}

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [postsResult, eventsResult] = await Promise.all([
        feedService.list({ page: 1, limit: 50 }),
        feedService.listEvents({ page: 1, limit: 50 }),
      ]);
      setPosts(postsResult.data);
      setEvents(eventsResult.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки ленты';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const result = await feedService.getStats();
      setStats({
        totalPosts: result.totalPosts,
        totalEvents: result.totalEvents,
      });
    } catch {
      // silently ignore stats errors
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  return (
    <AppLayout headerTitle="Лента" headerSubtitle="Посты и события">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {error && (
          <Card padding="md" style={{ marginBottom: tokens.space.lg, borderColor: tokens.colors.error }}>
            <Text style={{ color: tokens.colors.error }}>{error}</Text>
          </Card>
        )}

        <StatsHeader stats={stats} loading={statsLoading} />

        <section style={{ marginBottom: tokens.space.xl }}>
          <FeedPostForm onSuccess={() => {
            fetchData();
            fetchStats();
          }} />
        </section>

        <section>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.space.md }}>
              <SkeletonCard lines={2} />
              <SkeletonCard lines={3} />
              <SkeletonCard lines={2} />
            </div>
          ) : (
            <FeedList
              posts={posts}
              events={events}
              loading={loading}
              onRefresh={() => {
                fetchData();
                fetchStats();
              }}
            />
          )}
        </section>
      </div>
    </AppLayout>
  );
}

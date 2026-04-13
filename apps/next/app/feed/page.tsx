'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heading, Card, Text } from '@superapp/ui';
import { FeedPostForm } from '../../src/features/feed/components/FeedPostForm';
import { FeedList } from '../../src/features/feed/components/FeedList';
import { feedService, type FeedPost, type ActivityEvent } from '../../src/features/feed/services/feedService';

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [postsData, eventsData] = await Promise.all([
        feedService.list(),
        feedService.listEvents(),
      ]);
      setPosts(postsData);
      setEvents(eventsData);
    } catch (err) {
      setError('Ошибка загрузки ленты');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <Heading level={1}>📰 Лента</Heading>
      {error && (
        <Card padding="md" style={{ marginBottom: 16, borderColor: '#ff6b6b' }}>
          <Text error>{error}</Text>
        </Card>
      )}
      <FeedPostForm onSuccess={fetchData} />
      <FeedList posts={posts} events={events} loading={loading} onRefresh={fetchData} />
    </main>
  );
}

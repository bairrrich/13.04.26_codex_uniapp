'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeedPostForm } from '../../src/features/feed/components/FeedPostForm';
import { FeedList } from '../../src/features/feed/components/FeedList';
import { feedService, type FeedPost, type ActivityEvent } from '../../src/features/feed/services/feedService';

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [postsData, eventsData] = await Promise.all([
        feedService.list(),
        feedService.listEvents(),
      ]);
      setPosts(postsData);
      setEvents(eventsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1>📰 Лента</h1>
      <FeedPostForm onSuccess={fetchData} />
      <FeedList posts={posts} events={events} loading={loading} onRefresh={fetchData} />
    </main>
  );
}

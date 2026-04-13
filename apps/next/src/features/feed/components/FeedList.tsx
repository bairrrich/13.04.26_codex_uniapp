'use client';

import { feedService, type FeedPost, type ActivityEvent } from '../services/feedService';
import { Card, Text, Badge, Button } from '@superapp/ui';

interface FeedListProps {
  posts: FeedPost[];
  events: ActivityEvent[];
  loading: boolean;
  onRefresh: () => void;
}

const typeLabels: Record<string, string> = {
  'diary.created': '📔 Запись в дневнике',
  'transaction.created': '💰 Транзакция',
  'meal.logged': '🍽️ Приём пищи',
  'workout.completed': '🏋️ Тренировка',
  'collection.added': '📚 Новое в коллекции',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FeedList({ posts, events, loading, onRefresh }: FeedListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить пост?')) return;
    try {
      await feedService.delete(id);
      onRefresh();
    } catch {
      alert('Ошибка удаления');
    }
  };

  if (loading) {
    return <Text muted style={{ padding: 24, textAlign: 'center' }}>Загрузка...</Text>;
  }

  const allItems = [
    ...posts.map((p) => ({ ...p, kind: 'post' as const })),
    ...events.map((e) => ({ ...e, kind: 'event' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (allItems.length === 0) {
    return <Text muted style={{ padding: 24, textAlign: 'center' }}>Лента пуста</Text>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {allItems.map((item) => (
        <Card key={item.id} padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <Badge variant={item.kind === 'post' ? 'default' : 'primary'} size="sm">
              {item.kind === 'post' ? '📝 Пост' : typeLabels[item.type] ?? `📌 ${item.type}`}
            </Badge>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Text muted size="sm">{formatDate(item.created_at)}</Text>
              {item.kind === 'post' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => handleDelete(item.id)}
                  style={{ color: '#ff6b6b', padding: '2px 6px' }}
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
          {item.kind === 'post' && (
            <Text style={{ lineHeight: 1.5 }}>{item.content}</Text>
          )}
          {item.kind === 'event' && (
            <Text muted size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(item.payload, null, 2)}
            </Text>
          )}
        </Card>
      ))}
    </div>
  );
}

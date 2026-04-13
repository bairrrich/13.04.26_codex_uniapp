'use client';

import { feedService, type FeedPost, type ActivityEvent } from '../services/feedService';

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
    return <div style={{ padding: 24, textAlign: 'center' }}>Загрузка...</div>;
  }

  const allItems = [
    ...posts.map((p) => ({ ...p, kind: 'post' as const })),
    ...events.map((e) => ({ ...e, kind: 'event' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (allItems.length === 0) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>Лента пуста</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {allItems.map((item) => (
        <div
          key={item.id}
          style={{
            padding: 14,
            borderRadius: 10,
            border: '1px solid #333',
            background: item.kind === 'post' ? '#111827' : '#0f1724',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#888' }}>
              {item.kind === 'post' ? '📝 Пост' : typeLabels[item.type] ?? `📌 ${item.type}`}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#666' }}>{formatDate(item.created_at)}</span>
              {item.kind === 'post' && (
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff6b6b',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '2px 6px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          {item.kind === 'post' && (
            <p style={{ margin: 0, lineHeight: 1.5 }}>{item.content}</p>
          )}
          {item.kind === 'event' && (
            <pre style={{ margin: 0, fontSize: 12, color: '#aaa', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(item.payload, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

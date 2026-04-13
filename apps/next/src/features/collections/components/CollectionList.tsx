'use client';

import { collectionsService, type CollectionItem } from '../services/collectionsService';

interface CollectionListProps {
  items: CollectionItem[];
  loading: boolean;
  onRefresh: () => void;
}

const statusLabels: Record<string, string> = {
  planned: '📋 Запланировано',
  in_progress: '⏳ В процессе',
  completed: '✅ Завершено',
  dropped: '❌ Отменено',
};

const typeEmojis: Record<string, string> = { book: '📚', movie: '🎬', recipe: '🍳', supplement: '💊' };

export function CollectionList({ items, loading, onRefresh }: CollectionListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить?')) return;
    try {
      await collectionsService.delete(id);
      onRefresh();
    } catch {
      alert('Ошибка');
    }
  };

  const handleStatusChange = async (id: string, status: CollectionItem['status']) => {
    try {
      await collectionsService.update(id, { status });
      onRefresh();
    } catch {
      alert('Ошибка');
    }
  };

  const handleRatingChange = async (id: string, rating: number) => {
    try {
      await collectionsService.update(id, { rating });
      onRefresh();
    } catch {
      alert('Ошибка');
    }
  };

  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Загрузка...</div>;
  if (items.length === 0) return <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>Коллекция пуста</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            padding: 14,
            borderRadius: 10,
            border: '1px solid #333',
            background: '#111827',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 20, marginRight: 8 }}>{typeEmojis[item.type]}</span>
              <strong>{item.title}</strong>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 16 }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(item.id, e.target.value as CollectionItem['status'])}
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid #444',
                background: '#1a1a2e',
                color: '#F4F7FF',
                fontSize: 13,
              }}
            >
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => handleRatingChange(item.id, r)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 18,
                    color: (item.rating ?? 0) >= r ? '#fbbf24' : '#444',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

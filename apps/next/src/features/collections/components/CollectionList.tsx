'use client';

import { collectionsService, type CollectionItem } from '../services/collectionsService';
import { Card, Text, Badge, Select, Button, type SelectOption } from '@superapp/ui';

interface CollectionListProps {
  items: CollectionItem[];
  loading: boolean;
  onRefresh: () => void;
}

const statusOptions: SelectOption[] = [
  { value: 'planned', label: '📋 Запланировано' },
  { value: 'in_progress', label: '⏳ В процессе' },
  { value: 'completed', label: '✅ Завершено' },
  { value: 'dropped', label: '❌ Отменено' },
];

const statusVariantMap: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  planned: 'default',
  in_progress: 'warning',
  completed: 'success',
  dropped: 'error',
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

  if (loading) return <Text style={{ padding: 24, textAlign: 'center' }}>Загрузка...</Text>;
  if (items.length === 0) return <Text muted style={{ padding: 24, textAlign: 'center' }}>Коллекция пуста</Text>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <Card key={item.id} padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text size="lg">{typeEmojis[item.type]}</Text>
              <Text fontWeight={700}>{item.title}</Text>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => handleDelete(item.id)}
              style={{ color: '#ff6b6b', fontSize: 16, padding: 4 }}
            >
              ✕
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              options={statusOptions}
              value={item.status}
              onChange={(e) => handleStatusChange(item.id, e.target.value as CollectionItem['status'])}
            />

            <Badge variant={statusVariantMap[item.status] ?? 'default'} size="sm">
              {statusOptions.find((s) => s.value === item.status)?.label}
            </Badge>

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
        </Card>
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Card, Text, Badge, Select, Button, type SelectOption } from '@superapp/ui';
import { collectionsService, type CollectionItem, type CollectionType } from '../services/collectionsService';

interface CollectionListProps {
  items: CollectionItem[];
  loading: boolean;
  onRefresh: () => void;
  typeFilter?: CollectionType | 'all';
}

const statusOptions: SelectOption[] = [
  { value: 'planned', label: 'Запланировано' },
  { value: 'in_progress', label: 'В процессе' },
  { value: 'completed', label: 'Завершено' },
  { value: 'dropped', label: 'Отменено' },
];

const statusVariantMap: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  planned: 'info',
  in_progress: 'warning',
  completed: 'success',
  dropped: 'error',
};

const statusLabelMap: Record<string, string> = {
  planned: 'Запланировано',
  in_progress: 'В процессе',
  completed: 'Завершено',
  dropped: 'Отменено',
};

const typeEmojis: Record<CollectionType, string> = { book: '📚', movie: '🎬', recipe: '🍳', supplement: '💊' };

const typeBadgeVariant: Record<CollectionType, 'primary' | 'info' | 'warning' | 'success'> = {
  book: 'primary',
  movie: 'info',
  recipe: 'warning',
  supplement: 'success',
};

const typeLabels: Record<CollectionType, string> = {
  book: 'Книга',
  movie: 'Фильм',
  recipe: 'Рецепт',
  supplement: 'Добавка',
};

function StarRating({ value, onChange }: { value: number | null; onChange: (rating: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: (value ?? 0) >= r ? '#fbbf24' : '#444',
            padding: 0,
            lineHeight: 1,
            transition: 'color 150ms',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#fbbf24';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = (value ?? 0) >= r ? '#fbbf24' : '#444';
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function CollectionList({ items, loading, onRefresh, typeFilter }: CollectionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить этот элемент?')) return;
    setDeletingId(id);
    try {
      await collectionsService.delete(id);
      onRefresh();
    } catch {
      alert('Ошибка при удалении');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: CollectionItem['status']) => {
    try {
      await collectionsService.update(id, { status });
      onRefresh();
    } catch {
      alert('Ошибка при обновлении статуса');
    }
  };

  const handleRatingChange = async (id: string, rating: number) => {
    try {
      await collectionsService.update(id, { rating });
      onRefresh();
    } catch {
      alert('Ошибка при обновлении рейтинга');
    }
  };

  if (loading) {
    return (
      <Card padding="lg" variant="outlined">
        <Text style={{ padding: 24, textAlign: 'center' }}>Загрузка...</Text>
      </Card>
    );
  }

  if (items.length === 0) {
    const message = typeFilter && typeFilter !== 'all'
      ? `Нет элементов типа "${typeLabels[typeFilter as CollectionType]}"`
      : 'Коллекция пуста';

    return (
      <Card padding="lg" variant="outlined">
        <Text muted style={{ padding: 24, textAlign: 'center' }}>
          {message}
        </Text>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item) => (
        <Card key={item.id} padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Text size="lg">{typeEmojis[item.type]}</Text>
              <Text fontWeight={700} size="lg">{item.title}</Text>
            </div>
            <Button
              variant="ghost"
              size="sm"
              loading={deletingId === item.id}
              onPress={() => handleDelete(item.id)}
              style={{ color: '#ff6b6b', fontSize: 16, padding: '4px 8px' }}
            >
              ✕
            </Button>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge variant={typeBadgeVariant[item.type]} size="sm">
              {typeEmojis[item.type]} {typeLabels[item.type]}
            </Badge>

            <Badge variant={statusVariantMap[item.status]} size="sm" dot>
              {statusLabelMap[item.status]}
            </Badge>

            <Select
              options={statusOptions}
              value={item.status}
              onChange={(e) => handleStatusChange(item.id, e.target.value as CollectionItem['status'])}
              style={{ minWidth: 160 }}
            />

            <StarRating
              value={item.rating}
              onChange={(rating) => handleRatingChange(item.id, rating)}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

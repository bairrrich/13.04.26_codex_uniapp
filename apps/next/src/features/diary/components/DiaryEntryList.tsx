'use client';

import type { DiaryEntry } from '../services/diaryService';
import { diaryService } from '../services/diaryService';
import { Card, Text, Badge } from '@superapp/ui';

interface DiaryEntryListProps {
  entries: DiaryEntry[];
  loading: boolean;
  onRefresh: () => void;
}

const moodEmojis = ['😢', '😟', '😐', '🙂', '😊'];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DiaryEntryList({ entries, loading, onRefresh }: DiaryEntryListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    try {
      await diaryService.delete(id);
      onRefresh();
    } catch {
      alert('Ошибка удаления');
    }
  };

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Text muted>Загрузка...</Text></div>;
  }

  if (entries.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text muted>Записей пока нет. Создайте первую!</Text>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {entries.map((entry) => (
        <Card key={entry.id} padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {entry.mood_score && (
                <span style={{ fontSize: 24 }}>{moodEmojis[entry.mood_score - 1] ?? '😐'}</span>
              )}
              <Text muted size="sm">{formatDate(entry.created_at)}</Text>
            </div>
            <button
              onClick={() => handleDelete(entry.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6b6b',
                cursor: 'pointer',
                fontSize: 18,
                padding: '4px 8px',
              }}
              title="Удалить"
            >
              ✕
            </button>
          </div>
          <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{entry.content}</Text>
        </Card>
      ))}
    </div>
  );
}

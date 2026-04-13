'use client';

import type { DiaryEntry } from '../services/diaryService';
import { diaryService } from '../services/diaryService';

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
    return <div style={{ padding: 24, textAlign: 'center' }}>Загрузка...</div>;
  }

  if (entries.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
        <p>Записей пока нет. Создайте первую!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {entries.map((entry) => (
        <div
          key={entry.id}
          style={{
            padding: 16,
            borderRadius: 10,
            border: '1px solid #333',
            background: '#111827',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {entry.mood_score && (
                <span style={{ fontSize: 24 }}>{moodEmojis[entry.mood_score - 1] ?? '😐'}</span>
              )}
              <span style={{ fontSize: 13, color: '#888' }}>{formatDate(entry.created_at)}</span>
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
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{entry.content}</p>
        </div>
      ))}
    </div>
  );
}

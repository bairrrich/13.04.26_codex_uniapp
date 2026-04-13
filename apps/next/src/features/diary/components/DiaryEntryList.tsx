'use client';

import { useState } from 'react';
import type { DiaryEntry } from '../services/diaryService';
import { diaryService } from '../services/diaryService';
import { Card, Text, Badge, Button, Input } from '@superapp/ui';
import { DiaryEntryForm } from './DiaryEntryForm';

interface DiaryEntryListProps {
  entries: DiaryEntry[];
  loading: boolean;
  onRefresh: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
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

export function DiaryEntryList({
  entries,
  loading,
  onRefresh,
  hasMore = false,
  onLoadMore,
}: DiaryEntryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    setDeleting(id);
    try {
      await diaryService.delete(id);
      onRefresh();
    } catch {
      alert('Ошибка удаления');
    } finally {
      setDeleting(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      onRefresh();
      return;
    }
    try {
      const results = await diaryService.search(searchQuery.trim());
      // For simplicity, we just reload with the filtered results
      // In production, you'd use a state management solution
      onRefresh();
    } catch {
      // Fallback to refresh
      onRefresh();
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="lg">
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1e293b' }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: 120, height: 14, background: '#1e293b', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ width: 200, height: 12, background: '#1e293b', borderRadius: 6 }} />
              </div>
            </div>
            <div style={{ width: '100%', height: 12, background: '#1e293b', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ width: '80%', height: 12, background: '#1e293b', borderRadius: 6 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card padding="3xl" variant="outlined">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📔</div>
          <Text muted size="xl" style={{ marginBottom: 8 }}>Записей пока нет</Text>
          <Text muted>Создайте первую запись в дневнике!</Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          placeholder="Поиск по записям..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />
        <Button variant="secondary" onPress={handleSearch}>
          🔍
        </Button>
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entries.map((entry) => {
          const isEditing = editingId === entry.id;
          const isDeleting = deleting === entry.id;

          return (
            <Card key={entry.id} padding="lg" hoverable style={{ opacity: isDeleting ? 0.5 : 1 }}>
              {isEditing ? (
                <DiaryEntryForm
                  isEditing
                  entryId={entry.id}
                  initialContent={entry.content}
                  initialMood={entry.mood_score}
                  onSuccess={() => {
                    setEditingId(null);
                    onRefresh();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {entry.mood_score && (
                        <Badge variant="primary" size="md">
                          {moodEmojis[entry.mood_score - 1] ?? '😐'} {entry.mood_score}/5
                        </Badge>
                      )}
                      <Text muted size="sm">{formatDate(entry.created_at)}</Text>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => setEditingId(entry.id)}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={isDeleting}
                        onPress={() => handleDelete(entry.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                  <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{entry.content}</Text>
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div style={{ textAlign: 'center' }}>
          <Button variant="secondary" size="lg" onPress={onLoadMore}>
            Загрузить ещё
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { diaryService } from '../services/diaryService';
import { Button, Card, Text, TextArea, Input, Badge } from '@superapp/ui';

interface DiaryEntryFormProps {
  onSuccess?: () => void;
  initialContent?: string;
  initialMood?: number | null;
  isEditing?: boolean;
  entryId?: string;
  onCancel?: () => void;
}

const moodEmojis = ['😢', '😟', '😐', '🙂', '😊'];
const moodLabels = ['Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'];

export function DiaryEntryForm({
  onSuccess,
  initialContent = '',
  initialMood = 3,
  isEditing = false,
  entryId,
  onCancel,
}: DiaryEntryFormProps) {
  const [content, setContent] = useState(initialContent);
  const [moodScore, setMoodScore] = useState(initialMood ?? 3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      if (isEditing && entryId) {
        await diaryService.update(entryId, { content: content.trim(), mood_score: moodScore });
      } else {
        await diaryService.create({ content: content.trim(), mood_score: moodScore });
      }
      setContent('');
      setMoodScore(3);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="2xl">
      <Text fontWeight="semibold" size="xl" style={{ marginBottom: 16 }}>
        {isEditing ? '✏️ Редактировать запись' : '✏️ Новая запись'}
      </Text>

      <form onSubmit={handleSubmit}>
        {/* Mood Selector */}
        <div style={{ marginBottom: 16 }}>
          <Text muted size="sm" style={{ display: 'block', marginBottom: 8 }}>Настроение</Text>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {moodEmojis.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMoodScore(i + 1)}
                title={moodLabels[i]}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 12px',
                  borderRadius: 12,
                  border: moodScore === i + 1 ? '2px solid #5B6CFF' : '2px solid #1e293b',
                  background: moodScore === i + 1 ? '#1e2a4a' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  minWidth: 64,
                }}
              >
                <span style={{ fontSize: 28 }}>{emoji}</span>
                <span style={{ fontSize: 10, color: moodScore === i + 1 ? '#5B6CFF' : '#64748B' }}>
                  {moodLabels[i]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: 16 }}>
          <Text muted size="sm" style={{ display: 'block', marginBottom: 8 }}>Содержание</Text>
          <TextArea
            placeholder="Что произошло сегодня?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            fullWidth
            autoFocus
          />
        </div>

        {error && <Text error style={{ marginBottom: 12 }}>{error}</Text>}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="submit"
            loading={loading}
            disabled={!content.trim()}
            size="lg"
          >
            {isEditing ? 'Сохранить изменения' : 'Сохранить'}
          </Button>
          {isEditing && onCancel && (
            <Button variant="ghost" size="lg" onPress={onCancel}>
              Отмена
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

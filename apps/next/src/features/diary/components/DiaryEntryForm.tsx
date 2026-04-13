'use client';

import { useState, type FormEvent } from 'react';
import { diaryService } from '../services/diaryService';
import { Button, Card, Text, TextArea } from '@superapp/ui';

interface DiaryEntryFormProps {
  onSuccess?: () => void;
}

const moodEmojis = ['😢', '😟', '😐', '🙂', '😊'];

export function DiaryEntryForm({ onSuccess }: DiaryEntryFormProps) {
  const [content, setContent] = useState('');
  const [moodScore, setMoodScore] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await diaryService.create({ content: content.trim(), mood_score: moodScore });
      setContent('');
      setMoodScore(3);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="2xl" style={{ marginBottom: 24 }}>
      <Text fontWeight={600} size="lg" style={{ marginBottom: 16 }}>Новая запись</Text>

      <div style={{ marginBottom: 12 }}>
        <Text muted size="sm" style={{ display: 'block', marginBottom: 8 }}>Настроение</Text>
        <div style={{ display: 'flex', gap: 8 }}>
          {moodEmojis.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setMoodScore(i + 1)}
              style={{
                fontSize: 28,
                padding: 8,
                borderRadius: 8,
                border: moodScore === i + 1 ? '2px solid #5B6CFF' : '2px solid transparent',
                background: moodScore === i + 1 ? '#1e2a4a' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <TextArea
        placeholder="Что произошло сегодня?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        fullWidth
      />

      {error && (
        <Text error style={{ marginTop: 12 }}>{error}</Text>
      )}

      <Button
        type="submit"
        loading={loading}
        disabled={!content.trim()}
        style={{ marginTop: 12 }}
        fullWidth
        size="lg"
        onClick={handleSubmit}
      >
        {loading ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </Card>
  );
}

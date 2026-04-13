'use client';

import { useState, type FormEvent } from 'react';
import { diaryService } from '../services/diaryService';

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
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <h3>Новая запись</h3>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#888' }}>Настроение</label>
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

      <textarea
        placeholder="Что произошло сегодня?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        required
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid #333',
          background: '#111827',
          color: '#F4F7FF',
          fontSize: 15,
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
      />

      {error && <p style={{ color: '#ff6b6b', marginTop: 8 }}>{error}</p>}

      <button
        type="submit"
        disabled={loading || !content.trim()}
        style={{
          marginTop: 12,
          padding: '10px 24px',
          borderRadius: 8,
          border: 'none',
          background: content.trim() ? '#5B6CFF' : '#333',
          color: '#fff',
          cursor: loading || !content.trim() ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}
      >
        {loading ? 'Сохранение...' : 'Сохранить'}
      </button>
    </form>
  );
}

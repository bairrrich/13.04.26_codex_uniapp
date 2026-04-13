'use client';

import { useState, type FormEvent } from 'react';
import { feedService } from '../services/feedService';

interface FeedPostFormProps {
  onSuccess?: () => void;
}

export function FeedPostForm({ onSuccess }: FeedPostFormProps) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await feedService.create({ content: content.trim(), visibility });
      setContent('');
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <textarea
        placeholder="Что нового?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid #333',
          background: '#111827',
          color: '#F4F7FF',
          fontSize: 15,
          resize: 'none',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as typeof visibility)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #333',
            background: '#1a1a2e',
            color: '#F4F7FF',
          }}
        >
          <option value="private">🔒 Только я</option>
          <option value="public">🌍 Все</option>
        </select>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            border: 'none',
            background: content.trim() ? '#5B6CFF' : '#333',
            color: '#fff',
            cursor: loading || !content.trim() ? 'not-allowed' : 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? '...' : 'Опубликовать'}
        </button>
      </div>
    </form>
  );
}

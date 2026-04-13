'use client';

import { useState, type FormEvent } from 'react';
import { collectionsService } from '../services/collectionsService';

interface CollectionFormProps {
  onSuccess?: () => void;
}

const typeOptions = [
  { value: 'book', label: '📚 Книга' },
  { value: 'movie', label: '🎬 Фильм' },
  { value: 'recipe', label: '🍳 Рецепт' },
  { value: 'supplement', label: '💊 Добавка' },
] as const;

export function CollectionForm({ onSuccess }: CollectionFormProps) {
  const [type, setType] = useState<'book' | 'movie' | 'recipe' | 'supplement'>('book');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await collectionsService.create({ type, title: title.trim() });
      setTitle('');
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
      <select
        value={type}
        onChange={(e) => setType(e.target.value as typeof type)}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #333',
          background: '#1a1a2e',
          color: '#F4F7FF',
        }}
      >
        {typeOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Название..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          flex: 1,
          minWidth: 200,
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #333',
          background: '#111827',
          color: '#F4F7FF',
        }}
      />

      <button
        type="submit"
        disabled={loading || !title.trim()}
        style={{
          padding: '8px 20px',
          borderRadius: 6,
          border: 'none',
          background: title.trim() ? '#5B6CFF' : '#333',
          color: '#fff',
          cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}
      >
        {loading ? '...' : 'Добавить'}
      </button>
    </form>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input, Select, Card, Text, type SelectOption } from '@superapp/ui';
import { collectionsService } from '../services/collectionsService';

interface CollectionFormProps {
  onSuccess?: () => void;
}

const typeOptions: SelectOption[] = [
  { value: 'book', label: '📚 Книга' },
  { value: 'movie', label: '🎬 Фильм' },
  { value: 'recipe', label: '🍳 Рецепт' },
  { value: 'supplement', label: '💊 Добавка' },
];

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
    <Card padding="md" style={{ marginBottom: 20 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Select
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          style={{ minWidth: 160 }}
        />

        <Input
          type="text"
          placeholder="Название..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
        />

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={!title.trim()}
        >
          Добавить
        </Button>
      </form>
    </Card>
  );
}

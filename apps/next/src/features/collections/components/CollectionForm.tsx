'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input, Select, Card, Text, type SelectOption, useTheme } from '@superapp/ui';
import { collectionsService, type CollectionType } from '../services/collectionsService';

interface CollectionFormProps {
  onSuccess?: () => void;
}

const typeOptions: SelectOption[] = [
  { value: 'book', label: '📚 Книга' },
  { value: 'movie', label: '🎬 Фильм' },
  { value: 'recipe', label: '🍳 Рецепт' },
  { value: 'supplement', label: '💊 Добавка' },
];

const typeIcons: Record<CollectionType, string> = {
  book: '📚',
  movie: '🎬',
  recipe: '🍳',
  supplement: '💊',
};

export function CollectionForm({ onSuccess }: CollectionFormProps) {
  const [type, setType] = useState<CollectionType>('book');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tokens } = useTheme();

  const isValid = title.trim().length >= 2;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError('Название должно содержать минимум 2 символа');
      return;
    }

    setLoading(true);
    try {
      await collectionsService.create({ type, title: title.trim() });
      setTitle('');
      onSuccess?.();
    } catch (err) {
      setError('Ошибка при создании записи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg" variant="outlined" style={{ marginBottom: 20 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 180 }}>
          <Text size="sm" style={{ display: 'block', marginBottom: 6 }}>
            {typeIcons[type]} Тип
          </Text>
          <Select
            options={typeOptions}
            value={type}
            onChange={(e) => setType(e.target.value as CollectionType)}
            fullWidth
          />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <Text size="sm" style={{ display: 'block', marginBottom: 6 }}>
            Название
          </Text>
          <Input
            type="text"
            placeholder="Введите название..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            fullWidth
            error={!isValid && title.length > 0}
            errorMessage={!isValid && title.length > 0 ? 'Минимум 2 символа' : undefined}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={!isValid || loading}
          icon={typeIcons[type]}
        >
          Добавить
        </Button>
      </form>

      {error && (
        <Text size="sm" style={{ color: tokens.error, marginTop: 12 }}>
          {error}
        </Text>
      )}
    </Card>
  );
}

'use client';

import { useState, type FormEvent } from 'react';
import { Button, TextArea, Select, Card, Text, Divider, tokens } from '@superapp/ui';
import { feedService } from '../services/feedService';

const MAX_CHARS = 500;

interface FeedPostFormProps {
  onSuccess?: () => void;
}

export function FeedPostForm({ onSuccess }: FeedPostFormProps) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isEmpty = !content.trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isEmpty || isOverLimit) return;

    setLoading(true);
    try {
      await feedService.createWithActivity({
        content: content.trim(),
        visibility,
      });
      setContent('');
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при создании поста';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const charColor = charCount > MAX_CHARS * 0.9
    ? tokens.colors.error
    : charCount > MAX_CHARS * 0.7
      ? tokens.colors.warning
      : tokens.colors.muted;

  return (
    <Card padding="lg" style={{ marginBottom: 20 }}>
      <form onSubmit={handleSubmit}>
        <TextArea
          placeholder="Что нового?"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (error) setError(null);
          }}
          rows={3}
          fullWidth
        />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: tokens.space.sm,
        }}>
          <Text size="sm" style={{ color: charColor }}>
            {charCount} / {MAX_CHARS}
          </Text>

          <Select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as typeof visibility)}
            options={[
              { value: 'private', label: 'Только я' },
              { value: 'public', label: 'Все' },
            ]}
          />
        </div>

        <Divider style={{ margin: `${tokens.space.md} 0` }} />

        {error && (
          <Text size="sm" style={{ color: tokens.colors.error, marginBottom: tokens.space.sm }}>
            {error}
          </Text>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || isEmpty || isOverLimit}
          fullWidth
        >
          Опубликовать
        </Button>
      </form>
    </Card>
  );
}

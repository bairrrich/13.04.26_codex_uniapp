'use client';

import { useState, type FormEvent } from 'react';
import { Button, TextArea, Select, Card, Text } from '@superapp/ui';
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
    <Card padding="md" style={{ marginBottom: 20 }}>
      <form onSubmit={handleSubmit}>
        <TextArea
          placeholder="Что нового?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          fullWidth
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as typeof visibility)}
            options={[
              { value: 'private', label: '🔒 Только я' },
              { value: 'public', label: '🌍 Все' },
            ]}
          />
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || !content.trim()}
          >
            {loading ? '...' : 'Опубликовать'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

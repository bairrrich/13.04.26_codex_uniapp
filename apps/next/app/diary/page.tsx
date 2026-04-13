'use client';

import { useState, useEffect, useCallback } from 'react';
import { DiaryEntryList } from '../../src/features/diary/components/DiaryEntryList';
import { DiaryEntryForm } from '../../src/features/diary/components/DiaryEntryForm';
import { diaryService, type DiaryEntry } from '../../src/features/diary/services/diaryService';
import { Heading, Card, Text } from '@superapp/ui';

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await diaryService.list();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <Heading style={{ marginBottom: 24 }}>📔 Дневник</Heading>

      <DiaryEntryForm onSuccess={fetchEntries} />

      {error && (
        <Card padding="lg" style={{ marginBottom: 16, borderColor: '#ff6b6b' }}>
          <Text error>{error}</Text>
        </Card>
      )}

      <DiaryEntryList entries={entries} loading={loading} onRefresh={fetchEntries} />
    </main>
  );
}

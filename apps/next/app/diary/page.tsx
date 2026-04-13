'use client';

import { useState, useEffect, useCallback } from 'react';
import { DiaryEntryList } from '../../src/features/diary/components/DiaryEntryList';
import { DiaryEntryForm } from '../../src/features/diary/components/DiaryEntryForm';
import { diaryService, type DiaryEntry } from '../../src/features/diary/services/diaryService';

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
      <h1>📔 Дневник</h1>

      <DiaryEntryForm onSuccess={fetchEntries} />

      {error && (
        <div style={{ padding: 16, borderRadius: 8, background: '#2d1215', border: '1px solid #ff6b6b', marginBottom: 16 }}>
          <p style={{ color: '#ff6b6b', margin: 0 }}>{error}</p>
        </div>
      )}

      <DiaryEntryList entries={entries} loading={loading} onRefresh={fetchEntries} />
    </main>
  );
}

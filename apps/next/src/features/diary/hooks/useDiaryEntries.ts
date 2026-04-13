'use client';

import { useState, useEffect } from 'react';
import { diaryService, type DiaryEntry } from '../services/diaryService';

export function useDiaryEntries() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const result = await diaryService.list();
      setEntries(result.data);
      setTotalCount(result.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return { entries, loading, error, refetch: fetchEntries, totalCount };
}

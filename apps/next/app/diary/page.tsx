'use client';

import { useState, useEffect, useCallback } from 'react';
import { DiaryEntryList } from '../../src/features/diary/components/DiaryEntryList';
import { DiaryEntryForm } from '../../src/features/diary/components/DiaryEntryForm';
import { MoodChart } from '../../src/features/diary/components/MoodChart';
import { diaryService, type DiaryEntry } from '../../src/features/diary/services/diaryService';
import { Card, Text, Button } from '@superapp/ui';
import { AppLayout } from '../../src/components/AppLayout';

const PAGE_SIZE = 10;

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [moodData, setMoodData] = useState<{ date: string; mood: number }[]>([]);
  const [showForm, setShowForm] = useState(false);

  const fetchEntries = useCallback(async (currentOffset = 0) => {
    try {
      setLoading(true);
      setError(null);
      const { data, count } = await diaryService.list(PAGE_SIZE, currentOffset);
      setEntries(data);
      setTotalCount(count ?? 0);
      setHasMore((count ?? 0) > currentOffset + PAGE_SIZE);
      setOffset(currentOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMoodData = useCallback(async () => {
    try {
      const data = await diaryService.getMoodHistory(14);
      setMoodData(data);
    } catch {
      // Ignore mood errors
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchMoodData();
  }, [fetchEntries, fetchMoodData]);

  const handleLoadMore = () => {
    fetchEntries(offset + PAGE_SIZE);
  };

  return (
    <AppLayout
      headerTitle="📔 Дневник"
      headerSubtitle={`${totalCount} записей`}
      headerRight={
        <Button variant="primary" size="lg" onPress={() => setShowForm(!showForm)}>
          {showForm ? '✕ Закрыть' : '✏️ Новая запись'}
        </Button>
      }
    >
      {/* New Entry Form */}
      {showForm && (
        <div style={{ marginBottom: 24 }}>
          <DiaryEntryForm
            onSuccess={() => {
              setShowForm(false);
              fetchEntries(0);
              fetchMoodData();
            }}
          />
        </div>
      )}

      {/* Mood Chart */}
      <div style={{ marginBottom: 24 }}>
        <MoodChart data={moodData} />
      </div>

      {/* Error State */}
      {error && (
        <Card padding="lg" style={{ marginBottom: 16, borderColor: '#ef4444' }}>
          <Text error>{error}</Text>
        </Card>
      )}

      {/* Entry List */}
      <DiaryEntryList
        entries={entries}
        loading={loading}
        onRefresh={() => {
          fetchEntries(0);
          fetchMoodData();
        }}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />
    </AppLayout>
  );
}

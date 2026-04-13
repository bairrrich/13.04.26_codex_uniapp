'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkoutList } from '../../src/features/fitness/components/WorkoutList';
import { WorkoutForm } from '../../src/features/fitness/components/WorkoutForm';
import { fitnessService, type WorkoutSession, type WorkoutStatistics } from '../../src/features/fitness/services/fitnessService';
import { Heading, Card, Text, Button, Divider, Skeleton } from '@superapp/ui';
import { AppLayout } from '../../src/components/AppLayout';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} ч ${remainingMinutes} мин`;
}

export default function FitnessPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WorkoutStatistics>({ totalSessions: 0, totalDurationMinutes: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fitnessService.list({ page: 1, limit: 50 });
      setWorkouts(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await fitnessService.getStatistics();
      setStats(data);
    } catch {
      // stats error is non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  return (
    <AppLayout headerTitle="Фитнес" headerSubtitle="Треки тренировок и статистика">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Stats summary section */}
        <div style={{ marginBottom: 24 }}>
          <Heading level={2} style={{ marginBottom: 12 }}>Статистика</Heading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Card padding="lg">
              {statsLoading ? (
                <Skeleton width="60px" height="32px" />
              ) : (
                <>
                  <Text muted size="sm">Всего тренировок</Text>
                  <Heading level={3} style={{ marginTop: 4 }}>{stats.totalSessions}</Heading>
                </>
              )}
            </Card>
            <Card padding="lg">
              {statsLoading ? (
                <Skeleton width="80px" height="32px" />
              ) : (
                <>
                  <Text muted size="sm">Общее время</Text>
                  <Heading level={3} style={{ marginTop: 4 }}>{formatDuration(stats.totalDurationMinutes)}</Heading>
                </>
              )}
            </Card>
          </div>
        </div>

        <Divider style={{ marginBottom: 24 }} />

        {/* Workout form section */}
        <div style={{ marginBottom: 24 }}>
          <Heading level={2} style={{ marginBottom: 12 }}>Новая тренировка</Heading>
          <WorkoutForm onSuccess={fetchData} />
        </div>

        {/* Error state */}
        {error && (
          <Card padding="md" style={{ marginBottom: 16 }}>
            <Text error>{error}</Text>
            <Button
              variant="secondary"
              size="sm"
              onPress={fetchData}
              style={{ marginTop: 8 }}
            >
              Повторить
            </Button>
          </Card>
        )}

        {/* Workout list section */}
        <div>
          <Heading level={2} style={{ marginBottom: 12 }}>История тренировок</Heading>
          <WorkoutList workouts={workouts} loading={loading} onRefresh={fetchData} />
        </div>
      </div>
    </AppLayout>
  );
}

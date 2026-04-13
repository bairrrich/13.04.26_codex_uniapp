'use client';

import { fitnessService } from '../services/fitnessService';
import type { WorkoutSession } from '../services/fitnessService';
import { Card, Text, Badge, Button } from '@superapp/ui';

interface WorkoutListProps {
  workouts: WorkoutSession[];
  loading: boolean;
  onRefresh: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return 'В процессе...';
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const minutes = Math.round((end - start) / 60000);
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} ч ${remainingMinutes} мин`;
}

export function WorkoutList({ workouts, loading, onRefresh }: WorkoutListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить тренировку?')) return;
    try {
      await fitnessService.delete(id);
      onRefresh();
    } catch {
      alert('Ошибка удаления');
    }
  };

  if (loading) {
    return (
      <Card padding="xl">
        <Text muted textAlign="center">Загрузка...</Text>
      </Card>
    );
  }

  if (workouts.length === 0) {
    return (
      <Card padding="xl">
        <Text muted textAlign="center">Тренировок пока нет. Начните первую!</Text>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {workouts.map((workout) => (
        <Card key={workout.id} padding="md">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Text muted size="sm">{formatDate(workout.started_at)}</Text>
              <Badge variant="primary" size="sm">
                {formatDuration(workout.started_at, workout.ended_at)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => handleDelete(workout.id)}
              style={{ color: '#ff6b6b', padding: '4px 8px' }}
            >
              Удалить
            </Button>
          </div>
          {workout.notes && (
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {workout.notes}
            </Text>
          )}
        </Card>
      ))}
    </div>
  );
}

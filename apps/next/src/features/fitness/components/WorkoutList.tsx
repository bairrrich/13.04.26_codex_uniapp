'use client';

import { useState } from 'react';
import { fitnessService } from '../services/fitnessService';
import type { WorkoutSession } from '../services/fitnessService';
import { Card, Text, Badge, Button, Divider } from '@superapp/ui';

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

function formatDurationBadge(startedAt: string, endedAt: string | null): { text: string; variant: 'primary' | 'warning' | 'success' } {
  if (!endedAt) return { text: 'В процессе...', variant: 'warning' };
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  const minutes = Math.round((end - start) / 60000);
  if (minutes < 30) return { text: `${minutes} мин`, variant: 'primary' };
  if (minutes < 60) return { text: `${minutes} мин`, variant: 'success' };
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return { text: `${hours} ч ${remainingMinutes} мин`, variant: 'success' };
}

export function WorkoutList({ workouts, loading, onRefresh }: WorkoutListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить тренировку?')) return;
    setDeletingId(id);
    try {
      await fitnessService.delete(id);
      onRefresh();
    } catch {
      alert('Ошибка удаления');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card padding="xl">
        <Text muted textAlign="center">Загрузка тренировок...</Text>
      </Card>
    );
  }

  if (workouts.length === 0) {
    return (
      <Card variant="outlined" padding="xl">
        <div style={{ textAlign: 'center' }}>
          <Text muted size="lg">Тренировок пока нет</Text>
          <Text muted size="sm" style={{ marginTop: 8 }}>
            Начните первую тренировку, заполнив форму выше!
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {workouts.map((workout) => {
        const durationInfo = formatDurationBadge(workout.started_at, workout.ended_at);
        return (
          <Card key={workout.id} padding="md">
            {/* Header: date and duration */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Text muted size="sm">{formatDate(workout.started_at)}</Text>
                <Badge variant={durationInfo.variant} size="sm">
                  {durationInfo.text}
                </Badge>
              </div>
              <Button
                variant="danger"
                size="sm"
                loading={deletingId === workout.id}
                onPress={() => handleDelete(workout.id)}
              >
                Удалить
              </Button>
            </div>

            <Divider />

            {/* Notes section */}
            {workout.notes ? (
              <div style={{ marginTop: 8 }}>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {workout.notes}
                </Text>
              </div>
            ) : (
              <Text muted size="sm" style={{ marginTop: 8 }}>
                Без заметок
              </Text>
            )}
          </Card>
        );
      })}
    </div>
  );
}

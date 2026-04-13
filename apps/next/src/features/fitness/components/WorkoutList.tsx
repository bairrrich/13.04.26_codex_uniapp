'use client';

import { fitnessService } from '../services/fitnessService';
import type { WorkoutSession } from '../services/fitnessService';

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
    return <div style={{ padding: 24, textAlign: 'center' }}>Загрузка...</div>;
  }

  if (workouts.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
        <p>Тренировок пока нет. Начните первую!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {workouts.map((workout) => (
        <div
          key={workout.id}
          style={{
            padding: 16,
            borderRadius: 10,
            border: '1px solid #333',
            background: '#111827',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: '#888' }}>{formatDate(workout.started_at)}</span>
              <span style={{ fontSize: 13, color: '#5B6CFF' }}>
                {formatDuration(workout.started_at, workout.ended_at)}
              </span>
            </div>
            <button
              onClick={() => handleDelete(workout.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6b6b',
                cursor: 'pointer',
                fontSize: 18,
                padding: '4px 8px',
              }}
              title="Удалить"
            >
              ✕
            </button>
          </div>
          {workout.notes && (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#ccc' }}>
              {workout.notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

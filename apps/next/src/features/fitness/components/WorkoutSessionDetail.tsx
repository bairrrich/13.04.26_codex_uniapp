'use client';

import { useState, useEffect } from 'react';
import { fitnessService, type WorkoutSession, type WorkoutExerciseWithSets, type WorkoutSet } from '../services/fitnessService';
import { Card, Text, Badge, useTheme } from '@superapp/ui';

export function WorkoutSessionDetail({
  session,
  onClose,
}: {
  session: WorkoutSession;
  onClose: () => void;
}) {
  const { tokens: c } = useTheme();
  const [exercises, setExercises] = useState<WorkoutExerciseWithSets[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fitnessService.listWorkoutExercises(session.id)
      .then((data) => setExercises(data))
      .finally(() => setLoading(false));
  }, [session.id]);

  const duration = session.ended_at
    ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Session Info */}
      <Card padding="lg" style={{ background: `linear-gradient(135deg, ${c.primaryLight}, ${c.surfaceActive})`, borderColor: c.primary }}>
        <Text fontWeight="bold" size="xl" style={{ color: c.primary }}>
          {session.title || '🏋️ Тренировка'}
        </Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <Badge variant="default" size="sm">
            📅 {new Date(session.started_at).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Badge>
          {duration !== null && (
            <Badge variant="primary" size="sm">⏱ {duration} мин</Badge>
          )}
          <Badge variant={session.ended_at ? 'success' : 'warning'} size="sm">
            {session.ended_at ? '✓ Завершена' : '⏳ В процессе'}
          </Badge>
        </div>
        {session.notes && (
          <Text muted size="sm" style={{ marginTop: 8 }}>{session.notes}</Text>
        )}
      </Card>

      {/* Exercises */}
      {loading ? (
        <Text muted>Загрузка...</Text>
      ) : exercises.length === 0 ? (
        <Card padding="2xl" variant="outlined">
          <Text muted style={{ textAlign: 'center' }}>Нет упражнений в этой тренировке</Text>
        </Card>
      ) : (
        exercises.map((we) => (
          <Card key={we.exercise.id} padding="lg">
            <div style={{ marginBottom: 12 }}>
              <Text fontWeight="semibold" size="lg">{we.exercise.exercise?.name || 'Неизвестное упражнение'}</Text>
              {we.exercise.exercise?.muscle_group && (
                <Badge variant="info" size="sm" style={{ marginTop: 4 }}>{we.exercise.exercise.muscle_group}</Badge>
              )}
            </div>

            {/* Sets Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 80px', gap: 8, marginBottom: 4 }}>
              <Text muted size="xs">#</Text>
              <Text muted size="xs">Повторы</Text>
              <Text muted size="xs">Вес (кг)</Text>
              <Text muted size="xs">Разминоч.</Text>
            </div>
            {we.sets.map((set: WorkoutSet, i: number) => {
              const volume = set.reps && set.weight_grams
                ? `${((set.weight_grams * set.reps) / 1000).toFixed(1)} кг`
                : '—';
              return (
                <div key={set.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 1fr 80px',
                  gap: 8,
                  alignItems: 'center',
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: set.is_warmup ? c.successBg : i % 2 === 0 ? c.surfaceHover : 'transparent',
                  marginBottom: 2,
                }}>
                  <Text size="sm" muted>{i + 1}</Text>
                  <Text size="sm">{set.reps ?? '—'}</Text>
                  <Text size="sm">{set.weight_grams !== null ? `${(set.weight_grams / 1000).toFixed(1)}` : '—'}</Text>
                  <Text size="xs">{set.is_warmup ? '✅ Да' : '—'}</Text>
                </div>
              );
            })}
          </Card>
        ))
      )}
    </div>
  );
}

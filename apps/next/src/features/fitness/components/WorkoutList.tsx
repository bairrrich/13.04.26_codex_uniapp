'use client';

import { useState, useEffect, useCallback } from 'react';
import { fitnessService, type WorkoutSession } from '../services/fitnessService';
import { Card, Text, Badge, Button, Skeleton, useTheme } from '@superapp/ui';

interface WorkoutListProps {
  onSelectSession?: (sessionId: string) => void;
}

export function WorkoutList({ onSelectSession }: WorkoutListProps) {
  const { tokens: c } = useTheme();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fitnessService.getRecentWorkouts(50);
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить тренировку?')) return;
    await fitnessService.delete(id);
    loadSessions();
  };

  const getDuration = (session: WorkoutSession): number | null => {
    if (!session.ended_at) return null;
    return Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000);
  };

  const getDurationColor = (minutes: number): string => {
    if (minutes < 30) return c.info;
    if (minutes < 60) return c.success;
    if (minutes < 90) return c.warning;
    return c.error;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="lg">
            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.surfaceHover }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: 120, height: 14, background: c.surfaceHover, borderRadius: 6, marginBottom: 8 }} />
                <div style={{ width: 80, height: 12, background: c.surfaceHover, borderRadius: 6 }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card padding="2xl" variant="outlined">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏋️</div>
          <Text muted size="lg">Нет тренировок</Text>
          <Text muted size="sm" style={{ marginTop: 4 }}>Начните свою первую тренировку!</Text>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sessions.map((session) => {
        const duration = getDuration(session);
        return (
          <Card key={session.id} padding="lg" hoverable>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                cursor: onSelectSession ? 'pointer' : 'default',
              }}
              onClick={() => onSelectSession?.(session.id)}
            >
              <div>
                <Text fontWeight="semibold" size="lg">
                  {session.title || 'Тренировка'}
                </Text>
                <Text muted size="sm">
                  {new Date(session.started_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                {session.notes && (
                  <Text muted size="sm" style={{ marginTop: 4, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.notes}
                  </Text>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {duration !== null && (
                  <Badge size="sm" style={{ background: getDurationColor(duration), color: c.text }}>
                    ⏱ {duration} мин
                  </Badge>
                )}
                {session.ended_at ? (
                  <Badge variant="success" size="sm">✓</Badge>
                ) : (
                  <Badge variant="warning" dot>В процессе</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => handleDelete(session.id)}
                  aria-label="Удалить тренировку"
                >
                  🗑️
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkoutList } from '../../src/features/fitness/components/WorkoutList';
import { WorkoutForm } from '../../src/features/fitness/components/WorkoutForm';
import { fitnessService, type WorkoutSession } from '../../src/features/fitness/services/fitnessService';
import { Heading, Card, Text } from '@superapp/ui';

export default function FitnessPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fitnessService.list();
      setWorkouts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <Heading level={1} style={{ marginBottom: 24 }}>Фитнес</Heading>

      <div style={{ marginBottom: 24 }}>
        <WorkoutForm onSuccess={fetchWorkouts} />
      </div>

      {error && (
        <Card padding="md" style={{ marginBottom: 16, borderColor: '#ff6b6b' }}>
          <Text error>{error}</Text>
        </Card>
      )}

      <WorkoutList workouts={workouts} loading={loading} onRefresh={fetchWorkouts} />
    </main>
  );
}

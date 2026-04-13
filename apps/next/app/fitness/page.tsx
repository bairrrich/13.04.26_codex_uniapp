'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkoutList } from '../../src/features/fitness/components/WorkoutList';
import { WorkoutForm } from '../../src/features/fitness/components/WorkoutForm';
import { fitnessService, type WorkoutSession } from '../../src/features/fitness/services/fitnessService';

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: 24,
  background: '#0B1020',
  minHeight: '100vh',
  color: '#F4F7FF',
};

const headingStyle: React.CSSProperties = {
  marginBottom: 24,
  fontSize: 28,
  fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  background: '#111827',
  border: '1px solid #1e293b',
  marginBottom: 24,
};

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
    <main style={pageStyle}>
      <h1 style={headingStyle}>🏋️ Фитнес</h1>

      <div style={cardStyle}>
        <WorkoutForm onSuccess={fetchWorkouts} />
      </div>

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 8,
            background: '#2d1215',
            border: '1px solid #ff6b6b',
            marginBottom: 16,
          }}
        >
          <p style={{ color: '#ff6b6b', margin: 0 }}>{error}</p>
        </div>
      )}

      <WorkoutList workouts={workouts} loading={loading} onRefresh={fetchWorkouts} />
    </main>
  );
}

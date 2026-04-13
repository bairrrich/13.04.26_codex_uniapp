'use client';

import { useState, useEffect, useCallback } from 'react';
import { MealList } from '../../src/features/nutrition/components/MealList';
import { MealForm } from '../../src/features/nutrition/components/MealForm';
import { WaterForm } from '../../src/features/nutrition/components/WaterForm';
import { mealLogService, type MealLog } from '../../src/features/nutrition/services/nutritionService';

export default function NutritionPage() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mealLogService.list();
      setMeals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 24,
        minHeight: '100vh',
        background: '#0B1020',
        color: '#F4F7FF',
      }}
    >
      <h1 style={{ marginBottom: 24 }}>🍽️ Питание</h1>

      <div
        style={{
          padding: 20,
          borderRadius: 12,
          border: '1px solid #333',
          background: '#111827',
          marginBottom: 24,
        }}
      >
        <WaterForm onSuccess={fetchMeals} />
      </div>

      <div
        style={{
          padding: 20,
          borderRadius: 12,
          border: '1px solid #333',
          background: '#111827',
          marginBottom: 24,
        }}
      >
        <MealForm onSuccess={fetchMeals} />
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

      <MealList meals={meals} loading={loading} onRefresh={fetchMeals} />
    </main>
  );
}

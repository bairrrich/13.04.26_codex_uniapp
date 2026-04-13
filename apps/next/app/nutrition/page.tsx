'use client';

import { useState, useEffect, useCallback } from 'react';
import { MealList } from '../../src/features/nutrition/components/MealList';
import { MealForm } from '../../src/features/nutrition/components/MealForm';
import { WaterForm } from '../../src/features/nutrition/components/WaterForm';
import { mealLogService, type MealLog } from '../../src/features/nutrition/services/nutritionService';
import { Heading, Card, Text } from '@superapp/ui';

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
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <Heading style={{ marginBottom: 24 }}>🍽️ Питание</Heading>

      <WaterForm onSuccess={fetchMeals} />
      <MealForm onSuccess={fetchMeals} />

      {error && (
        <Card padding="lg" style={{ marginBottom: 16, borderColor: '#ff6b6b' }}>
          <Text error>{error}</Text>
        </Card>
      )}

      <MealList meals={meals} loading={loading} onRefresh={fetchMeals} />
    </main>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MealList } from '../../src/features/nutrition/components/MealList';
import { MealForm } from '../../src/features/nutrition/components/MealForm';
import { WaterForm } from '../../src/features/nutrition/components/WaterForm';
import { mealLogService, type MealLog } from '../../src/features/nutrition/services/nutritionService';
import { Heading, Card, Text, Skeleton, SkeletonCard, tokens } from '@superapp/ui';
import { AppLayout } from '../../src/components/AppLayout';

export default function NutritionPage() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await mealLogService.list({ page: 1, limit: 20 });
      setMeals(result.data);
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
    <AppLayout headerTitle="Питание" headerSubtitle="Трекинг приёмов пищи и воды">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Water Section */}
        <section style={{ marginBottom: 32 }}>
          <WaterForm onSuccess={fetchMeals} />
        </section>

        {/* Meal Form Section */}
        <section style={{ marginBottom: 32 }}>
          <MealForm onSuccess={fetchMeals} />
        </section>

        {/* Error State */}
        {error && (
          <Card padding="lg" style={{ marginBottom: 16, borderColor: tokens.colors.error }}>
            <Text error>{error}</Text>
          </Card>
        )}

        {/* Meal List Section */}
        <section>
          <Heading level={2} style={{ marginBottom: 16 }}>
            История приёмов пищи
          </Heading>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton height={120} />
              <Skeleton height={100} />
              <Skeleton height={140} />
            </div>
          ) : (
            <MealList meals={meals} loading={loading} onRefresh={fetchMeals} />
          )}
        </section>
      </div>
    </AppLayout>
  );
}

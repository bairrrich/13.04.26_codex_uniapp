'use client';

import { AppLayout } from '../../src/components/AppLayout';
import { NutritionPage } from '../../src/features/nutrition/components/NutritionPage';

export default function NutritionOverviewPage() {
  return (
    <AppLayout
      headerTitle="Питание"
      headerSubtitle="Трекинг приёмов пищи, воды и КБЖУ"
    >
      <NutritionPage />
    </AppLayout>
  );
}

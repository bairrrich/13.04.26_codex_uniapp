'use client';

import { mealLogService } from '../services/nutritionService';
import type { MealLog } from '../services/nutritionService';
import { Card, Text, Badge } from '@superapp/ui';

interface MealListProps {
  meals: MealLog[];
  loading: boolean;
  onRefresh: () => void;
}

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

const mealTypeEmojis: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MealList({ meals, loading, onRefresh }: MealListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить приём пищи?')) return;
    try {
      await mealLogService.delete(id);
      onRefresh();
    } catch {
      alert('Ошибка удаления');
    }
  };

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Text muted>Загрузка...</Text></div>;
  }

  if (meals.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text muted>Записей пока нет. Добавьте первый приём пищи!</Text>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {meals.map((meal) => (
        <Card key={meal.id} padding="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{mealTypeEmojis[meal.meal_type] ?? '🍽️'}</span>
              <Badge variant="primary">{mealTypeLabels[meal.meal_type] ?? meal.meal_type}</Badge>
              <Text muted size="sm">{formatDate(meal.eaten_at)}</Text>
            </div>
            <button
              onClick={() => handleDelete(meal.id)}
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

          {meal.items && meal.items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {meal.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: '#0B1020',
                  }}
                >
                  <Text muted>{item.name}</Text>
                  <Text style={{ color: '#5B6CFF', fontWeight: 500 }}>{item.grams} г</Text>
                </div>
              ))}
            </div>
          ) : (
            <Text muted size="sm">Нет продуктов</Text>
          )}
        </Card>
      ))}
    </div>
  );
}

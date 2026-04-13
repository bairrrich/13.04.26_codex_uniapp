'use client';

import { mealLogService } from '../services/nutritionService';
import type { MealLog } from '../services/nutritionService';

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
    return <div style={{ padding: 24, textAlign: 'center' }}>Загрузка...</div>;
  }

  if (meals.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
        <p>Записей пока нет. Добавьте первый приём пищи!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {meals.map((meal) => (
        <div
          key={meal.id}
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
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>
                {mealTypeEmojis[meal.meal_type] ?? '🍽️'}
              </span>
              <span style={{ fontWeight: 600, color: '#F4F7FF' }}>
                {mealTypeLabels[meal.meal_type] ?? meal.meal_type}
              </span>
              <span style={{ fontSize: 13, color: '#888' }}>
                {formatDate(meal.eaten_at)}
              </span>
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
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {meal.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: '#0B1020',
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: '#ccc' }}>{item.name}</span>
                  <span style={{ color: '#5B6CFF', fontWeight: 500 }}>
                    {item.grams} г
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#888', fontSize: 14 }}>
              Нет продуктов
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

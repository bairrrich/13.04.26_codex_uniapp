'use client';

import { mealLogService } from '../services/nutritionService';
import type { MealLog } from '../services/nutritionService';
import { Card, Text, Badge, Button, tokens } from '@superapp/ui';

interface MealListProps {
  meals: MealLog[];
  loading: boolean;
  onRefresh: () => void;
}

const mealTypeConfig: Record<string, { label: string; icon: string; badgeVariant: 'success' | 'warning' | 'info' | 'primary' }> = {
  breakfast: { label: 'Завтрак', icon: '🌅', badgeVariant: 'success' },
  lunch: { label: 'Обед', icon: '☀️', badgeVariant: 'warning' },
  dinner: { label: 'Ужин', icon: '🌙', badgeVariant: 'info' },
  snack: { label: 'Перекус', icon: '🍎', badgeVariant: 'primary' },
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
    const confirmed = window.confirm('Удалить этот приём пищи?');
    if (!confirmed) return;

    try {
      await mealLogService.delete(id);
      onRefresh();
    } catch {
      alert('Ошибка удаления');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text muted>Загрузка...</Text>
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
        <Text muted>Записей пока нет.</Text>
        <Text muted size="sm" style={{ marginTop: 4 }}>
          Добавьте первый приём пищи!
        </Text>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {meals.map((meal) => {
        const config = mealTypeConfig[meal.meal_type] ?? {
          label: meal.meal_type,
          icon: '🍽️',
          badgeVariant: 'default' as const,
        };

        return (
          <Card key={meal.id} padding="lg">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 24 }}>{config.icon}</span>
                <Badge variant={config.badgeVariant} dot>
                  {config.label}
                </Badge>
                <Text muted size="sm">{formatDate(meal.eaten_at)}</Text>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(meal.id)}
                style={{ color: tokens.colors.error, padding: '4px 8px', flexShrink: 0 }}
              >
                Удалить
              </Button>
            </div>

            {/* Food Items */}
            {meal.items && meal.items.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: 10,
                  borderRadius: tokens.radius.md,
                  background: tokens.colors.background,
                }}
              >
                {meal.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      borderRadius: tokens.radius.sm,
                    }}
                  >
                    <Text muted size="sm">{item.name}</Text>
                    <Text size="sm" fontWeight={600} style={{ color: tokens.colors.primary }}>
                      {item.grams} г
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Text muted size="sm" style={{ padding: 8 }}>
                Нет продуктов
              </Text>
            )}
          </Card>
        );
      })}
    </div>
  );
}

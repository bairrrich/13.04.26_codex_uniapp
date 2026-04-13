'use client';

import { useState, type FormEvent } from 'react';
import { mealLogService, type MealItemInput } from '../services/nutritionService';
import { Button, Card, Input, Text, tokens } from '@superapp/ui';

interface MealFormProps {
  onSuccess?: () => void;
}

const mealTypes = [
  { value: 'breakfast' as const, label: 'Завтрак', icon: '🌅' },
  { value: 'lunch' as const, label: 'Обед', icon: '☀️' },
  { value: 'dinner' as const, label: 'Ужин', icon: '🌙' },
  { value: 'snack' as const, label: 'Перекус', icon: '🍎' },
];

interface FoodItemInput {
  name: string;
  grams: string;
}

export function MealForm({ onSuccess }: MealFormProps) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [items, setItems] = useState<FoodItemInput[]>([{ name: '', grams: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => setItems((prev) => [...prev, { name: '', grams: '' }]);

  const updateItem = (index: number, field: keyof FoodItemInput, value: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validItems = items.filter((item) => item.name.trim() && item.grams.trim());
    if (validItems.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const mealItems: MealItemInput[] = validItems.map((item) => ({
        name: item.name.trim(),
        grams: parseFloat(item.grams),
      }));

      await mealLogService.createWithItems({
        meal_type: mealType,
        items: mealItems,
      });

      setItems([{ name: '', grams: '' }]);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = mealTypes.find((t) => t.value === mealType);

  return (
    <Card padding="2xl" style={{ marginBottom: 24 }}>
      <Text fontWeight={600} size="lg" style={{ marginBottom: 16 }}>
        {selectedType?.icon} Записать приём пищи
      </Text>

      {/* Meal Type Selector */}
      <div style={{ marginBottom: 16 }}>
        <Text muted size="sm" style={{ display: 'block', marginBottom: 8 }}>
          Тип приёма пищи
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
          {mealTypes.map((type) => {
            const isSelected = mealType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setMealType(type.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '12px 8px',
                  borderRadius: tokens.radius.lg,
                  border: `2px solid ${isSelected ? tokens.colors.primary : tokens.colors.border}`,
                  background: isSelected ? tokens.colors.surfaceActive : 'transparent',
                  color: isSelected ? tokens.colors.primary : tokens.colors.muted,
                  cursor: 'pointer',
                  fontSize: tokens.fontSizes.sm,
                  fontWeight: tokens.fontWeights.medium,
                  transition: tokens.transitions.base,
                }}
              >
                <span style={{ fontSize: 24 }}>{type.icon}</span>
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Food Items */}
      <div style={{ marginBottom: 16 }}>
        <Text muted size="sm" style={{ display: 'block', marginBottom: 8 }}>
          Продукты
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: 8,
                borderRadius: tokens.radius.md,
                background: tokens.colors.background,
              }}
            >
              <span style={{ color: tokens.colors.mutedLight, fontSize: 12, minWidth: 20 }}>
                {index + 1}.
              </span>
              <Input
                placeholder="Название"
                value={item.name}
                onChange={(e) => updateItem(index, 'name', e.target.value)}
                fullWidth
                style={{ flex: 1 }}
              />
              <Input
                type="number"
                placeholder="г"
                value={item.grams}
                onChange={(e) => updateItem(index, 'grams', e.target.value)}
                style={{ width: 72 }}
              />
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  style={{ color: tokens.colors.error, padding: '4px 8px' }}
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={addItem} style={{ marginTop: 8 }}>
          + Добавить продукт
        </Button>
      </div>

      {/* Error */}
      {error && <Text error style={{ marginBottom: 12 }}>{error}</Text>}

      {/* Submit */}
      <Button
        type="submit"
        loading={loading}
        fullWidth
        size="lg"
        onClick={handleSubmit}
      >
        {loading ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </Card>
  );
}

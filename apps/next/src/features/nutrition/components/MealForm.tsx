'use client';

import { useState, type FormEvent } from 'react';
import { mealLogService, mealItemService } from '../services/nutritionService';
import { Button, Card, Input, Text } from '@superapp/ui';

interface MealFormProps {
  onSuccess?: () => void;
}

const mealTypes = [
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch', label: 'Обед' },
  { value: 'dinner', label: 'Ужин' },
  { value: 'snack', label: 'Перекус' },
] as const;

interface MealItemInput {
  name: string;
  grams: string;
}

export function MealForm({ onSuccess }: MealFormProps) {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [items, setItems] = useState<MealItemInput[]>([{ name: '', grams: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = () => setItems((prev) => [...prev, { name: '', grams: '' }]);

  const updateItem = (index: number, field: keyof MealItemInput, value: string) => {
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
      const mealLog = await mealLogService.create({ meal_type: mealType });

      await Promise.all(
        validItems.map((item) =>
          mealItemService.create({
            meal_log_id: mealLog.id,
            name: item.name.trim(),
            grams: parseFloat(item.grams),
          })
        )
      );

      setItems([{ name: '', grams: '' }]);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="2xl" style={{ marginBottom: 24 }}>
      <Text fontWeight={600} size="lg" style={{ marginBottom: 16 }}>Записать приём пищи</Text>

      <div style={{ marginBottom: 12 }}>
        <Text muted size="sm" style={{ display: 'block', marginBottom: 8 }}>Тип приёма пищи</Text>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {mealTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setMealType(type.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: mealType === type.value ? '2px solid #5B6CFF' : '2px solid #333',
                background: mealType === type.value ? '#1e2a4a' : 'transparent',
                color: mealType === type.value ? '#5B6CFF' : '#888',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Text muted size="sm" style={{ display: 'block', marginBottom: 8 }}>Продукты</Text>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
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
              <button
                type="button"
                onClick={() => removeItem(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: '4px 8px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addItem} style={{ marginTop: 4 }}>
          + Добавить продукт
        </Button>
      </div>

      {error && <Text error style={{ marginBottom: 12 }}>{error}</Text>}

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

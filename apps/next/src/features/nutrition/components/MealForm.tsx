'use client';

import { useState, type FormEvent } from 'react';
import { mealLogService, mealItemService } from '../services/nutritionService';

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

  const addItem = () => {
    setItems((prev) => [...prev, { name: '', grams: '' }]);
  };

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
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 16px', color: '#F4F7FF' }}>Записать приём пищи</h3>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#888' }}>
          Тип приёма пищи
        </label>
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
        <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#888' }}>
          Продукты
        </label>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Название"
              value={item.name}
              onChange={(e) => updateItem(index, 'name', e.target.value)}
              required={items.length === 1}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: '1px solid #333',
                background: '#111827',
                color: '#F4F7FF',
                fontSize: 14,
              }}
            />
            <input
              type="number"
              placeholder="г"
              value={item.grams}
              onChange={(e) => updateItem(index, 'grams', e.target.value)}
              required={items.length === 1}
              min={1}
              style={{
                width: 72,
                padding: 10,
                borderRadius: 8,
                border: '1px solid #333',
                background: '#111827',
                color: '#F4F7FF',
                fontSize: 14,
              }}
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
        <button
          type="button"
          onClick={addItem}
          style={{
            background: 'none',
            border: '1px dashed #5B6CFF',
            borderRadius: 8,
            color: '#5B6CFF',
            cursor: 'pointer',
            padding: '8px 16px',
            fontSize: 13,
            marginTop: 4,
          }}
        >
          + Добавить продукт
        </button>
      </div>

      {error && <p style={{ color: '#ff6b6b', marginTop: 8 }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 12,
          padding: '10px 24px',
          borderRadius: 8,
          border: 'none',
          background: loading ? '#333' : '#5B6CFF',
          color: '#fff',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: 15,
        }}
      >
        {loading ? 'Сохранение...' : 'Сохранить'}
      </button>
    </form>
  );
}

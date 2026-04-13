'use client';

import { useState, type FormEvent } from 'react';
import { waterLogService } from '../services/nutritionService';
import { Button, Card, Input, Text } from '@superapp/ui';

interface WaterFormProps {
  onSuccess?: () => void;
}

const quickAmounts = [150, 250, 350, 500];

export function WaterForm({ onSuccess }: WaterFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await waterLogService.create({ amount_ml: parseFloat(amount) });
      setAmount('');
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="2xl" style={{ marginBottom: 24 }}>
      <Text fontWeight={600} size="lg" style={{ marginBottom: 16 }}>💧 Вода</Text>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {quickAmounts.map((ml) => (
          <button
            key={ml}
            type="button"
            onClick={() => setAmount(String(ml))}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: amount === String(ml) ? '2px solid #5B6CFF' : '2px solid #333',
              background: amount === String(ml) ? '#1e2a4a' : 'transparent',
              color: amount === String(ml) ? '#5B6CFF' : '#888',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {ml} мл
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Input
          type="number"
          placeholder="Своё количество (мл)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
        />
        <Button
          loading={loading}
          disabled={!amount}
          size="lg"
          onClick={handleSubmit}
        >
          Записать
        </Button>
      </div>

      {error && <Text error style={{ marginTop: 12 }}>{error}</Text>}
      {success && <Text success style={{ marginTop: 12 }}>Вода записана! ✓</Text>}
    </Card>
  );
}

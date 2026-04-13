'use client';

import { useState, type FormEvent } from 'react';
import { waterLogService } from '../services/nutritionService';

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
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 16px', color: '#F4F7FF' }}>💧 Вода</h3>

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
        <input
          type="number"
          placeholder="Своё количество (мл)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
          required
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            border: '1px solid #333',
            background: '#111827',
            color: '#F4F7FF',
            fontSize: 15,
          }}
        />
        <button
          type="submit"
          disabled={loading || !amount}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: 'none',
            background: amount ? '#5B6CFF' : '#333',
            color: '#fff',
            cursor: !amount || loading ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          {loading ? '...' : 'Записать'}
        </button>
      </div>

      {error && <p style={{ color: '#ff6b6b', marginTop: 8 }}>{error}</p>}
      {success && (
        <p style={{ color: '#4ade80', marginTop: 8 }}>
          Вода записана! ✓
        </p>
      )}
    </form>
  );
}

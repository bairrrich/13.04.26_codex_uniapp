'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { waterLogService } from '../services/nutritionService';
import type { WaterTodayStats } from '../services/nutritionService';
import { Button, Card, Input, Text, tokens } from '@superapp/ui';

interface WaterFormProps {
  onSuccess?: () => void;
}

const quickAmounts = [
  { value: 150, label: '150 мл', icon: '🥃' },
  { value: 250, label: '250 мл', icon: '🥤' },
  { value: 350, label: '350 мл', icon: '🍺' },
  { value: 500, label: '500 мл', icon: '🍶' },
];

export function WaterForm({ onSuccess }: WaterFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [todayStats, setTodayStats] = useState<WaterTodayStats>({
    total_ml: 0,
    goal_ml: 2000,
    percentage: 0,
    entries: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchTodayStats = async () => {
    try {
      setStatsLoading(false);
      const stats = await waterLogService.getTodayTotal();
      setTodayStats(stats);
    } catch {
      // silently ignore stats error
    }
  };

  useEffect(() => {
    fetchTodayStats();
  }, []);

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
      await fetchTodayStats();
      onSuccess?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (ml: number) => {
    setAmount(String(ml));
  };

  return (
    <Card padding="2xl" style={{ marginBottom: 24 }}>
      <Text fontWeight={600} size="lg" style={{ marginBottom: 16 }}>
        Вода
      </Text>

      {/* Today's Total */}
      <div
        style={{
          padding: 12,
          borderRadius: tokens.radius.lg,
          background: tokens.colors.background,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text size="sm" muted>Сегодня</Text>
          <Text size="sm" fontWeight={600}>
            {todayStats.total_ml} / {todayStats.goal_ml} мл
          </Text>
        </div>
        {/* Progress Bar */}
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: tokens.colors.surface,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${todayStats.percentage}%`,
              borderRadius: 4,
              background:
                todayStats.percentage >= 100
                  ? tokens.colors.success
                  : todayStats.percentage >= 50
                    ? tokens.colors.primary
                    : tokens.colors.info,
              transition: `width ${tokens.transitions.slow}`,
            }}
          />
        </div>
        <Text size="xs" muted style={{ marginTop: 4, textAlign: 'right' }}>
          {Math.round(todayStats.percentage)}%{todayStats.entries > 0 && ` (${todayStats.entries} записей)`}
        </Text>
      </div>

      {/* Quick Amount Buttons */}
      <div style={{ marginBottom: 12 }}>
        <Text muted size="sm" style={{ display: 'block', marginBottom: 8 }}>
          Быстрый выбор
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {quickAmounts.map((option) => {
            const isSelected = amount === String(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleQuickAmount(option.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '10px 8px',
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
                <span style={{ fontSize: 20 }}>{option.icon}</span>
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Input
          type="number"
          placeholder="Своё количество (мл)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          fullWidth
        />
        <Button
          type="submit"
          loading={loading}
          disabled={!amount || parseFloat(amount) <= 0}
          size="lg"
          onClick={handleSubmit}
        >
          Записать
        </Button>
      </div>

      {/* Feedback */}
      {error && <Text error style={{ marginTop: 12 }}>{error}</Text>}
      {success && (
        <Text success style={{ marginTop: 12 }}>
          Вода записана!
        </Text>
      )}
    </Card>
  );
}

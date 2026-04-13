'use client';

import { useState, type FormEvent } from 'react';
import {
  transactionService,
  type Account,
  type Category,
} from '../services/financeService';
import { Button, Card, Input, Select, Text, Divider, TextArea } from '@superapp/ui';
import { tokens } from '@superapp/ui';

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  onSuccess?: () => void;
}

export function TransactionForm({ accounts, categories, onSuccess }: TransactionFormProps) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [kind, setKind] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountValue = parseInt(amount, 10);
  const isValidAmount = !isNaN(amountValue) && amountValue > 0;
  const hasErrors = !accountId || !isValidAmount;

  const filteredCategories = categories.filter((c) => c.kind === kind);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isValidAmount || !accountId) {
      setError('Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await transactionService.create({
        account_id: accountId,
        category_id: categoryId || null,
        kind,
        amount_minor: amountValue,
        occurred_at: date ? new Date(date).toISOString() : new Date().toISOString(),
      });
      setAmount('');
      setCategoryId('');
      setDescription('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="2xl" style={{ marginBottom: 24 }}>
      <Text fontWeight={600} size="lg" style={{ marginBottom: 16 }}>Новая транзакция</Text>

      <Divider style={{ marginBottom: 20 }} />

      {/* Kind selector */}
      <div style={{ marginBottom: 20 }}>
        <Text muted size="sm" style={{ display: 'block', marginBottom: 8 }}>Тип</Text>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['expense', 'income'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setKind(k); setCategoryId(''); }}
              style={{
                padding: '8px 16px',
                borderRadius: tokens.radius.md,
                border: kind === k ? `2px solid ${tokens.colors.primary}` : `2px solid ${tokens.colors.border}`,
                background: kind === k ? tokens.colors.surfaceActive : 'transparent',
                color: kind === k ? tokens.colors.text : tokens.colors.muted,
                cursor: 'pointer',
                fontWeight: tokens.fontWeights.semibold,
                fontSize: tokens.fontSizes.sm,
                transition: tokens.transitions.fast,
              }}
            >
              {k === 'expense' ? 'Расход' : 'Доход'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {/* Account */}
          <div>
            <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Счёт *</Text>
            <Select
              options={accounts.map((acc) => ({ value: acc.id, label: `${acc.name} (${acc.currency_code})` }))}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              fullWidth
            />
          </div>

          {/* Category */}
          <div>
            <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Категория</Text>
            <Select
              options={[
                { value: '', label: 'Без категории' },
                ...filteredCategories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              fullWidth
            />
          </div>

          {/* Amount and Date row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Сумма (в минорных единицах) *</Text>
              <Input
                type="number"
                placeholder="1000"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null); }}
                fullWidth
              />
              {amount && !isValidAmount && (
                <Text size="xs" style={{ color: tokens.colors.error, marginTop: 4 }}>
                  Сумма должна быть больше 0
                </Text>
              )}
            </div>

            <div>
              <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Дата</Text>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Описание</Text>
            <TextArea
              placeholder="Комментарий к транзакции..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              rows={2}
            />
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Card variant="outlined" style={{ marginBottom: 16, borderColor: tokens.colors.error }}>
            <Text size="sm" style={{ color: tokens.colors.error }}>{error}</Text>
          </Card>
        )}

        <Button
          type="submit"
          loading={loading}
          disabled={hasErrors}
          fullWidth
          size="lg"
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </form>
    </Card>
  );
}

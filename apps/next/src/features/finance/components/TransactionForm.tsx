'use client';

import { useState, type FormEvent } from 'react';
import { transactionService, categoryService, accountService, type Account, type Category } from '../services/financeService';
import { Button, Card, Input, Select, Text } from '@superapp/ui';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amountValue = parseInt(amount, 10);
    if (!accountId || isNaN(amountValue) || amountValue <= 0) return;

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
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.kind === kind);

  return (
    <Card padding="2xl" style={{ marginBottom: 24 }}>
      <Text fontWeight={600} size="lg" style={{ marginBottom: 16 }}>Новая транзакция</Text>

      <div style={{ marginBottom: 12 }}>
        <Text muted size="sm" style={{ display: 'block', marginBottom: 8 }}>Тип</Text>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['expense', 'income'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setKind(k); setCategoryId(''); }}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: kind === k ? '2px solid #5B6CFF' : '2px solid transparent',
                background: kind === k ? '#1e2a4a' : 'transparent',
                color: kind === k ? '#F4F7FF' : '#888',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {k === 'expense' ? 'Расход' : 'Доход'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        <div>
          <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Счёт</Text>
          <Select
            options={accounts.map((acc) => ({ value: acc.id, label: `${acc.name} (${acc.currency_code})` }))}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            fullWidth
          />
        </div>

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

        <div>
          <Text muted size="sm" style={{ display: 'block', marginBottom: 4 }}>Сумма (в минорных единицах)</Text>
          <Input
            type="number"
            placeholder="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
          />
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

      {error && <Text error style={{ marginBottom: 12 }}>{error}</Text>}

      <Button
        type="submit"
        loading={loading}
        disabled={!amount || parseInt(amount, 10) <= 0}
        fullWidth
        size="lg"
        onClick={handleSubmit}
      >
        {loading ? 'Сохранение...' : 'Сохранить'}
      </Button>
    </Card>
  );
}

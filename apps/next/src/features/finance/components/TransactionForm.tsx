'use client';

import { useState, type FormEvent } from 'react';
import { transactionService, categoryService, accountService, type Account, type Category } from '../services/financeService';

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
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <h3>Новая транзакция</h3>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#888' }}>Тип</label>
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

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#888' }}>Счёт</label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #333',
            background: '#111827',
            color: '#F4F7FF',
            fontSize: 15,
            boxSizing: 'border-box',
          }}
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency_code})</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#888' }}>Категория</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #333',
            background: '#111827',
            color: '#F4F7FF',
            fontSize: 15,
            boxSizing: 'border-box',
          }}
        >
          <option value="">Без категории</option>
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#888' }}>Сумма (в минорных единицах)</label>
        <input
          type="number"
          placeholder="1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          required
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #333',
            background: '#111827',
            color: '#F4F7FF',
            fontSize: 15,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 14, color: '#888' }}>Дата</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #333',
            background: '#111827',
            color: '#F4F7FF',
            fontSize: 15,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && <p style={{ color: '#ff6b6b', marginTop: 8 }}>{error}</p>}

      <button
        type="submit"
        disabled={loading || !amount || parseInt(amount, 10) <= 0}
        style={{
          marginTop: 12,
          padding: '10px 24px',
          borderRadius: 8,
          border: 'none',
          background: amount && parseInt(amount, 10) > 0 ? '#5B6CFF' : '#333',
          color: '#fff',
          cursor: loading || !amount || parseInt(amount, 10) <= 0 ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}
      >
        {loading ? 'Сохранение...' : 'Сохранить'}
      </button>
    </form>
  );
}

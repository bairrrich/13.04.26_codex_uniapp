'use client';

import type { Transaction, Account, Category } from '../services/financeService';
import { transactionService } from '../services/financeService';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  loading: boolean;
  onRefresh: () => void;
}

function formatAmount(amountMinor: number, currencyCode: string): string {
  const major = amountMinor / 100;
  return `${major.toFixed(2)} ${currencyCode}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TransactionList({ transactions, accounts, categories, loading, onRefresh }: TransactionListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить транзакцию?')) return;
    try {
      await transactionService.delete(id);
      onRefresh();
    } catch {
      alert('Ошибка удаления');
    }
  };

  const getAccountName = (accountId: string): string => {
    return accounts.find((a) => a.id === accountId)?.name ?? 'Неизвестный счёт';
  };

  const getCategoryName = (categoryId: string | null): string | null => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId)?.name ?? null;
  };

  const getCurrency = (accountId: string): string => {
    return accounts.find((a) => a.id === accountId)?.currency_code ?? '';
  };

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}>Загрузка...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
        <p>Транзакций пока нет. Создайте первую!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {transactions.map((tx) => {
        const isIncome = tx.kind === 'income';
        const currency = getCurrency(tx.account_id);

        return (
          <div
            key={tx.id}
            style={{
              padding: 16,
              borderRadius: 10,
              border: '1px solid #333',
              background: '#111827',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    background: isIncome ? '#0d2818' : '#2d1215',
                    color: isIncome ? '#34d399' : '#ff6b6b',
                  }}
                >
                  {isIncome ? 'Доход' : 'Расход'}
                </span>
                <span style={{ fontSize: 13, color: '#888' }}>{formatDate(tx.occurred_at)}</span>
              </div>
              <button
                onClick={() => handleDelete(tx.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff6b6b',
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: '4px 8px',
                }}
                title="Удалить"
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#aaa' }}>
                <span>{getAccountName(tx.account_id)}</span>
                {getCategoryName(tx.category_id) && (
                  <span style={{ color: '#5B6CFF' }}>{getCategoryName(tx.category_id)}</span>
                )}
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  color: isIncome ? '#34d399' : '#ff6b6b',
                }}
              >
                {isIncome ? '+' : '-'}{formatAmount(tx.amount_minor, currency)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import type { Transaction, Account, Category } from '../services/financeService';
import { transactionService } from '../services/financeService';
import { Card, Text, Badge } from '@superapp/ui';

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
    return <div style={{ padding: 24, textAlign: 'center' }}><Text muted>Загрузка...</Text></div>;
  }

  if (transactions.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text muted>Транзакций пока нет. Создайте первую!</Text>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {transactions.map((tx) => {
        const isIncome = tx.kind === 'income';
        const currency = getCurrency(tx.account_id);

        return (
          <Card key={tx.id} padding="lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Badge variant={isIncome ? 'success' : 'error'}>
                  {isIncome ? 'Доход' : 'Расход'}
                </Badge>
                <Text muted size="sm">{formatDate(tx.occurred_at)}</Text>
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
              <div style={{ display: 'flex', gap: 12 }}>
                <Text muted size="sm">{getAccountName(tx.account_id)}</Text>
                {getCategoryName(tx.category_id) && (
                  <Text size="sm" style={{ color: '#5B6CFF' }}>{getCategoryName(tx.category_id)}</Text>
                )}
              </div>
              <Text
                fontWeight={700}
                size="lg"
                style={{ color: isIncome ? '#34d399' : '#ff6b6b' }}
              >
                {isIncome ? '+' : '-'}{formatAmount(tx.amount_minor, currency)}
              </Text>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

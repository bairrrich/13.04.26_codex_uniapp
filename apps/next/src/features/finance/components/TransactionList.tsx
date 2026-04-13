'use client';

import type { Transaction, Account, Category } from '../services/financeService';
import { transactionService } from '../services/financeService';
import { Card, Text, Badge } from '@superapp/ui';
import { tokens } from '@superapp/ui';

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  loading: boolean;
  onRefresh: () => void;
  totals?: { income: number; expense: number; balance: number };
}

function formatAmount(amountMinor: number, currencyCode: string): string {
  const major = amountMinor / 100;
  return `${major.toFixed(2)} ${currencyCode}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) return `Сегодня, ${timeStr}`;
  if (isYesterday) return `Вчера, ${timeStr}`;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTotal(amountMinor: number, currencyCode: string): string {
  const major = amountMinor / 100;
  return `${major.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyCode}`;
}

export function TransactionList({
  transactions,
  accounts,
  categories,
  loading,
  onRefresh,
  totals,
}: TransactionListProps) {
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
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text muted>Загрузка...</Text>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card variant="outlined" padding="2xl" style={{ textAlign: 'center' }}>
        <Text muted size="lg">Транзакций пока нет</Text>
        <Text muted size="sm" style={{ marginTop: 8 }}>
          Создайте первую транзакцию с помощью формы выше
        </Text>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Totals summary */}
      {totals && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Card padding="lg">
            <Text muted size="sm" style={{ marginBottom: 4 }}>Доходы</Text>
            <Text
              fontWeight={700}
              size="lg"
              style={{ color: tokens.colors.success }}
            >
              +{formatTotal(totals.income, 'RUB')}
            </Text>
          </Card>
          <Card padding="lg">
            <Text muted size="sm" style={{ marginBottom: 4 }}>Расходы</Text>
            <Text
              fontWeight={700}
              size="lg"
              style={{ color: tokens.colors.error }}
            >
              -{formatTotal(totals.expense, 'RUB')}
            </Text>
          </Card>
          <Card padding="lg">
            <Text muted size="sm" style={{ marginBottom: 4 }}>Баланс</Text>
            <Text
              fontWeight={700}
              size="lg"
              style={{
                color: totals.balance >= 0 ? tokens.colors.success : tokens.colors.error,
              }}
            >
              {totals.balance >= 0 ? '+' : '-'}{formatTotal(Math.abs(totals.balance), 'RUB')}
            </Text>
          </Card>
        </div>
      )}

      {/* Transaction count */}
      <Text muted size="sm">{transactions.length} транзакций</Text>

      {/* Transaction list */}
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
                    color: tokens.colors.error,
                    cursor: 'pointer',
                    fontSize: tokens.fontSizes.xl,
                    padding: '4px 8px',
                    lineHeight: 1,
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
                    <Text size="sm" style={{ color: tokens.colors.primary }}>
                      {getCategoryName(tx.category_id)}
                    </Text>
                  )}
                </div>
                <Text
                  fontWeight={700}
                  size="lg"
                  style={{ color: isIncome ? tokens.colors.success : tokens.colors.error }}
                >
                  {isIncome ? '+' : '-'}{formatAmount(tx.amount_minor, currency)}
                </Text>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

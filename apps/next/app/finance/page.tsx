'use client';

import { useState, useEffect, useCallback } from 'react';
import { TransactionForm } from '../../src/features/finance/components/TransactionForm';
import { TransactionList } from '../../src/features/finance/components/TransactionList';
import {
  transactionService,
  accountService,
  categoryService,
  type Transaction,
  type Account,
  type Category,
} from '../../src/features/finance/services/financeService';
import { Heading, Card, Text, SkeletonCard, tokens } from '@superapp/ui';
import { AppLayout } from '../../src/components/AppLayout';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<{ income: number; expense: number; balance: number } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [txs, accs, cats, totalsData] = await Promise.all([
        transactionService.list(),
        accountService.listAll(),
        categoryService.listAll(),
        transactionService.getTotals(),
      ]);
      setTransactions(txs);
      setAccounts(accs);
      setCategories(cats);
      setTotals(totalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <AppLayout headerTitle="Финансы" headerSubtitle="Управление бюджетом">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout headerTitle="Финансы" headerSubtitle="Управление бюджетом">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Error state */}
        {error && (
          <Card
            variant="outlined"
            padding="lg"
            style={{ marginBottom: 24, borderColor: tokens.colors.error }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text size="sm" style={{ color: tokens.colors.error }}>{error}</Text>
              <button
                onClick={fetchData}
                style={{
                  background: 'none',
                  border: 'none',
                  color: tokens.colors.primary,
                  cursor: 'pointer',
                  fontWeight: tokens.fontWeights.semibold,
                  fontSize: tokens.fontSizes.sm,
                }}
              >
                Повторить
              </button>
            </div>
          </Card>
        )}

        {/* Transaction form */}
        {accounts.length > 0 && categories.length > 0 ? (
          <TransactionForm accounts={accounts} categories={categories} onSuccess={fetchData} />
        ) : (
          <Card
            variant="outlined"
            padding="lg"
            style={{ marginBottom: 24, borderColor: tokens.colors.primary }}
          >
            <Text muted>
              Для создания транзакций необходимы хотя бы один счёт и одна категория.
            </Text>
          </Card>
        )}

        {/* Transaction list with totals */}
        <TransactionList
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          loading={loading}
          onRefresh={fetchData}
          totals={totals ?? undefined}
        />
      </div>
    </AppLayout>
  );
}

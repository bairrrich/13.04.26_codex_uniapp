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
import { Heading, Card, Text } from '@superapp/ui';

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [txs, accs, cats] = await Promise.all([
        transactionService.list(),
        accountService.list(),
        categoryService.list(),
      ]);
      setTransactions(txs);
      setAccounts(accs);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <Heading style={{ marginBottom: 24 }}>💰 Финансы</Heading>

      {accounts.length > 0 && categories.length > 0 ? (
        <TransactionForm accounts={accounts} categories={categories} onSuccess={fetchData} />
      ) : (
        <Card padding="lg" style={{ marginBottom: 16, borderColor: '#5B6CFF' }}>
          <Text muted>
            Для создания транзакций необходимы хотя бы один счёт и одна категория.
          </Text>
        </Card>
      )}

      {error && (
        <Card padding="lg" style={{ marginBottom: 16, borderColor: '#ff6b6b' }}>
          <Text error>{error}</Text>
        </Card>
      )}

      <TransactionList
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        loading={loading}
        onRefresh={fetchData}
      />
    </main>
  );
}

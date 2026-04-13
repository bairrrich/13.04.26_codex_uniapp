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
      <h1>💰 Финансы</h1>

      {accounts.length > 0 && categories.length > 0 ? (
        <TransactionForm accounts={accounts} categories={categories} onSuccess={fetchData} />
      ) : (
        <div style={{ padding: 16, borderRadius: 8, background: '#1a1a2e', border: '1px solid #5B6CFF', marginBottom: 16 }}>
          <p style={{ color: '#aaa', margin: 0 }}>
            Для создания транзакций необходимы хотя бы один счёт и одна категория.
          </p>
        </div>
      )}

      {error && (
        <div style={{ padding: 16, borderRadius: 8, background: '#2d1215', border: '1px solid #ff6b6b', marginBottom: 16 }}>
          <p style={{ color: '#ff6b6b', margin: 0 }}>{error}</p>
        </div>
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

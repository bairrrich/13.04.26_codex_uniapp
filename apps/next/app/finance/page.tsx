'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '../../src/components/AppLayout';
import { Card, Text, Button, Badge, Skeleton, Divider } from '@superapp/ui';
import { tokens } from '@superapp/ui';
import { accountService, transactionService, type Transaction } from '../../src/features/finance/services/financeService';
import { AccountsTab } from '../../src/features/finance/components/AccountsTab';
import { TransactionsTab } from '../../src/features/finance/components/TransactionsTab';
import { CategoriesTab } from '../../src/features/finance/components/CategoriesTab';
import { BudgetsTab } from '../../src/features/finance/components/BudgetsTab';
import { RecurringTab } from '../../src/features/finance/components/RecurringTab';
import { AnalyticsTab } from '../../src/features/finance/components/AnalyticsTab';

const TABS = ['Обзор', 'Счета', 'Транзакции', 'Категории', 'Бюджеты', 'Повторения', 'Аналитика'] as const;
type Tab = (typeof TABS)[number];

function formatCurrency(amountMinor: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amountMinor / 100);
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('Обзор');
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [incomeMonth, setIncomeMonth] = useState(0);
  const [expenseMonth, setExpenseMonth] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [balance, stats, recent] = await Promise.all([
        accountService.getTotalBalance(),
        transactionService.getStats(),
        transactionService.list({}, { page: 1, limit: 5 }),
      ]);
      setTotalBalance(balance);
      setIncomeMonth(stats.totalIncome);
      setExpenseMonth(stats.totalExpense);
      setTransactionCount(stats.incomeCount + stats.expenseCount);
      setRecentTransactions(recent.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppLayout headerTitle="Финансы" headerSubtitle="Управление бюджетом">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 8 }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              fontSize: tokens.fontSizes.sm,
              fontWeight: activeTab === tab ? tokens.fontWeights.semibold : tokens.fontWeights.medium,
              color: activeTab === tab ? tokens.colors.primary : tokens.colors.textSecondary,
              backgroundColor: activeTab === tab ? tokens.colors.primaryLight : 'transparent',
              border: `1px solid ${activeTab === tab ? tokens.colors.primary : tokens.colors.border}`,
              borderRadius: tokens.radius.md,
              cursor: 'pointer',
              transition: `all ${tokens.transitions.fast}`,
              fontFamily: 'inherit',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Обзор' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} padding="lg">
                  <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
                  <Skeleton width="40%" height={24} />
                </Card>
              ))
            ) : (
              <>
                <SummaryCard icon="💰" label="Общий баланс" value={formatCurrency(totalBalance)} />
                <SummaryCard icon="📈" label="Доход за всё время" value={formatCurrency(incomeMonth)} />
                <SummaryCard icon="📉" label="Расход за всё время" value={formatCurrency(expenseMonth)} />
                <SummaryCard icon="💳" label="Транзакции" value={String(transactionCount)} />
              </>
            )}
          </div>

          {/* Quick Actions */}
          <Card padding="lg">
            <Text fontWeight="semibold" size="lg" style={{ marginBottom: 12 }}>⚡ Быстрые действия</Text>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <QuickAction icon="💳" label="Доход" color={tokens.colors.success} onClick={() => setActiveTab('Транзакции')} />
              <QuickAction icon="🛒" label="Расход" color={tokens.colors.error} onClick={() => setActiveTab('Транзакции')} />
              <QuickAction icon="🔄" label="Перевод" color={tokens.colors.info} onClick={() => setActiveTab('Транзакции')} />
              <QuickAction icon="📊" label="Бюджет" color={tokens.colors.warning} onClick={() => setActiveTab('Бюджеты')} />
              <QuickAction icon="📁" label="Категория" color={tokens.colors.primary} onClick={() => setActiveTab('Категории')} />
              <QuickAction icon="📈" label="Аналитика" color={tokens.colors.success} onClick={() => setActiveTab('Аналитика')} />
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card padding="lg">
            <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>Последние операции</Text>
            {recentTransactions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentTransactions.map((tx) => (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <div>
                      <Badge variant={tx.kind === 'income' ? 'success' : 'error'} size="sm">
                        {tx.kind === 'income' ? 'Доход' : 'Расход'}
                      </Badge>
                      <Text muted size="sm" style={{ marginTop: 4 }}>
                        {new Date(tx.occurred_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </Text>
                    </div>
                    <Text fontWeight="semibold" style={{ color: tx.kind === 'income' ? tokens.colors.success : tokens.colors.error }}>
                      {tx.kind === 'income' ? '+' : '−'}{formatCurrency(tx.amount_minor)}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Text muted>Нет транзакций</Text>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'Счета' && <AccountsTab />}
      {activeTab === 'Транзакции' && <TransactionsTab />}
      {activeTab === 'Категории' && <CategoriesTab />}
      {activeTab === 'Бюджеты' && <BudgetsTab />}
      {activeTab === 'Повторения' && <RecurringTab />}
      {activeTab === 'Аналитика' && <AnalyticsTab />}
    </AppLayout>
  );
}

function SummaryCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Card padding="lg">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: tokens.colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
        <div>
          <Text muted size="sm">{label}</Text>
          <Text size="xl" fontWeight="bold">{value}</Text>
        </div>
      </div>
    </Card>
  );
}

function QuickAction({ icon, label, color, onClick }: { icon: string; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: tokens.radius.lg,
        border: `1px solid ${tokens.colors.border}`,
        background: tokens.colors.surface,
        cursor: 'pointer',
        transition: `all ${tokens.transitions.fast}`,
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = color;
        (e.currentTarget as HTMLElement).style.background = tokens.colors.surfaceHover;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = tokens.colors.border;
        (e.currentTarget as HTMLElement).style.background = tokens.colors.surface;
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <Text size="sm" fontWeight="medium">{label}</Text>
    </button>
  );
}

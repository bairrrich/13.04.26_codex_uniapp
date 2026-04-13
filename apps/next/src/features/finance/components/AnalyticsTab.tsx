'use client';

import { useState, useEffect, useCallback } from 'react';
import { transactionService, type CategoryBreakdown, type MonthlyTrend } from '../services/financeService';
import { Card, Text, Button, Badge, Skeleton } from '@superapp/ui';
import { tokens } from '@superapp/ui';

function formatCurrency(amountMinor: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(amountMinor / 100);
}

export function AnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [expenseBreakdown, setExpenseBreakdown] = useState<CategoryBreakdown[]>([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [stats, setStats] = useState<{ totalIncome: number; totalExpense: number; balance: number } | null>(null);
  const [period, setPeriod] = useState<'3' | '6' | '12'>('6');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseBD, incomeBD, trend, statsData] = await Promise.all([
        transactionService.getCategoryBreakdown('expense', 10),
        transactionService.getCategoryBreakdown('income', 10),
        transactionService.getMonthlyTrend(parseInt(period)),
        transactionService.getStats(),
      ]);
      setExpenseBreakdown(expenseBD);
      setIncomeBreakdown(incomeBD);
      setMonthlyTrend(trend);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  const maxExpense = expenseBreakdown.length > 0 ? expenseBreakdown[0].total : 1;
  const maxIncome = incomeBreakdown.length > 0 ? incomeBreakdown[0].total : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['3', '6', '12'] as const).map((p) => (
          <Button key={p} variant={period === p ? 'primary' : 'secondary'} size="sm" onPress={() => setPeriod(p)}>
            {p} мес
          </Button>
        ))}
      </div>

      {/* Summary */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[1, 2, 3].map((i) => <Card key={i} padding="lg"><Skeleton width="80%" height={24} /></Card>)}
        </div>
      ) : stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <StatCard label="Доходы" value={formatCurrency(stats.totalIncome)} color={tokens.colors.success} />
          <StatCard label="Расходы" value={formatCurrency(stats.totalExpense)} color={tokens.colors.error} />
          <StatCard label="Баланс" value={formatCurrency(stats.balance)} color={stats.balance >= 0 ? tokens.colors.success : tokens.colors.error} />
        </div>
      )}

      {/* Monthly trend chart */}
      <Card padding="lg">
        <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>📈 Динамика по месяцам</Text>
        {loading ? (
          <Skeleton width="100%" height={120} />
        ) : monthlyTrend.length > 0 ? (
          <div>
            {/* Simple bar chart */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140, marginBottom: 8 }}>
              {monthlyTrend.map((m, i) => {
                const maxVal = Math.max(m.income, m.expense, 1);
                const incomeHeight = (m.income / maxVal) * 120;
                const expenseHeight = (m.expense / maxVal) * 120;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 120 }}>
                      <div style={{ width: 12, height: incomeHeight, background: tokens.colors.success, borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                      <div style={{ width: 12, height: expenseHeight, background: tokens.colors.error, borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                    </div>
                    <Text muted size="xs">{m.month}</Text>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: tokens.colors.success }} />
                <Text muted size="sm">Доходы</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: tokens.colors.error }} />
                <Text muted size="sm">Расходы</Text>
              </div>
            </div>
          </div>
        ) : (
          <Text muted>Нет данных</Text>
        )}
      </Card>

      {/* Expense breakdown */}
      <Card padding="lg">
        <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>📉 Расходы по категориям</Text>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={24} />)}
          </div>
        ) : expenseBreakdown.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {expenseBreakdown.map((cat, i) => {
              const width = (cat.total / maxExpense) * 100;
              return (
                <div key={cat.category_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text size="sm">
                      {cat.category_icon ?? ''} {cat.category_name}
                    </Text>
                    <Text size="sm" fontWeight="semibold">{formatCurrency(cat.total)}</Text>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: tokens.colors.border, overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: cat.category_color, borderRadius: 3, transition: `width ${tokens.transitions.slow}` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Text muted>Нет данных о расходах</Text>
        )}
      </Card>

      {/* Income breakdown */}
      <Card padding="lg">
        <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>📈 Доходы по категориям</Text>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={24} />)}
          </div>
        ) : incomeBreakdown.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {incomeBreakdown.map((cat, i) => {
              const width = (cat.total / maxIncome) * 100;
              return (
                <div key={cat.category_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text size="sm">
                      {cat.category_icon ?? ''} {cat.category_name}
                    </Text>
                    <Text size="sm" fontWeight="semibold">{formatCurrency(cat.total)}</Text>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: tokens.colors.border, overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: cat.category_color, borderRadius: 3, transition: `width ${tokens.transitions.slow}` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Text muted>Нет данных о доходах</Text>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card padding="lg">
      <Text muted size="sm">{label}</Text>
      <Text size="xl" fontWeight="bold" style={{ color, marginTop: 4 }}>{value}</Text>
    </Card>
  );
}

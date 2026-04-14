'use client';

import { useState, useEffect, useCallback } from 'react';
import { transactionService, type CategoryBreakdown, type MonthlyTrend } from '../services/financeService';
import { Card, Text, Button, Badge, Skeleton, useTheme, tokens } from '@superapp/ui';

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
  const { tokens: c } = useTheme();

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
  const totalExpense = expenseBreakdown.reduce((sum, c) => sum + c.total, 0);

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
          <StatCard label="Доходы" value={formatCurrency(stats.totalIncome)} color={c.success} />
          <StatCard label="Расходы" value={formatCurrency(stats.totalExpense)} color={c.error} />
          <StatCard label="Баланс" value={formatCurrency(stats.balance)} color={stats.balance >= 0 ? c.success : c.error} />
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
                      <div style={{ width: 12, height: incomeHeight, background: c.success, borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                      <div style={{ width: 12, height: expenseHeight, background: c.error, borderRadius: '4px 4px 0 0', minHeight: 2 }} />
                    </div>
                    <Text muted size="xs">{m.month}</Text>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c.success }} />
                <Text muted size="sm">Доходы</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c.error }} />
                <Text muted size="sm">Расходы</Text>
              </div>
            </div>
          </div>
        ) : (
          <Text muted>Нет данных</Text>
        )}
      </Card>

      {/* Expense breakdown with Pie Chart */}
      <Card padding="lg">
        <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>📉 Расходы по категориям</Text>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={24} />)}
          </div>
        ) : expenseBreakdown.length > 0 ? (
          <>
            {/* Simple Pie Chart */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: `conic-gradient(${expenseBreakdown.map((cat, i) => `${cat.category_color} ${i === 0 ? 0 : expenseBreakdown.slice(0, i).reduce((s, c) => s + c.total, 0) / totalExpense * 100}% ${cat.total / totalExpense * 100}%`).join(', ')})`,
                boxShadow: tokens.shadows.md,
              }} />
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {expenseBreakdown.map((cat) => (
                <div key={cat.category_id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: cat.category_color }} />
                  <Text muted size="xs">{cat.category_icon} {cat.category_name}</Text>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {expenseBreakdown.map((cat) => {
                const width = (cat.total / maxExpense) * 100;
                const percentage = ((cat.total / totalExpense) * 100).toFixed(0);
                return (
                  <div key={cat.category_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text size="sm" as="span">{cat.category_icon ?? ''} {cat.category_name} <Text muted as="span">({percentage}%)</Text></Text>
                      <Text size="sm" fontWeight="semibold">{formatCurrency(cat.total)}</Text>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: c.border, overflow: 'hidden' }}>
                      <div style={{ width: `${width}%`, height: '100%', background: cat.category_color, borderRadius: 3, transition: `width ${tokens.transitions.slow}` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
                  <div style={{ height: 6, borderRadius: 3, background: c.border, overflow: 'hidden' }}>
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../src/components/AppLayout';
import { Card, Text, Badge, Skeleton, Button, Divider } from '@superapp/ui';
import { tokens } from '@superapp/ui';

const moduleTabs = [
  { label: 'Обзор', href: '/nutrition' },
  { label: 'Приёмы пищи', href: '/nutrition/meals' },
  { label: 'Вода', href: '/nutrition/water' },
  { label: 'Рецепты', href: '/nutrition/recipes' },
  { label: 'Продукты', href: '/nutrition/food' },
];

export default function NutritionOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [todayWater, setTodayWater] = useState(0);
  const [todayMeals, setTodayMeals] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);

  useEffect(() => {
    // Mock data for now - replace with actual service calls
    const timer = setTimeout(() => {
      setTodayWater(1500);
      setTodayMeals(3);
      setTodayCalories(1850);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppLayout
      headerTitle="Питание"
      headerSubtitle="Трекинг приёмов пищи, воды и КБЖУ"
      headerRight={
        <Link href="/nutrition/meals" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="sm">+ Записать приём пищи</Button>
        </Link>
      }
    >
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {moduleTabs.map((tab) => (
          <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
            <Button
              variant={tab.href === '/nutrition' ? 'primary' : 'ghost'}
              size="sm"
            >
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Today Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} padding="lg">
              <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={24} />
            </Card>
          ))
        ) : (
          <>
            <SummaryCard icon="💧" label="Вода сегодня" value={`${todayWater} мл`} progress={todayWater / 2000} />
            <SummaryCard icon="🍽️" label="Приёмов пищи" value={`${todayMeals}`} />
            <SummaryCard icon="🔥" label="Калории" value={`${todayCalories} ккал`} />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <Card padding="lg" style={{ marginBottom: 24 }}>
        <Text fontWeight="semibold" size="lg" style={{ marginBottom: 16 }}>Быстрые действия</Text>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <QuickAction icon="💧" label="Стакан воды (250 мл)" color={tokens.colors.info} />
          <QuickAction icon="🌅" label="Завтрак" color={tokens.colors.success} />
          <QuickAction icon="☀️" label="Обед" color={tokens.colors.warning} />
          <QuickAction icon="🌙" label="Ужин" color={tokens.colors.primary} />
        </div>
      </Card>

      {/* Placeholder */}
      <Card padding="2xl" variant="outlined">
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <Text muted size="xl" style={{ marginBottom: 8 }}>Раздел в разработке</Text>
          <Text muted>Здесь будет детальная статистика питания, графики КБЖУ и история приёмов пищи</Text>
        </div>
      </Card>
    </AppLayout>
  );
}

function SummaryCard({ icon, label, value, progress }: { icon: string; label: string; value: string; progress?: number }) {
  return (
    <Card padding="lg">
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <Text muted size="sm" style={{ marginLeft: 8 }}>{label}</Text>
      </div>
      <Text size="xl" fontWeight="bold">{value}</Text>
      {progress !== undefined && (
        <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: tokens.colors.border, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(progress * 100, 100)}%`,
            height: '100%',
            background: progress >= 1 ? tokens.colors.success : tokens.colors.primary,
            borderRadius: 2,
            transition: 'width 0.3s',
          }} />
        </div>
      )}
    </Card>
  );
}

function QuickAction({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <Button variant="secondary" size="sm">
      <span>{icon}</span> {label}
    </Button>
  );
}

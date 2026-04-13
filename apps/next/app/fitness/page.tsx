'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../src/components/AppLayout';
import { Card, Text, Badge, Skeleton, Button } from '@superapp/ui';
import { tokens } from '@superapp/ui';

const moduleTabs = [
  { label: 'Обзор', href: '/fitness' },
  { label: 'Тренировки', href: '/fitness/workouts' },
  { label: 'Упражнения', href: '/fitness/exercises' },
  { label: 'Прогресс', href: '/fitness/progress' },
];

export default function FitnessOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [thisWeekWorkouts, setThisWeekWorkouts] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTotalWorkouts(12);
      setThisWeekWorkouts(2);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppLayout
      headerTitle="Фитнес"
      headerSubtitle="Трекинг тренировок и прогресс"
      headerRight={
        <Link href="/fitness/workouts" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="sm">+ Начать тренировку</Button>
        </Link>
      }
    >
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 8 }}>
        {moduleTabs.map((tab) => (
          <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
            <Button variant={tab.href === '/fitness' ? 'primary' : 'ghost'} size="sm">{tab.label}</Button>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} padding="lg">
              <Skeleton width="60%" height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="40%" height={24} />
            </Card>
          ))
        ) : (
          <>
            <StatCard icon="🏋️" label="Всего тренировок" value={totalWorkouts} />
            <StatCard icon="📅" label="На этой неделе" value={thisWeekWorkouts} />
          </>
        )}
      </div>

      <Card padding="2xl" variant="outlined">
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏋️</div>
          <Text muted size="xl" style={{ marginBottom: 8 }}>Раздел в разработке</Text>
          <Text muted>Здесь будут тренировки, упражнения, подходы и графики прогресса</Text>
        </div>
      </Card>
    </AppLayout>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <Card padding="lg">
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <Text muted size="sm" style={{ marginLeft: 8 }}>{label}</Text>
      </div>
      <Text size="xl" fontWeight="bold">{value}</Text>
    </Card>
  );
}

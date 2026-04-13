'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../src/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { AuthForm } from '../src/components/AuthForm';
import { AppLayout } from '../src/components/AppLayout';
import { Card, Text, Heading, Badge, Skeleton, Button, tokens } from '@superapp/ui';

const modules = [
  { name: 'Дневник', icon: '📔', path: '/diary', desc: 'Записи, настроение, теги', color: '#5B6CFF' },
  { name: 'Финансы', icon: '💰', path: '/finance', desc: 'Счета, транзакции, бюджеты', color: '#22c55e' },
  { name: 'Питание', icon: '🍽️', path: '/nutrition', desc: 'КБЖУ, приёмы пищи, вода', color: '#f59e0b' },
  { name: 'Фитнес', icon: '🏋️', path: '/fitness', desc: 'Тренировки, упражнения', color: '#ef4444' },
  { name: 'Коллекции', icon: '📚', path: '/collections', desc: 'Книги, фильмы, рецепты', color: '#8b5cf6' },
  { name: 'Лента', icon: '📰', path: '/feed', desc: 'Лента активности', color: '#3b82f6' },
];

const moodEmojis = ['😢', '😟', '😐', '🙂', '😊'];

interface DashboardStats {
  diaryCount: number;
  lastMood: number | null;
  transactionCount: number;
  mealCount: number;
  workoutCount: number;
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!session) return;
    setStatsLoading(true);

    try {
      const [
        { count: diaryCount },
        { data: moodData },
        { count: transactionCount },
        { count: mealCount },
        { count: workoutCount },
        { data: recentData },
      ] = await Promise.all([
        supabase.from('diary_entries').select('*', { count: 'exact', head: true }),
        supabase.from('diary_entries').select('mood_score').order('created_at', { ascending: false }).limit(1),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
        supabase.from('meal_logs').select('*', { count: 'exact', head: true }),
        supabase.from('workout_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('diary_entries').select('id, content, mood_score, created_at').order('created_at', { ascending: false }).limit(3),
      ]);

      setStats({
        diaryCount: diaryCount ?? 0,
        lastMood: moodData?.[0]?.mood_score ?? null,
        transactionCount: transactionCount ?? 0,
        mealCount: mealCount ?? 0,
        workoutCount: workoutCount ?? 0,
      });

      setRecentEntries(recentData ?? []);
    } finally {
      setStatsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) fetchDashboard();
  }, [session, fetchDashboard]);

  const userName = session?.user?.email?.split('@')[0] ?? 'Пользователь';

  // Content inside AppLayout
  const dashboardContent = (
    <>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <Heading level={2} gradient style={{ marginBottom: 4 }}>
          Доброе утро, {userName} 👋
        </Heading>
        <Text muted>
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="lg">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Skeleton variant="circular" width={40} height={40} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="70%" height={12} style={{ marginBottom: 6 }} />
                  <Skeleton width="40%" height={18} />
                </div>
              </div>
            </Card>
          ))
        ) : stats ? (
          <>
            <StatCard icon="📔" label="Записей" value={stats.diaryCount} />
            <StatCard icon={stats.lastMood ? moodEmojis[stats.lastMood - 1] : '❓'} label="Настроение" value={stats.lastMood ? `${stats.lastMood}/5` : '—'} />
            <StatCard icon="🍽️" label="Приёмов пищи" value={stats.mealCount} />
            <StatCard icon="🏋️" label="Тренировок" value={stats.workoutCount} />
          </>
        ) : (
          <Text error>Не удалось загрузить статистику</Text>
        )}
      </div>

      {/* Modules */}
      <div style={{ marginBottom: 32 }}>
        <Heading level={4} style={{ marginBottom: 16 }}>Модули</Heading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {modules.map((mod) => (
            <Link key={mod.name} href={mod.path} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Card padding="lg" hoverable style={{ height: '100%' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{mod.icon}</div>
                <Text fontWeight="semibold" size="lg" style={{ marginBottom: 4 }}>{mod.name}</Text>
                <Text muted size="sm">{mod.desc}</Text>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Heading level={4}>Последние записи</Heading>
          <Link href="/diary" style={{ textDecoration: 'none' }}>
            <Text size="sm" style={{ color: tokens.colors.primary }}>Все записи →</Text>
          </Link>
        </div>

        {recentEntries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentEntries.map((entry) => (
              <Card key={entry.id} padding="lg">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  {entry.mood_score && <span style={{ fontSize: 22 }}>{moodEmojis[entry.mood_score - 1]}</span>}
                  <Text muted size="sm">
                    {new Date(entry.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </div>
                <Text style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {entry.content}
                </Text>
              </Card>
            ))}
          </div>
        ) : (
          <Card padding="2xl" variant="outlined">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <Text muted size="lg" style={{ marginBottom: 16 }}>Пока нет записей</Text>
              <Link href="/diary" style={{ textDecoration: 'none' }}>
                <Button variant="primary">Создать первую запись</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ width: 32, height: 32, border: `3px solid ${tokens.colors.border}`, borderTopColor: tokens.colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!session) {
    return (
      <AppLayout headerTitle="SuperApp" headerSubtitle="Life Management OS">
        <main style={{ maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Heading level={1} gradient style={{ marginBottom: 8 }}>SuperApp</Heading>
            <Text muted size="lg">Life Management OS — контролируйте все аспекты жизни</Text>
          </div>

          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <AuthForm />
          </div>

          <div style={{ marginTop: 48 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {modules.map((mod) => (
                <div key={mod.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 20, background: tokens.colors.surface, border: `1px solid ${tokens.colors.border}` }}>
                  <span style={{ fontSize: 18 }}>{mod.icon}</span>
                  <Text size="sm">{mod.name}</Text>
                </div>
              ))}
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      headerTitle={`Главная`}
      headerSubtitle="Обзор вашей активности"
    >
      {dashboardContent}
    </AppLayout>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <Card padding="lg">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: tokens.colors.primaryLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
        }}>
          {icon}
        </div>
        <div>
          <Text muted size="sm">{label}</Text>
          <Text size="xl" fontWeight="bold">{value}</Text>
        </div>
      </div>
    </Card>
  );
}

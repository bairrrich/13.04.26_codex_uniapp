'use client';

import { useState, useEffect } from 'react';
import { AuthForm } from '../src/components/AuthForm';
import { supabase } from '../src/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { Card, Text, Heading } from '@superapp/ui';

const modules = [
  { name: 'Дневник', icon: '📔', path: '/diary', desc: 'Записи, настроение, теги' },
  { name: 'Финансы', icon: '💰', path: '/finance', desc: 'Счета, транзакции, бюджеты' },
  { name: 'Питание', icon: '🍽️', path: '/nutrition', desc: 'КБЖУ, приёмы пищи, вода' },
  { name: 'Фитнес', icon: '🏋️', path: '/fitness', desc: 'Тренировки, упражнения, прогресс' },
  { name: 'Коллекции', icon: '📚', path: '/collections', desc: 'Книги, фильмы, рецепты' },
  { name: 'Лента', icon: '📰', path: '/feed', desc: 'Лента активности' },
];

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text muted>Загрузка...</Text>
      </div>
    );
  }

  if (!session) {
    return (
      <main style={{ padding: 24 }}>
        <Heading textAlign="center" style={{ marginBottom: 8 }}>SuperApp</Heading>
        <Text textAlign="center" muted style={{ marginBottom: 24 }}>
          Life Management OS — войдите или зарегистрируйтесь
        </Text>
        <AuthForm />
      </main>
    );
  }

  const email = session.user.email;

  return (
    <main style={{ padding: 24 }}>
      <Heading style={{ marginBottom: 8 }}>Добро пожаловать, {email}</Heading>
      <Text muted style={{ marginBottom: 24 }}>Выберите модуль:</Text>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        {modules.map((mod) => (
          <a
            key={mod.name}
            href={mod.path}
            style={{ textDecoration: 'none', flex: '0 0 280px', color: 'inherit' }}
          >
            <Card
              padding="lg"
              style={{
                cursor: 'pointer',
                transition: 'transform 0.15s, border-color 0.15s',
                height: '100%',
              }}
              className="module-card"
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{mod.icon}</div>
              <Text fontWeight={600} size="lg">{mod.name}</Text>
              <Text muted size="sm">{mod.desc}</Text>
              <Text size="sm" style={{ color: '#5B6CFF', marginTop: 8 }}>{mod.path}</Text>
            </Card>
          </a>
        ))}
      </div>
    </main>
  );
}

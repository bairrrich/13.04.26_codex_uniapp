'use client';

import { useState, useEffect } from 'react';
import { AuthForm } from '../src/components/AuthForm';
import { supabase } from '../src/lib/supabase';
import type { Session } from '@supabase/supabase-js';

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>;
  }

  if (!session) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ textAlign: 'center' }}>SuperApp</h1>
        <p style={{ textAlign: 'center', color: '#888' }}>Life Management OS — войдите или зарегистрируйтесь</p>
        <AuthForm />
      </main>
    );
  }

  const email = session.user.email;

  return (
    <main style={{ padding: 24 }}>
      <h1>Добро пожаловать, {email}</h1>
      <p style={{ color: '#888' }}>Выберите модуль:</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
        {modules.map((mod) => (
          <a
            key={mod.name}
            href={mod.path}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                padding: 20,
                border: '1px solid #333',
                borderRadius: 12,
                background: '#111827',
                cursor: 'pointer',
                transition: 'transform 0.15s, border-color 0.15s',
                height: '100%',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.borderColor = '#5B6CFF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.borderColor = '#333';
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{mod.icon}</div>
              <h3 style={{ margin: '0 0 4px' }}>{mod.name}</h3>
              <p style={{ margin: 0, fontSize: 14, color: '#888' }}>{mod.desc}</p>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#5B6CFF' }}>{mod.path}</p>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}

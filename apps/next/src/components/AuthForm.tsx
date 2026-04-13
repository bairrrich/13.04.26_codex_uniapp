'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Button, Input, Card, Text } from '@superapp/ui';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              locale: navigator.language || 'ru',
            },
          },
        });
        if (error) throw error;
        setMessage('Регистрация успешна! Проверьте почту для подтверждения.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Вход выполнен!');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="2xl" style={{ maxWidth: 400, margin: '40px auto' }}>
      <Text as="div" fontWeight={600} size="xl" style={{ marginBottom: 16 }}>
        {isSignUp ? 'Регистрация' : 'Вход'}
      </Text>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
        </div>

        {error && (
          <Text error style={{ marginBottom: 12 }}>
            {error}
          </Text>
        )}
        {message && (
          <Text success style={{ marginBottom: 12 }}>
            {message}
          </Text>
        )}

        <Button type="submit" loading={loading} fullWidth size="lg">
          {isSignUp ? 'Зарегистрироваться' : 'Войти'}
        </Button>
      </form>

      <Button
        style={{ marginTop: 12 }}
        variant="ghost"
        fullWidth
        onPress={() => {
          setIsSignUp(!isSignUp);
          setError(null);
          setMessage(null);
        }}
      >
        {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
      </Button>
    </Card>
  );
}

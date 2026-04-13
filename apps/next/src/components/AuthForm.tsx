'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

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
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #333', borderRadius: 12 }}>
      <h2 style={{ marginTop: 0 }}>{isSignUp ? 'Регистрация' : 'Вход'}</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 6, border: '1px solid #555', background: '#1a1a2e', color: '#fff' }}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 10, borderRadius: 6, border: '1px solid #555', background: '#1a1a2e', color: '#fff' }}
        />

        {error && <p style={{ color: '#ff6b6b', margin: 0 }}>{error}</p>}
        {message && <p style={{ color: '#51cf66', margin: 0 }}>{message}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 6,
            border: 'none',
            background: '#5B6CFF',
            color: '#fff',
            cursor: loading ? 'wait' : 'pointer',
            fontWeight: 600,
          }}
        >
          {loading ? 'Загрузка...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      <button
        onClick={() => {
          setIsSignUp(!isSignUp);
          setError(null);
          setMessage(null);
        }}
        style={{
          marginTop: 12,
          background: 'none',
          border: 'none',
          color: '#5B6CFF',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
      </button>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Загрузка...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
      <div>
        <span style={{ marginRight: 16 }}>{user.email}</span>
        <span style={{ fontSize: 12, color: '#888' }}>ID: {user.id.slice(0, 8)}...</span>
      </div>
      <button
        onClick={handleSignOut}
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          border: '1px solid #555',
          background: 'transparent',
          color: '#ff6b6b',
          cursor: 'pointer',
        }}
      >
        Выйти
      </button>
    </div>
  );
}

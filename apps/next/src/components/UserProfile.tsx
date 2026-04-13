'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { Button, Text } from '@superapp/ui';

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
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text muted>Загрузка...</Text>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{
      padding: 16,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #333',
    }}>
      <div>
        <Text as="span" style={{ marginRight: 16 }}>{user.email}</Text>
        <Text muted size="xs">ID: {user.id.slice(0, 8)}...</Text>
      </div>
      <Button variant="ghost" size="sm" onPress={handleSignOut}>
        Выйти
      </Button>
    </div>
  );
}

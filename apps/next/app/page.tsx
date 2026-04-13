import { supabase } from '../src/lib/supabase';

async function fetchHealthcheck() {
  const { error } = await supabase.from('activity_events').select('id').limit(1);
  return !error;
}

export default async function HomePage() {
  const isConnected = await fetchHealthcheck();

  return (
    <main style={{ padding: 24 }}>
      <h1>SuperApp Web</h1>
      <p>Supabase status: {isConnected ? 'connected' : 'table missing or no access'}</p>
      <p>Deploy target: Vercel (Git integration).</p>
    </main>
  );
}

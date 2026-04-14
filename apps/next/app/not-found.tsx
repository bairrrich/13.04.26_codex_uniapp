'use client';

import { Text, Heading, Button } from '@superapp/ui';

export default function NotFound() {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <Heading level={1}>404</Heading>
      <Text muted size="xl" style={{ marginBottom: 24 }}>Страница не найдена</Text>
      <Button onPress={() => window.location.href = '/'} size="lg">
        Вернуться на главную
      </Button>
    </div>
  );
}

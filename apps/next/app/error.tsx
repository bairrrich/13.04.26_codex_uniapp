'use client';

import { useEffect } from 'react';
import { Button, Card, Text, Heading } from '@superapp/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: 24 }}>
      <Card padding="2xl" style={{ maxWidth: 480, textAlign: 'center' }}>
        <Heading level={2} style={{ marginBottom: 8 }}>Что-то пошло не так</Heading>
        <Text muted style={{ marginBottom: 16 }}>
          {error.message || 'Произошла непредвиденная ошибка'}
        </Text>
        <Button onPress={reset} variant="primary" size="lg">
          Попробовать снова
        </Button>
      </Card>
    </div>
  );
}

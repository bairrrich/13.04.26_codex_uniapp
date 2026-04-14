'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useTheme, Button, Text, Heading } from '@superapp/ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorBoundaryFallback({ error }: { error: Error | null }) {
  const { tokens } = useTheme();

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <Heading level={2}>Что-то пошло не так</Heading>
      <Text style={{ color: tokens.muted, marginBottom: 16 }}>{error?.message}</Text>
      <Button
        onPress={() => window.location.reload()}
        size="lg"
      >
        Перезагрузить страницу
      </Button>
    </div>
  );
}

export { ErrorBoundaryClass as ErrorBoundary };

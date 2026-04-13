/**
 * Logging utility for application errors.
 * Sends errors to console in development and to Sentry in production (when configured).
 */

export interface LogContext {
  userId?: string;
  action?: string;
  module?: string;
  [key: string]: unknown;
}

export class AppLogger {
  private static instance: AppLogger;
  private context: LogContext = {};

  static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  setContext(ctx: LogContext) {
    this.context = { ...this.context, ...ctx };
  }

  clearContext() {
    this.context = {};
  }

  error(message: string, error?: unknown) {
    const logEntry = {
      level: 'error',
      message,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      context: { ...this.context },
      timestamp: new Date().toISOString(),
    };

    console.error(JSON.stringify(logEntry));

    // TODO: Send to Sentry/Sentry when configured
    // if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window !== 'undefined') {
    //   Sentry.captureException(error);
    // }
  }

  warn(message: string, data?: unknown) {
    const logEntry = {
      level: 'warn',
      message,
      data,
      context: { ...this.context },
      timestamp: new Date().toISOString(),
    };
    console.warn(JSON.stringify(logEntry));
  }

  info(message: string, data?: unknown) {
    const logEntry = {
      level: 'info',
      message,
      data,
      context: { ...this.context },
      timestamp: new Date().toISOString(),
    };
    console.info(JSON.stringify(logEntry));
  }

  debug(message: string, data?: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      const logEntry = {
        level: 'debug',
        message,
        data,
        context: { ...this.context },
        timestamp: new Date().toISOString(),
      };
      console.debug(JSON.stringify(logEntry));
    }
  }
}

export const logger = AppLogger.getInstance();

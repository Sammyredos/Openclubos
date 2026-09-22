import { AsyncLocalStorage } from 'async_hooks';

export interface TraceContext {
  correlationId?: string;
  sentryTrace?: string;
}

const storage = new AsyncLocalStorage<TraceContext>();

export class TraceContextService {
  static run<T>(context: TraceContext, fn: () => T): T {
    return storage.run(context, fn);
  }

  static getCorrelationId(): string | undefined {
    return storage.getStore()?.correlationId;
  }

  static getSentryTrace(): string | undefined {
    return storage.getStore()?.sentryTrace;
  }
}

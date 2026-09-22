import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { TraceContextService } from '../services/trace-context.service';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers['x-correlation-id'] || req.headers['x-request-id'] || randomUUID()) as string;
    const sentryTrace = req.headers['sentry-trace'] as string | undefined;

    res.setHeader('X-Correlation-Id', correlationId);
    res.setHeader('X-Request-Id', correlationId);

    TraceContextService.run({ correlationId, sentryTrace }, () => {
      next();
    });
  }
}

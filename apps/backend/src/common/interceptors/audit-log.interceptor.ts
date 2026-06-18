import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma.service';
import { AUDIT_LOG_KEY, AuditLogMetadata } from '../decorators/audit-log.decorator';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMeta = this.reflector.get<AuditLogMetadata>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!auditMeta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = user?.userId || user?.id; // Depends on your JWT payload mapping
    
    // Capture the 'before' state from the incoming request body
    // Note: For a true 'before' state of a database entity, you'd need custom logic per entity.
    // For general audit logging, capturing the payload intent is standard.
    const beforeState = {
      body: request.body,
      query: request.query,
      params: request.params,
    };

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.logAction(auditMeta, userId, beforeState, response);
        },
        error: (error) => {
          this.logAction(auditMeta, userId, beforeState, { error: error.message, stack: error.stack });
        },
      }),
    );
  }

  private async logAction(
    meta: AuditLogMetadata,
    userId: string | undefined,
    before: any,
    after: any,
  ) {
    try {
      await (this.prisma as any).auditLog.create({
        data: {
          action: meta.action,
          resource: meta.resource,
          userId: userId || null,
          before: before ? JSON.parse(JSON.stringify(before)) : null,
          after: after ? JSON.parse(JSON.stringify(after)) : null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log for ${meta.resource}:${meta.action}`, error);
    }
  }
}

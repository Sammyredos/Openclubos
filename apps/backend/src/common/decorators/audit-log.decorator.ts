import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMetadata {
  resource: string;
  action: string;
}

export const AuditLog = (resource: string, action: string) =>
  SetMetadata(AUDIT_LOG_KEY, { resource, action });

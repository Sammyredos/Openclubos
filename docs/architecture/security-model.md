# OpenClubOS Security Model & Defense-in-Depth Architecture

## 1. Multi-Tenant Row-Level Security (RLS)
OpenClubOS isolates tenant organizations at the PostgreSQL kernel level using `FORCE ROW LEVEL SECURITY`.

- **Session Configuration**: Every multi-tenant database interaction executes inside a transaction using:
  ```sql
  SET LOCAL app.current_tenant = '<clubId>';
  ```
- **Engine-Enforced Filtering**: PostgreSQL automatically applies the tenant policy:
  ```sql
  CREATE POLICY tenant_isolation_policy ON "Tournament"
    FOR ALL
    USING (clubId = current_setting('app.current_tenant', true))
    WITH CHECK (clubId = current_setting('app.current_tenant', true));
  ```
- **Protection**: Cross-tenant queries fail closed (`0 rows returned`) even if application-level `where: { clubId }` filters are omitted.

---

## 2. Immutable Audit Logging (Append-Only)
The `AuditLog` table stores administrative actions, tournament cutline executions, and manual score overrides.

- **PostgreSQL Database Trigger**: Trigger `trg_protect_audit_log` intercepts and blocks any `UPDATE` or `DELETE` statement on `"AuditLog"`, raising an exception.
- **Prisma Client Mutation Prevention**: Application queries calling `update`, `updateMany`, `delete`, or `deleteMany` on `prisma.auditLog` throw immediate security violations.

---

## 3. Cryptographic Scorecard Tamper Hashing
Tournament scores form a forward-chained cryptographic sequence per player round:

$$\text{Hash}_n = \text{SHA-256}(\text{TourneyId} : \text{UserId} : \text{Hole}_n : \text{Strokes} : \text{Putts} : \text{Points} : \text{MarkerId} : \text{Timestamp} : \text{Hash}_{n-1})$$

- **Anchor**: Hole 1 previous hash is anchored to `'GENESIS'`.
- **Integrity Verification**: `GET /api/scores/verify/:tournamentId/:userId` recalculates the chain and pinpoints the exact hole number if a score was altered directly in the database.

---

## 4. Ingress & Interface Protection
- **gRPC Microservice**: Bound to loopback `127.0.0.1:50051`. Authenticated via metadata tokens (`GrpcAuthGuard`, Status 16 `UNAUTHENTICATED`) and throttled with Redis sliding-window limits (Status 8 `RESOURCE_EXHAUSTED`).
- **Bull Board Dashboard**: Secured behind `BullBoardAuthMiddleware` with HTTP Basic Authentication (`BULL_BOARD_USER`, `BULL_BOARD_PASS`).
- **Payment Webhooks**: Verified using `crypto.timingSafeEqual` to prevent side-channel timing analysis and deduplicated via compound unique database keys (`[provider, eventId]`).
- **WebSockets**: Long-polling disabled in production (`transports: ['websocket']`) with payload size capped at 1 MB.

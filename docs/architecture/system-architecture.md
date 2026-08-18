# OpenClubOS System Architecture & Hardened Topology

## 1. High-Level Architecture Diagram

```mermaid
flowchart TB
    subgraph Clients["Clients & Ingress"]
        WebAdmin["Web Admin (Next.js 15)"]
        MobileApp["Mobile App (Flutter)"]
        External["External Services (Stripe / Paystack)"]
        Nginx["Nginx Reverse Proxy (:80 / :443)"]
    end

    subgraph AppLayer["Application Layer (NestJS 10 Monolith)"]
        HTTPGateway["HTTP / REST API (:3001)"]
        WSServer["Socket.IO WebSocket Server (ws-only)"]
        GRPCServer["gRPC Microservice (127.0.0.1:50051 / mTLS & Token Auth)"]
        QueueWorkers["BullMQ Queue Processor (Concurrency & Isolation)"]
        TraceContext["AsyncLocalStorage Distributed Tracing"]
        CircuitBreaker["Email Circuit Breaker (3-Tier Fallback)"]
    end

    subgraph DataLayer["Data & Persistence Layer"]
        PgBouncer["PgBouncer Connection Pooler (:6432)"]
        PGPrimary[("PostgreSQL 16 Primary (:5433)\n[FORCE RLS & Immutable Triggers]")]
        PGReplica[("PostgreSQL 16 Read Replica (:5434)\n[Prisma Read Extension]")]
        RedisQueue[("Redis 7 Queue (:6380)\n[AOF Persistence / Sentinel]")]
        RedisCache[("Redis 7 Cache (:6379)\n[LRU Eviction / Socket.IO Adapter]")]
        EmailOutbox[("PostgreSQL EmailOutbox\n[Zero-Drop Fallback Storage]")]
    end

    %% Client Routing
    WebAdmin -->|HTTP / REST| Nginx
    MobileApp -->|HTTP & WebSockets| Nginx
    External -->|Webhooks| Nginx
    Nginx -->|/api & /admin| HTTPGateway
    Nginx -->|/socket.io (Upgrade)| WSServer

    %% Application Layer
    HTTPGateway --> TraceContext
    HTTPGateway --> PgBouncer
    HTTPGateway --> RedisCache
    HTTPGateway --> QueueWorkers
    WSServer --> RedisCache
    QueueWorkers --> RedisQueue
    QueueWorkers --> CircuitBreaker
    CircuitBreaker --> EmailOutbox

    %% Internal gRPC
    AppLayer -.->|Internal Auth Token| GRPCServer

    %% Data Layer Routing
    PgBouncer --> PGPrimary
    PGPrimary -.->|Streaming WAL Replication| PGReplica
```

---

## 2. Hardened Component Inventory

### A. Dual Redis Topology
- **`openclub-redis-queue` (:6380)**: Dedicated to BullMQ background workers with `appendonly yes` (AOF) persistence and Redis Sentinel failover. Memory exhaustion on cache cannot corrupt asynchronous jobs.
- **`openclub-redis-cache` (:6379)**: Dedicated to ephemeral data, NestJS Throttler, and Socket.IO Pub/Sub adapter with `allkeys-lru` eviction.

### B. PostgreSQL High Availability & Replication
- **Primary Database (:5433)**: Direct write target with PgBouncer connection pooling. Enforces PostgreSQL `FORCE ROW LEVEL SECURITY` per tenant (`clubId = current_setting('app.current_tenant')`) and database triggers protecting `AuditLog` from modification.
- **Read Replica (:5434)**: Asynchronous streaming replica integrated via `@prisma/extension-read-replicas` for scalable analytics and public leaderboard reads.
- **Continuous Backups**: Automated native Node.js zlib backups (`scripts/db-backup.js`) creating timestamped `.sql.gz` archives with single-command disaster recovery drill verification (`scripts/db-restore-drill.js`).

### C. Live Scoring & Leaderboard Consistency
- **Single Write Path**: PostgreSQL is the single source of truth for tournament scores. Redis caches versioned leaderboard snapshots (`lb:{id}:v{epoch}`) updated via atomic pointer swaps (`lb:{id}:active_ver`).
- **Zero-Drift Reconciliation**: Background BullMQ worker executes every 60 seconds (`RECONCILE_LEADERBOARDS`) to sync any drift from network drops or Redis reboots.
- **Cryptographic Scorecard Hash Chain**: Every hole score computes a SHA-256 hash chaining back to `GENESIS`. Any direct SQL tampering is detected immediately by `verifyScorecard()`.

### D. Security & Ingress Hardening
- **gRPC Microservice Lockdown**: Bound strictly to `127.0.0.1:50051`. Invocations without valid metadata authorization tokens (`GrpcAuthGuard`) are rejected with Code 16 (`UNAUTHENTICATED`), with token-bucket rate limiting (`RESOURCE_EXHAUSTED` Code 8).
- **Bull Board Queue Monitoring**: Protected behind [`BullBoardAuthMiddleware`](file:///c:/Users/samue/Desktop/Openclubos/apps/backend/src/common/middleware/bull-board-auth.middleware.ts) with HTTP Basic Authentication (`BULL_BOARD_USER`, `BULL_BOARD_PASS`).
- **Payment Webhook Idempotency**: Timing-safe HMAC signature verification (`crypto.timingSafeEqual`) and PostgreSQL unique constraint `[provider, eventId]` preventing duplicate credits on concurrent retries.
- **WebSocket Transport**: Enforces WebSocket-only transport (`transports: ['websocket']`) and 1MB buffer limit to eliminate session mismatches and memory exhaustion.

### E. Telemetry & Email Resilience
- **Distributed Tracing**: Node.js `AsyncLocalStorage` (`TraceContextService`) automatically binds `correlationId` and `sentryTrace` across HTTP headers, BullMQ jobs, and Pino structured logs.
- **3-Tier Email Fallback**: Primary SMTP → Secondary SES/SendGrid fallback → PostgreSQL `EmailOutbox` table managed by a 60-second automated circuit breaker.

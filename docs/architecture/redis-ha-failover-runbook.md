# Redis High Availability (HA) & Failover Runbook

## Overview & Topology

OpenClubOS uses two dedicated, isolated Redis clusters configured for high availability and automatic failover:

1. **`redis-queue`**: Houses BullMQ asynchronous job streams, payment webhook workers, and repeatable tournament stage transition jobs. Configured with AOF (`everysec`) disk persistence.
2. **`redis-cache`**: Houses Socket.IO multi-instance WebSocket pub/sub broadcasting, HTTP cache manager (`ioredis-yet`), and Throttler distributed rate limiting. Configured with `allkeys-lru` memory eviction.

---

## 1. High Availability Architectures

### A. Cloud Production: Managed HA (AWS ElastiCache / Redis Cloud / Upstash)
- **Deployment**: Multi-AZ with Automatic Failover enabled (1 Primary, 1+ Read Replicas across distinct Availability Zones).
- **Endpoint**: Primary configuration endpoint (`QUEUE_REDIS_URL="rediss://..."`).
- **Failover Mechanism**: AWS handles automatic DNS repointing and replica promotion within 15–30 seconds.
- **Client Configuration**: `ioredis` configured with `maxRetriesPerRequest: null`, `enableReadyCheck: false`, and exponential retry backoff.

### B. Self-Hosted / On-Premise: Redis Sentinel Quorum
- **Deployment**: 3-node Sentinel quorum (`sentinel monitor mymaster <ip> 6379 2`) monitoring Primary + Replica.
- **Environment Configuration**:
  ```env
  QUEUE_REDIS_SENTINELS="sentinel1:26379,sentinel2:26379,sentinel3:26379"
  QUEUE_REDIS_SENTINEL_MASTER="mymaster"
  CACHE_REDIS_SENTINELS="sentinel1:26379,sentinel2:26379,sentinel3:26379"
  CACHE_REDIS_SENTINEL_MASTER="mymaster"
  ```
- **Failover Mechanism**: Sentinel elects new primary upon quorum consensus (>50% agreement) within 5–10 seconds.

---

## 2. Client Reconnection & In-Flight Job Safety

| Component | Failover Behavior | In-Flight Data Guarantees |
| :--- | :--- | :--- |
| **BullMQ Jobs (`redis-queue`)** | `maxRetriesPerRequest: null` + exponential backoff retry. | **Zero Data Loss**: In-flight jobs unacknowledged during failover are reclaimed and re-executed via BullMQ's stalled job lock renewal. |
| **Socket.IO Adapter (`redis-cache`)** | Auto-reconnect with jitter (`reconnectStrategy`). | Re-subscribes all active tournament rooms (`joinTournament`) upon reconnect without dropping HTTP/WS clients. |
| **Cache Manager (`redis-cache`)** | Transparent retry; gracefully falls back to database reads if cache is momentarily unavailable. | Non-blocking. |
| **Throttler Rate Limiter** | Exponential backoff. | Fail-open / fallback prevents blocking valid user traffic during failover. |

---

## 3. Health Checks & Probes

The backend exposes real-time connectivity and latency metrics via the `/api/health` endpoint:
- **`redis_queue`**: Verifies BullMQ queue connection and ping response.
- **`redis_cache`**: Verifies cache connection and reports round-trip latency in milliseconds (`latencyMs`).

---

## 4. Forced Failover Testing & Drill Procedure

To simulate a primary node failure in testing or staging:

1. **Trigger Manual Failover**:
   ```bash
   # Sentinel
   redis-cli -p 26379 sentinel failover mymaster

   # Or Docker test: pause primary container
   docker pause openclub-redis-queue
   ```
2. **Observe Application Logs**:
   - Verify `Redis WebSockets disconnected. Attempting reconnect...` warning log.
   - Verify `Redis Pub Client ready and active.` upon reconnection.
3. **Verify Health Endpoint**:
   ```bash
   curl http://localhost:3001/api/health
   ```
   Confirm status returns `ok`.

# OpenClubOS Disaster Recovery & High Availability Runbook

## 1. Recovery Objectives
- **Recovery Point Objective (RPO)**: < 5 minutes (via streaming WAL replication and continuous backups).
- **Recovery Time Objective (RTO)**: < 2 minutes for database failover / < 30 seconds for Redis cache recovery.

---

## 2. Backup & Restore Operations

### A. Creating Automated Compressed Backups
Run the native cross-platform backup tool:
```bash
node scripts/db-backup.js
```
- Creates timestamped, gzip-compressed SQL dumps in `backups/backup_YYYY-MM-DD_HH-mm-ss.sql.gz`.
- Automatically trims historic backups to retain the 10 most recent snapshots.

### B. Executing Disaster Recovery Drill
Verify database restore capability in an isolated sandbox:
```bash
node scripts/db-restore-drill.js
```
- Unpacks the latest backup, creates an ephemeral drill database (`openclub_dr_drill`), verifies table row counts and schema integrity across all 16 core entities, and cleans up.

---

## 3. Database Failover & Read Replica Promotion
If the PostgreSQL Primary (`openclub-postgres` on port 5433) experiences hardware failure:
1. Promote the Read Replica (`openclub-postgres-replica` on port 5434) to Primary:
   ```bash
   docker exec -it openclub-postgres-replica pg_ctl promote
   ```
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:your-secure-password@127.0.0.1:5434/openclub?schema=public"
   ```
3. Restart backend service.

---

## 4. Redis Queue & Cache Failover
- **Queue Instance (:6380)**: Managed via Redis Sentinel. If master fails, Sentinel automatically elects a new master and reconfigures BullMQ clients via `QUEUE_REDIS_SENTINELS`.
- **Cache Instance (:6379)**: Ephemeral data. Upon cold reboot, the 60-second BullMQ reconciliation worker (`RECONCILE_LEADERBOARDS`) rebuilds all active tournament leaderboards directly from PostgreSQL with zero data drift.

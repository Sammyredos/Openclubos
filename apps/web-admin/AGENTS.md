# AGENTS.md

## FairwayOS Engineering Agent Guide

### Project Overview

FairwayOS is a modern golf event and tournament operating system designed to help organizers manage registrations, scoring, leaderboards, sponsors, pairings, and player engagement from a single platform. The platform supports live scoring, mobile-first experiences, offline capabilities, and club management workflows.

---

## Core Principles

1. Golf-first UX

   * Every feature must prioritize simplicity for golfers and event organizers.
   * Mobile experience is as important as desktop.

2. Reliability over complexity

   * Tournament-day features must remain stable under load.
   * Avoid unnecessary dependencies.

3. Offline-first mindset

   * Scoring functionality should continue working during poor network conditions.
   * Synchronize data automatically when connectivity returns.

4. Real-time everywhere

   * Leaderboards, pairings, and announcements should update instantly.

5. Security by default

   * All sensitive operations require authentication and authorization.
   * Never expose secrets, API keys, or internal credentials.

---

## Agent Responsibilities

### Product Agent

Responsible for:

* Feature planning
* User stories
* Roadmap creation
* Requirements gathering

Deliverables:

* PRDs
* User journeys
* Acceptance criteria

---

### Frontend Agent

Responsible for:

* Next.js application
* React components
* TailwindCSS styling
* Accessibility compliance

Guidelines:

* Prefer server components when appropriate.
* Use TypeScript strictly.
* Reusable components live under `/components`.
* Avoid duplicated UI logic.

---

### Backend Agent

Responsible for:

* API design
* Authentication
* Business logic
* Database operations

Guidelines:

* Follow REST conventions.
* Validate all incoming requests.
* Never trust client-side data.
* Keep controllers thin and services reusable.

---

### Database Agent

Responsible for:

* Schema design
* Index optimization
* Migrations
* Data integrity

Guidelines:

* Prefer normalized structures.
* Use foreign keys where appropriate.
* Create indexes for leaderboard and scoring queries.

---

### DevOps Agent

Responsible for:

* CI/CD
* Infrastructure
* Monitoring
* Deployment

Guidelines:

* Automate deployments.
* Maintain rollback procedures.
* Monitor uptime and performance metrics.

---

### QA Agent

Responsible for:

* Testing strategy
* Regression testing
* Release validation

Minimum coverage:

* Authentication flows
* Tournament creation
* Player registration
* Live scoring
* Leaderboards
* Payment workflows

---

## Coding Standards

### TypeScript

* Strict mode enabled.
* Avoid `any`.
* Prefer interfaces for domain models.

### React

* Functional components only.
* Use hooks responsibly.
* Separate UI from business logic.

### API

* Consistent error responses.
* Proper HTTP status codes.
* Comprehensive validation.

---


## Golf Domain Rules

### Tournament

Must contain:

* Name
* Date
* Course
* Format
* Organizer

### Player

Must contain:

* Name
* Handicap
* Contact details

### Score

Must contain:

* Hole number
* Gross score
* Net score (when applicable)

### Leaderboard

Should update automatically after score submission.

---

## Performance Targets

* Page load < 2 seconds
* API response < 300ms
* Leaderboard updates < 2 seconds
* 99.9% uptime target

---

## Security Checklist

### Authentication & Authorization

- [ ] NEVER use JWTs for password reset tokens — use `crypto.randomBytes(32)` + SHA-256 hash in DB
- [ ] NEVER let guards "fail open" — always return `false` or throw on errors
- [ ] ALWAYS validate `JWT_SECRET` exists in production before app starts
- [ ] ALWAYS use bcrypt with 12+ rounds (not 10)
- [ ] ALWAYS set access token blacklist TTL to match JWT `exp` claim exactly
- [ ] ALWAYS implement JWT key rotation with `kid` (Key ID) headers
- [ ] NEVER use `@ts-ignore` in security-critical code (auth, payments, admin)

### Input Validation

- [ ] ALWAYS validate ALL env vars in `env.validation.ts` with proper decorators
- [ ] ALWAYS sanitize search inputs — escape `%`, `_`, `\` before Prisma `contains`
- [ ] ALWAYS whitelist file types on upload (jpeg, png, webp, pdf)
- [ ] ALWAYS use `crypto.randomBytes()` for IDs, never `Math.random()`
- [ ] ALWAYS validate enum values before passing to Prisma

### Session & Cookies

- [ ] ALWAYS set `SameSite=Strict` on auth cookies
- [ ] ALWAYS set `httpOnly` and `secure` flags in production
- [ ] ALWAYS implement CSRF protection (Double Submit Cookie) for state-changing ops
- [ ] NEVER log full stack traces in production — log `err.message` only

### Infrastructure

- [ ] ALWAYS authenticate Redis (`--requirepass`)
- [ ] ALWAYS add security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- [ ] ALWAYS enforce TLS 1.3 in nginx with strong cipher suites
- [ ] ALWAYS add Docker health checks for postgres, redis, backend
- [ ] NEVER expose `SENTRY_DSN` or API keys in client-side code

---

## Performance Checklist

### Database

- [ ] ALWAYS add `@@index()` on columns used in WHERE, ORDER BY, JOIN
- [ ] ALWAYS use composite indexes for multi-column queries
- [ ] ALWAYS tune PostgreSQL connection pool: `max: 20`, `idleTimeoutMillis: 30000`
- [ ] NEVER run Prisma query logging in production
- [ ] ALWAYS add query timeouts (wrap with `Promise.race`)
- [ ] ALWAYS use `groupBy` + aggregation instead of loading all records into memory

### Caching

- [ ] NEVER call `cacheService.reset()` (flushes entire cache)
- [ ] ALWAYS use targeted invalidation: `invalidatePattern('tournaments:*')`
- [ ] ALWAYS set appropriate TTLs: lists = 5min, single items = 15min, stats = 5min
- [ ] ALWAYS hash search strings in cache keys to avoid key pollution
- [ ] ALWAYS cache admin stats endpoints (they run aggregations)

### API Design

- [ ] ALWAYS add pagination to `findAll()` endpoints — `take` capped at `MAX_PAGE_SIZE` (100)
- [ ] ALWAYS add `skip`/`take` parameters, never return unlimited results
- [ ] ALWAYS add API response compression (compression middleware)
- [ ] ALWAYS add request timeouts (`server.timeout = 30000`)
- [ ] NEVER block the event loop with synchronous loops — use bulk operations

### Background Jobs

- [ ] NEVER use `@Cron` in multi-instance deployments — use BullMQ repeatable jobs
- [ ] ALWAYS implement distributed locks (Redlock) for cron-like operations
- [ ] ALWAYS bulk enqueue jobs instead of looping `queue.add()`
- [ ] ALWAYS add dead-letter queue handling for failed jobs
- [ ] ALWAYS log job failures with context, not full stack traces

---

## Data Management Checklist

### Schema Design

- [ ] ALWAYS use proper relations instead of JSON blobs for queryable data
- [ ] ALWAYS add `deletedAt` soft-delete field to all entities
- [ ] ALWAYS implement Prisma middleware for automatic soft-delete filtering
- [ ] ALWAYS add `@@index([deletedAt])` on soft-deleted tables
- [ ] NEVER store tracking/audit data in JSON fields — use proper tables

### Data Integrity

- [ ] ALWAYS use `prisma.$transaction()` for multi-table operations
- [ ] ALWAYS validate foreign key existence before creating relations
- [ ] ALWAYS handle Prisma error codes (`P2025` = not found, `P2002` = unique violation)
- [ ] NEVER delete records permanently without archiving first

### Data Retention

- [ ] ALWAYS implement retention policies: audit logs = 1yr, soft-deleted = 30d
- [ ] ALWAYS archive old tournament data after 1 year
- [ ] ALWAYS document migration strategy (pre-deploy vs post-deploy)
- [ ] ALWAYS run `prisma migrate deploy` before deploying new code

---

## Code Quality Standards

### TypeScript

- [ ] NEVER use `@ts-ignore` or `@ts-expect-error` — fix the type instead
- [ ] ALWAYS use strict mode (`strict: true` in tsconfig)
- [ ] ALWAYS define return types on public methods
- [ ] ALWAYS use `unknown` instead of `any` for catch blocks

### Error Handling

- [ ] ALWAYS use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`)
- [ ] NEVER throw raw `Error` objects — always use typed exceptions
- [ ] ALWAYS include context in error messages (IDs, operation names)
- [ ] NEVER leak internal error details to API responses

### Logging

- [ ] ALWAYS use structured logging (JSON format)
- [ ] ALWAYS include `requestId` in every log entry
- [ ] NEVER log PII (emails, passwords, tokens, payment references)
- [ ] NEVER log full stack traces in production
- [ ] ALWAYS redact sensitive fields before logging

### Testing

- [ ] ALWAYS write unit tests for auth, payment, and security logic
- [ ] ALWAYS write integration tests for critical user flows
- [ ] ALWAYS add load tests before major releases (k6/Artillery)
- [ ] ALWAYS run `npm audit` in CI and fail on high/critical CVEs

---

## Infrastructure Standards

### Docker

- [ ] ALWAYS use multi-stage builds to minimize image size
- [ ] ALWAYS copy only necessary files (use `.dockerignore`)
- [ ] ALWAYS run as non-root user in containers
- [ ] ALWAYS add health checks to all services
- [ ] NEVER hardcode secrets in Dockerfiles

### CI/CD

- [ ] ALWAYS run lint, test, build, and security scan in CI
- [ ] ALWAYS build Docker images in CI and push to registry
- [ ] ALWAYS tag images with commit SHA, not just `latest`
- [ ] ALWAYS run database migrations before deploying new code
- [ ] NEVER deploy without passing all checks

### Monitoring

- [ ] ALWAYS add health check endpoints (`/health`, `/health/db`, `/health/redis`)
- [ ] ALWAYS track key metrics: request latency, error rate, DB query time
- [ ] ALWAYS set up alerts for 5xx errors, DB connection failures, high latency
- [ ] ALWAYS use distributed tracing (request IDs across services)

---

## Review Process

### Before Committing

- [ ] Run `pnpm lint` — fix all errors
- [ ] Run `pnpm test` — all tests must pass
- [ ] Run `npm audit` — no high/critical vulnerabilities
- [ ] Check for `@ts-ignore` — remove or justify
- [ ] Verify no `console.log` in production code (use `this.logger`)
- [ ] Check for hardcoded secrets or URLs
- [ ] Verify pagination on all list endpoints
- [ ] Verify cache invalidation is targeted, not `reset()`

### Before PR

- [ ] Self-review against this checklist
- [ ] Add tests for new functionality
- [ ] Update API documentation (Swagger)
- [ ] Verify no breaking changes to existing APIs
- [ ] Check Prisma schema for missing indexes

### Before Deploy

- [ ] Run `prisma migrate deploy` in staging
- [ ] Verify health checks pass
- [ ] Check monitoring dashboards for anomalies
- [ ] Have rollback plan ready

---

## Common Anti-Patterns

### ❌ DON'T

```typescript
// 1. Flush entire cache
await this.cacheService.reset();

// 2. Loop queue.add() — blocks event loop
for (const user of users) {
  await this.jobsService.queueEmail('WELCOME', user.email, {});
}

// 3. Fail open in guards
catch (error) {
  return true; // NEVER DO THIS
}

// 4. Return unlimited results
return this.prisma.user.findMany({ where }); // NO TAKE!

// 5. Use Math.random for security
const id = Math.random().toString(36); // Predictable!

// 6. Log stack traces in production
console.error(err.stack); // Leaks internals

// 7. Hardcode secrets
const secret = 'my-secret-key'; // Use env vars!

// 8. Use JWT for reset tokens
const token = this.jwtService.sign({ sub: user.id }); // Reusable!
```

### ✅ DO

```typescript
// 1. Targeted cache invalidation
await this.cacheService.invalidatePattern('tournaments:*');

// 2. Bulk enqueue
const jobs = users.map(u => ({ name: 'SEND_EMAIL', data: { to: u.email } }));
await this.jobsService.queueEmailBulk(jobs);

// 3. Fail closed in guards
catch (error) {
  throw new ServiceUnavailableException();
}

// 4. Always paginate
const take = Math.min(query.take ?? 20, MAX_PAGE_SIZE);
return this.prisma.user.findMany({ where, take, skip });

// 5. Use crypto for security
const id = crypto.randomBytes(16).toString('hex');

// 6. Log safely
this.logger.error(`Operation failed: ${err.message}`);

// 7. Use env vars
const secret = this.configService.get('JWT_SECRET');

// 8. Use crypto random for reset
const token = crypto.randomBytes(32).toString('hex');
```

---

## Quick Reference: Score Targets

| Category | Minimum Score | Target Score |
|---|---|---|
| Security | 7.0/10 | 9.0/10 |
| Performance | 6.0/10 | 8.0/10 |
| Data Management | 6.0/10 | 8.0/10 |
| Code Quality | 7.0/10 | 9.0/10 |
| Infrastructure | 7.0/10 | 9.0/10 |
| Overall | 6.5/10 | 8.5/10 |

> **Never deploy to production if any category is below 6.0/10.**

---

## Emergency Contacts

* **Security issues:** Create P0 ticket, notify team lead immediately
* **Performance degradation:** Check monitoring dashboards, enable query logging temporarily
* **Data corruption:** Stop writes, restore from backup, investigate root cause

---

## Definition of Done

A task is complete when:

* Code is reviewed
* Tests pass
* Documentation updated
* No critical bugs remain
* Feature meets acceptance criteria

---

## Anti-Patterns: Fallbacks
- Never use `|| 'fallback-string'` for secrets or credentials
- Always use Prisma $transaction for multi-table mutations
- Always check deletedAt: null in queries unless explicitly fetching deleted records
- Prefer Prisma aggregations over $queryRaw for simple counts/sums
- Extract shared logic into base classes, never copy-paste between services
- Add // TODO: comments only for items outside current task scope

---

## Mission

Build the most trusted operating system for golf events, tournaments, leagues, and club communities.

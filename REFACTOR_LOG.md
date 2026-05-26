# Refactor Log

This log tracks the step-by-step refactoring of the OpenClubOS NestJS backend into a more scalable architecture.

## Log Entries

---
## Chunk 1: Stop Database Write Amplification & Add Pagination Guards

Implemented optimizations for database query performance and NestJS backend service efficiency:

1. **Stopped Write Amplification (Tournaments):**
   - Removed the inline `await this.autoUpdateStatuses()` calls from the `findAll()` and `findAllPaged()` methods in `TournamentsService`.
   - Setup `@nestjs/schedule` globally in `AppModule` using `ScheduleModule.forRoot()`.
   - Decorated `autoUpdateStatuses()` in `TournamentsService` with `@Cron('*/5 * * * *')` to run every 5 minutes.
   - Installed `@nestjs/schedule` package dependency in `apps/backend/`.

2. **Added Pagination Guards:**
   - Introduced `const MAX_PAGE_SIZE = 100` to `TournamentsService`, `RegistrationsService`, and `ScoresService`.
   - Clamped the `take` parameter in `TournamentsService.findAllPaged()` to never exceed `MAX_PAGE_SIZE`.
   - Clamped the `take` parameter in `RegistrationsService.findAll()` to never exceed `MAX_PAGE_SIZE`.

3. **Added Database Indexes:**
   - Added `@@index([tournamentId, status])` on `Registration` model in `schema.prisma`.
   - Added `@@index([groupId, userId])` on `Score` model in `schema.prisma`.
   - Added `@@index([startDate, status])` on `Tournament` model in `schema.prisma`.

4. **Verification:**
   - Validated schema with `npx prisma validate`.
   - Built backend with `pnpm build`.

---
## Chunk 2: Fix Over-Fetching and In-Memory Counting

Implemented optimizations to eliminate in-memory array filtering and database over-fetching:

1. **Optimized Registrations Count:**
   - Modified `RegistrationsService.register()` to query the approved registration count (`prisma.registration.count`) in parallel with the user and tournament details.
   - Removed `include: { registrations: true }` from the tournament fetch query inside `register()`.
   - Replaced in-memory filtering `tournament.registrations.filter(...).length` with the pre-fetched `approvedCount` database count variable.

2. **Selective Selection for Scores:**
   - Modified `ScoresService.findByGroup()` and `ScoresService.findByTournament()` to replace broad `include` blocks with a precise `select` query.
   - Restructured score query returns to selectively select only:
     - `Score`: `id`, `strokes`, `putts`, `points`, `status`, `recordedAt`
     - `User`: `id`, `firstName`, `lastName`, `handicap`
     - `Hole`: `id`, `number`, `par`
     - `Group`: `id`, `name`, `startTime`

3. **Verification:**
   - Ran `pnpm build` in the backend application, confirming successful compilation.

---
## Chunk 3: Global Exception Filter & Rate Limiting

Implemented global error standardizing filters and API rate limiting capabilities:

1. **Global HttpException Filter:**
   - Created `HttpExceptionFilter` at `apps/backend/src/common/filters/http-exception.filter.ts` to catch all NestJS `HttpException`s and standardize JSON outputs as `{ success: false, statusCode: number, message: string, timestamp: ISO string }`.
   - Registered the exception filter globally in `apps/backend/src/main.ts` using `app.useGlobalFilters(new HttpExceptionFilter())`.
   - Ensured existing business logic try/catch blocks still propagate and re-throw standard HTTP exceptions correctly.

2. **API Throttling & Rate Limiting:**
   - Integrated the existing `@nestjs/throttler` dependency into `AppModule` (`app.module.ts`).
   - Wired `ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 100 }] })` in `imports`.
   - Registered `ThrottlerGuard` globally by defining it as an `APP_GUARD` provider in `AppModule`.

3. **Verification:**
   - Ran `pnpm build` in the backend application, confirming successful compilation.

---
## Chunk 4: Redis Caching for Tournament Listings

Implemented server-side Redis caching for tournament lists to dramatically reduce database read queries:

1. **Setup Redis Cache Manager:**
   - Installed `@nestjs/cache-manager` and `cache-manager-ioredis-yet` packages.
   - Configured Nest `CacheModule.registerAsync()` with `isGlobal: true` inside `app.module.ts`, using the `cache-manager-ioredis-yet` Redis store pointing to `process.env.REDIS_URL`.
   - Created a custom wrapper service `CacheService` in `apps/backend/src/common/cache/cache.service.ts` exposing `get()`, `set()`, `reset()`, and `invalidatePattern()` methods with robust Keyv / `cache-manager` v6 compatibility.
   - Created `CacheModule` (`apps/backend/src/common/cache/cache.module.ts`) exporting the wrapper service, and imported it in `AppModule`.

2. **Cached Tournament Listings:**
   - Injected `CacheService` into `TournamentsService`.
   - Cached paginated results in `TournamentsService.findAllPaged()` using the key template `tournaments:list:{clubId}:{status}:{search}:{skip}:{take}` with a TTL of 300 seconds.
   - Added cache invalidation (`await this.cacheService.reset()`) inside the `create()` and `update()` methods in `TournamentsService` to ensure cache consistency.

3. **Verification:**
   - Ran `pnpm build` in the backend application, confirming successful compilation.

---
## Chunk 5: Pre-Signed Upload URLs

Migrated file/image upload strategy to use pre-signed Cloudflare R2 (S3-compatible) URLs to eliminate streaming files through the backend or using local disk assumptions:

1. **Integrated AWS S3 Client SDK:**
   - Installed `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` packages.

2. **Created Uploads Module:**
   - Created `PresignedUrlDto` validating `filename` and `contentType`.
   - Created `UploadsService` (`apps/backend/src/modules/uploads/uploads.service.ts`) configured with `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, and `CDN_BASE_URL`. Exposes a `getPresignedUrl()` method generating pre-signed upload URLs and corresponding public CDN URLs.
   - Created `UploadsController` (`apps/backend/src/modules/uploads/uploads.controller.ts`) exposing the `POST /api/uploads/presigned` endpoint protected by `JwtAuthGuard`.
   - Registered `UploadsModule` in `app.module.ts`.

3. **Updated Configuration & Verification:**
   - Added Cloudflare R2 and CDN variables to `.env.example`.
   - Verified that `TournamentsService` correctly stores `bannerUrl` as a standard string representing the public CDN URL without assuming a local file path.
   - Ran `pnpm build` in the backend application, confirming successful compilation.

---
## Chunk 6: Background Tasks with BullMQ & Health Checks

Moved scheduled operations from in-process timers to a distributed BullMQ task runner and integrated queue health checking with NestJS Terminus:

1. **Setup BullMQ Jobs Module:**
   - Configured `BullModule.forRootAsync()` in `JobsModule` (`apps/backend/src/modules/jobs/jobs.module.ts`), parsing `REDIS_URL` safely.
   - Registered the `'background-jobs'` queue.
   - Created `JobsService` which schedules the `'AUTO_UPDATE_TOURNAMENTS'` task as a repeatable job (running every 5 minutes) on application bootstrap.
   - Created `JobsProcessor` extending `WorkerHost` to run `'AUTO_UPDATE_TOURNAMENTS'` and stub `'SEND_REMINDER'`.
   - Changed `autoUpdateStatuses()` in `TournamentsService` from private to public so the processor can invoke it, keeping the existing schedule cron for fallback verification as instructed.

2. **Added Queue Health Checks:**
   - Created `QueueHealthIndicator` (`apps/backend/src/common/health/queue.health.ts`) extending Terminus `HealthIndicator` to ping the BullMQ queue client.
   - Created `HealthController` exposing the `/health` endpoint using Terminus `HealthCheckService`.
   - Wired `HealthModule` and registered both `JobsModule` and `HealthModule` in `app.module.ts`.

3. **Verification:**
   - Ran `pnpm build` in the backend application, confirming successful compilation.

---
## Golf Course Fetching Route Fix

Resolved a mismatch between the web-admin frontend and the NestJS backend for fetching courses:

1. **Identified Mismatch:**
   - Frontend API helper (`apps/web-admin/lib/api/courses.ts`) queries `/api/courses/admin`.
   - Backend `CoursesController` had the endpoint configured as `/api/courses/paged`, resulting in 404 errors during client interaction.

2. **Applied Fix:**
   - Updated the backend `CoursesController` endpoint decorator from `@Get('paged')` to `@Get('admin')` to align perfectly with frontend expectations.

3. **Verification:**
   - Verified that the backend compiles successfully and routes requests to `CoursesService.findAllAdmin()` correctly.

---
## Score Over-fetching and Pagination Refactor

Addressed database over-fetching and implemented pagination guards for the score listings endpoints:

1. **Service Optimizations (`ScoresService`):**
   - Modified `findByTournament()` and `findByGroup()` to accept optional pagination query parameters (`skip = 0` and `take = 100`).
   - Clamped `take` parameter value utilizing `MAX_PAGE_SIZE = 100` (`Math.min(take, 100)`) to guard the database from massive payload requests.
   - Refactored broad relational object fetches with selective `select` clauses:
     - Retrieves only primary fields (`id`, `strokes`, `putts`, `points`, `status`, `recordedAt`).
     - Standardized user information sub-selection (`id`, `firstName`, `lastName`, `handicap`).
     - Standardized hole information sub-selection (`id`, `number`, `par`).
     - Standardized group information sub-selection for tournament queries (`id`, `name`, `startTime`).

2. **Controller Integration (`ScoresController`):**
   - Updated `findByGroup` and `findByTournament` handlers to fetch and pass `skip` and `take` queries safely.

3. **Verification:**
   - Ran `pnpm build` in the backend application, confirming successful compilation and type-safety.

---
## Jobs Module Resolution Cache Fix

Resolved a persistent IDE TS compilation warning where TypeScript's `nodenext` configuration required explicit file extensions for programmatically generated local imports:

1. **Resolution & Casing Fix:**
   - Appended the `.js` extension explicitly to both local module imports inside `apps/backend/src/modules/jobs/jobs.module.ts`:
     - `import { JobsService } from './jobs.service.js';`
     - `import { JobsProcessor } from './jobs.processor.js';`

2. **Verification:**
   - Ran `pnpm build` in the backend application, confirming successful compilation under `nodenext` ESM rules.








# Architecture

OpenclubOS is built as a TypeScript monorepo using pnpm workspaces and Turborepo.

## Components

- **Backend (apps/backend)**: NestJS API with Prisma ORM.
- **Web Admin (apps/web-admin)**: Next.js dashboard for organizer management.
- **Mobile App (apps/mobile-app)**: Flutter application for players and markers.
- **Shared Packages (packages/*)**: Reusable types, UI components, and configurations.
- **Database (database/)**: Prisma schema and migrations.
- **Infrastructure (infrastructure/)**: Docker and Nginx configurations.

## Performance & Scalability (Latency < 20ms)
To achieve sub-20ms latency on heavy aggregate pages (like dashboards), strictly enforce the following architectural patterns:
1. **Network Waterfall Elimination**: Never execute database or external API queries sequentially unless they strictly depend on the previous result. Combine all independent queries into a single `await Promise.all([])` batch.
2. **Microscopic Caching**: For endpoints that aggregate massive amounts of real-time data, utilize the NestJS `@UseInterceptors(CacheInterceptor)` with a short TTL (e.g., `@CacheTTL(5000)` for 5 seconds). This bypasses the database for concurrent identical requests without rendering the data "stale" to the user.

# Architecture

OpenclubOS is built as a TypeScript monorepo using pnpm workspaces and Turborepo.

## Components

- **Backend (apps/backend)**: NestJS API with Prisma ORM.
- **Web Admin (apps/web-admin)**: Next.js dashboard for organizer management.
- **Mobile App (apps/mobile-app)**: Flutter application for players and markers.
- **Shared Packages (packages/*)**: Reusable types, UI components, and configurations.
- **Database (database/)**: Prisma schema and migrations.
- **Infrastructure (infrastructure/)**: Docker and Nginx configurations.

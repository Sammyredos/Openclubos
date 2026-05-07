# OpenclubOS

Industry-grade golf tournament management system.

## Project Overview
OpenclubOS is a comprehensive platform for managing golf tournaments, featuring a NestJS backend, Next.js admin dashboard, and Flutter mobile application.

## Tech Stack
- **Backend**: NestJS, Prisma, PostgreSQL, Redis, Socket.IO.
- **Web Admin**: Next.js 14, TailwindCSS, ShadCN UI, React Query.
- **Mobile**: Flutter 3.x, Riverpod, Hive, Dio.
- **Monorepo**: pnpm workspaces, Turborepo.

## Setup Instructions
1. Install dependencies:
   ```bash
   # For Windows PowerShell users, if 'pnpm' fails, use:
   pnpm.cmd install
   # Or run the setup script with bypass (recommended if policy is restricted):
   powershell -ExecutionPolicy Bypass -File ./scripts/setup.ps1
   ```
2. Setup environment:
   ```bash
   cp .env.example .env
   ```
3. Start infrastructure:
   ```bash
   # Use 'docker compose' (modern) instead of 'docker-compose'
   docker compose up -d
   ```
4. Run development mode:
   ```bash
   pnpm dev
   # Or pnpm.cmd dev
   ```

### Windows Execution Policy Note
If you see an error about `pnpm.ps1 cannot be loaded`, run this command in an Administrator PowerShell to allow script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Development Workflow
- **Backend**: `apps/backend`
- **Web Admin**: `apps/web-admin`
- **Mobile**: `apps/mobile-app`
- **Shared**: `packages/`

## Deployment
Use the provided `docker-compose.yml` and scripts in the `scripts/` directory.

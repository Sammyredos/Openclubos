# Database Design

OpenclubOS uses PostgreSQL 15+ managed via Prisma ORM.

## Key Models
- **User**: Authentication and profile data.
- **Club**: Golf club organization.
- **Tournament**: Event management.
- **Score**: Player scoring records.

## Indexing Guidelines
To prevent sequential scans on large tables (which bottleneck concurrent dashboard queries), always ensure that all time-based fields frequently used in range queries (`gte`, `lt`) or sorts are structurally indexed:
- `@@index([createdAt])`
- `@@index([updatedAt])`
- `@@index([deletedAt])` (Essential for soft-deletes: `where: { deletedAt: null }`)
- Domain-specific dates like `@@index([registeredAt])` or `@@index([recordedAt])`

## Aggregations
Avoid fetching entire records (`findMany`) just to sum or count fields in Node.js memory. Instead, always use native PostgreSQL aggregation (e.g., `this.prisma.$queryRaw\`SELECT SUM... \``) to offload the mathematical computation directly to the database engine.

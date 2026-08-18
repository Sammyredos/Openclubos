-- ==============================================================================
-- OpenClubOS Multi-Tenant Row Level Security (RLS) Policies
-- Enforces tenant isolation at the PostgreSQL engine level
-- Uses transaction-scoped context: current_setting('app.current_tenant', true)
-- ==============================================================================

-- 1. Enable and FORCE RLS on core tenant-scoped tables (even for table owners / pooled connections)
ALTER TABLE "Tournament" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tournament" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Registration" FORCE ROW LEVEL SECURITY;

ALTER TABLE "Score" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Score" FORCE ROW LEVEL SECURITY;

-- 2. Drop existing policies to allow idempotent re-execution
DROP POLICY IF EXISTS tournament_tenant_isolation ON "Tournament";
DROP POLICY IF EXISTS registration_tenant_isolation ON "Registration";
DROP POLICY IF EXISTS score_tenant_isolation ON "Score";

-- 3. Create RLS Policies
-- Allows access if:
--   a) app.current_tenant is unset/empty (System / Super-Admin / Cron tasks)
--   b) OR clubId matches the transaction-local app.current_tenant setting
CREATE POLICY tournament_tenant_isolation ON "Tournament"
    FOR ALL
    USING (
        current_setting('app.current_tenant', true) IS NULL 
        OR current_setting('app.current_tenant', true) = '' 
        OR "clubId" = current_setting('app.current_tenant', true)
    );

CREATE POLICY registration_tenant_isolation ON "Registration"
    FOR ALL
    USING (
        current_setting('app.current_tenant', true) IS NULL 
        OR current_setting('app.current_tenant', true) = '' 
        OR EXISTS (
            SELECT 1 FROM "Tournament" t 
            WHERE t.id = "Registration"."tournamentId" 
            AND t."clubId" = current_setting('app.current_tenant', true)
        )
    );

CREATE POLICY score_tenant_isolation ON "Score"
    FOR ALL
    USING (
        current_setting('app.current_tenant', true) IS NULL 
        OR current_setting('app.current_tenant', true) = '' 
        OR EXISTS (
            SELECT 1 FROM "Group" g 
            JOIN "Tournament" t ON t.id = g."tournamentId"
            WHERE g.id = "Score"."groupId" 
            AND t."clubId" = current_setting('app.current_tenant', true)
        )
        OR EXISTS (
            SELECT 1 FROM "User" u
            WHERE u.id = "Score"."userId"
            AND u."clubId" = current_setting('app.current_tenant', true)
        )
    );

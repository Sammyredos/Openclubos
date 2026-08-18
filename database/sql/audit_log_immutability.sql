-- ==============================================================================
-- OpenClubOS AuditLog Immutability Enforcement (Append-Only)
-- Prevents UPDATE and DELETE operations on the AuditLog table
-- ==============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'SECURITY VIOLATION: AuditLog entries are immutable and append-only. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

-- Apply trigger before UPDATE or DELETE
DROP TRIGGER IF EXISTS trg_protect_audit_log ON "AuditLog";
CREATE TRIGGER trg_protect_audit_log
BEFORE UPDATE OR DELETE ON "AuditLog"
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

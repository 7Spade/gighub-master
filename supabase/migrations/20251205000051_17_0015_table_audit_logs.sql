-- ============================================================================
-- Migration: 17-0015 - Table: audit_logs
-- Description: 審計日誌表
-- Category: 17 - Business Extensions
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  entity_type audit_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  action audit_action NOT NULL,
  actor_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  actor_name TEXT,
  actor_type audit_actor_type DEFAULT 'user',
  severity audit_severity DEFAULT 'info',
  old_value JSONB,
  new_value JSONB,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  request_id TEXT,
  correlation_id UUID,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_blueprint ON audit_logs(blueprint_id) WHERE blueprint_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

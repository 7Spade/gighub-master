-- ============================================================================
-- Migration: 06-0003 - Table: blueprint_members
-- Description: 藍圖成員表
-- Category: 06 - Blueprint Tables
-- ============================================================================

CREATE TABLE blueprint_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role blueprint_role NOT NULL DEFAULT 'viewer',
  business_role blueprint_business_role,
  custom_role_id UUID REFERENCES blueprint_roles(id) ON DELETE SET NULL,
  is_external BOOLEAN NOT NULL DEFAULT false,
  invited_by UUID REFERENCES accounts(id),
  invited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT blueprint_members_unique UNIQUE (blueprint_id, account_id)
);

-- Indexes
CREATE INDEX idx_blueprint_members_blueprint ON blueprint_members(blueprint_id);
CREATE INDEX idx_blueprint_members_account ON blueprint_members(account_id);
CREATE INDEX idx_blueprint_members_role ON blueprint_members(role);

-- Enable RLS
ALTER TABLE blueprint_members ENABLE ROW LEVEL SECURITY;

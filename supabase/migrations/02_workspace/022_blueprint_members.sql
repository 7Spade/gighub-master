-- ============================================================================
-- Migration: 022_blueprint_members
-- Layer: 02_workspace
-- Description: 藍圖成員表 - 藍圖層級的存取控制
-- Dependencies: 020_blueprints, 021_blueprint_roles
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: blueprint_members (藍圖成員)
-- 藍圖層級的存取控制
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blueprint_members (
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
CREATE INDEX IF NOT EXISTS idx_blueprint_members_blueprint ON blueprint_members(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_account ON blueprint_members(account_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_role ON blueprint_members(role);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_business_role ON blueprint_members(business_role);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_custom_role ON blueprint_members(custom_role_id);

-- Enable RLS
ALTER TABLE blueprint_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS blueprint_members CASCADE;

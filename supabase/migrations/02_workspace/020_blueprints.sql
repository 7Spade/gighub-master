-- ============================================================================
-- Migration: 020_blueprints
-- Layer: 02_workspace
-- Description: 藍圖/工作區表 - 資產容器
-- Dependencies: 01_core/010_accounts
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: blueprints (藍圖/工作區)
-- 資產容器，Owner = User account 或 Organization account
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  status account_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  enabled_modules module_type[] DEFAULT ARRAY['tasks']::module_type[],
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT blueprints_slug_unique UNIQUE (owner_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blueprints_owner ON blueprints(owner_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_status ON blueprints(status);

-- Enable RLS
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS blueprints CASCADE;

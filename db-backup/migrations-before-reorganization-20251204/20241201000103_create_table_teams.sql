-- ============================================================================
-- Migration: Create Teams Table
-- Description: 團隊表 - 組織內的群組
-- Created: 2024-12-01
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: teams (團隊)
-- 組織內的群組，用於批量授權 (非資產擁有者)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT teams_name_unique UNIQUE (organization_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_teams_organization ON teams(organization_id);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS teams CASCADE;

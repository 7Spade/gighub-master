-- ============================================================================
-- Migration: 023_blueprint_team_roles
-- Layer: 02_workspace
-- Description: 藍圖團隊授權表 - 透過團隊批量授權
-- Dependencies: 020_blueprints, 01_core/013_teams
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: blueprint_team_roles (藍圖團隊授權)
-- 透過團隊批量授權藍圖存取 (非擁有權)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blueprint_team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  access_level blueprint_team_access NOT NULL DEFAULT 'read',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT blueprint_team_roles_unique UNIQUE (blueprint_id, team_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blueprint_team_roles_blueprint ON blueprint_team_roles(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_team_roles_team ON blueprint_team_roles(team_id);

-- Enable RLS
ALTER TABLE blueprint_team_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS blueprint_team_roles CASCADE;

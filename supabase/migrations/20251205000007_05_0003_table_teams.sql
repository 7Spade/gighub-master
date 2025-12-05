-- ============================================================================
-- Migration: 05-0003 - Table: teams
-- Description: 團隊表
-- Category: 05 - Organization Tables
-- ============================================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_teams_organization ON teams(organization_id);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

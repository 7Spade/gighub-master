-- ============================================================================
-- Migration: 05-0004 - Table: team_members
-- Description: 團隊成員表
-- Category: 05 - Organization Tables
-- ============================================================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT team_members_unique UNIQUE (team_id, account_id)
);

-- Indexes
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_account ON team_members(account_id);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

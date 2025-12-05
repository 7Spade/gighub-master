-- ============================================================================
-- Migration: 05-0002 - Table: organization_members
-- Description: 組織成員表
-- Category: 05 - Organization Tables
-- ============================================================================

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT organization_members_unique UNIQUE (organization_id, account_id)
);

-- Indexes
CREATE INDEX idx_organization_members_organization ON organization_members(organization_id);
CREATE INDEX idx_organization_members_account ON organization_members(account_id);

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

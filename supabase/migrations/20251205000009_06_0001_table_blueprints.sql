-- ============================================================================
-- Migration: 06-0001 - Table: blueprints
-- Description: 藍圖表
-- Category: 06 - Blueprint Tables
-- ============================================================================

CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  status account_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  enabled_modules module_type[] DEFAULT ARRAY['tasks']::module_type[],
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_blueprints_owner ON blueprints(owner_id);
CREATE INDEX idx_blueprints_slug ON blueprints(slug);
CREATE INDEX idx_blueprints_status ON blueprints(status);
CREATE INDEX idx_blueprints_public ON blueprints(is_public) WHERE is_public = true;

-- Enable RLS
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration: Create Checklists Table
-- Description: 檢查表
-- Created: 2024-12-01
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: checklists (檢查表)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  is_template BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checklists_blueprint ON checklists(blueprint_id);

-- Enable RLS
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS checklists CASCADE;

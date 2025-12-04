-- ============================================================================
-- Migration: 032_checklists/tables
-- Layer: 03_modules
-- Description: 檢查清單模組 - 表結構定義
-- Dependencies: 02_workspace/020_blueprints
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: checklists (檢查清單)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_template BOOLEAN NOT NULL DEFAULT false,
  category TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checklists_blueprint ON checklists(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_checklists_is_template ON checklists(is_template);

-- Enable RLS
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: checklist_items (檢查項目)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_by UUID REFERENCES accounts(id),
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON checklist_items(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_is_completed ON checklist_items(is_completed);

-- Enable RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS checklist_items CASCADE;
-- DROP TABLE IF EXISTS checklists CASCADE;

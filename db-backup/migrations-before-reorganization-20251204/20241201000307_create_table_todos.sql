-- ============================================================================
-- Migration: Create Todos Table
-- Description: 待辦事項表
-- Created: 2024-12-01
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: todos (待辦事項)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  priority task_priority DEFAULT 'medium',
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_todos_blueprint ON todos(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_todos_account ON todos(account_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(is_completed);

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS todos CASCADE;

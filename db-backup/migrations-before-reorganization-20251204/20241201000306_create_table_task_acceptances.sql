-- ============================================================================
-- Migration: Create Task Acceptances Table
-- Description: 任務驗收表
-- Created: 2024-12-01
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: task_acceptances (任務驗收)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  result acceptance_result NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES accounts(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_acceptances_task ON task_acceptances(task_id);
CREATE INDEX IF NOT EXISTS idx_task_acceptances_result ON task_acceptances(result);

-- Enable RLS
ALTER TABLE task_acceptances ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS task_acceptances CASCADE;

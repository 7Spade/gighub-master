-- ============================================================================
-- Migration: 07-0003 - Table: task_acceptances
-- Description: 任務驗收表
-- Category: 07 - Module Tables
-- ============================================================================

CREATE TABLE task_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  result acceptance_result NOT NULL DEFAULT 'pending',
  reviewer_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_task_acceptances_task ON task_acceptances(task_id);
CREATE INDEX idx_task_acceptances_result ON task_acceptances(result);

-- Enable RLS
ALTER TABLE task_acceptances ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration: 17-0012 - Table: problem_actions
-- Description: 問題處理行動表
-- Category: 17 - Business Extensions (Problem)
-- ============================================================================

CREATE TABLE IF NOT EXISTS problem_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status problem_status DEFAULT 'open' NOT NULL,
  assignee_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB,
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_problem_actions_problem ON problem_actions(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_actions_status ON problem_actions(status);

-- Enable RLS
ALTER TABLE problem_actions ENABLE ROW LEVEL SECURITY;

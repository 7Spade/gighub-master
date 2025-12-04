-- ============================================================================
-- Migration: 17-0011 - Table: problems
-- Description: 問題管理表
-- Category: 17 - Business Extensions (Problem)
-- ============================================================================

CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  qc_inspection_id UUID REFERENCES qc_inspections(id) ON DELETE SET NULL,
  acceptance_id UUID REFERENCES acceptances(id) ON DELETE SET NULL,
  problem_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  problem_type problem_type DEFAULT 'other' NOT NULL,
  status problem_status DEFAULT 'open' NOT NULL,
  priority problem_priority DEFAULT 'medium' NOT NULL,
  severity problem_severity DEFAULT 'minor' NOT NULL,
  source problem_source DEFAULT 'observation' NOT NULL,
  location TEXT,
  assignee_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  notes TEXT,
  root_cause TEXT,
  corrective_action TEXT,
  preventive_action TEXT,
  metadata JSONB,
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_problems_blueprint ON problems(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_problems_task ON problems(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_priority ON problems(priority);

-- Enable RLS
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

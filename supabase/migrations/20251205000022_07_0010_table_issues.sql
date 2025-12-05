-- ============================================================================
-- Migration: 07-0010 - Table: issues
-- Description: 問題追蹤表
-- Category: 07 - Module Tables
-- ============================================================================

CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status issue_status NOT NULL DEFAULT 'new',
  severity issue_severity NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_issues_blueprint ON issues(blueprint_id);
CREATE INDEX idx_issues_task ON issues(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_assignee ON issues(assignee_id) WHERE assignee_id IS NOT NULL;

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

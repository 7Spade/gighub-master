-- ============================================================================
-- Migration: 033_issues/tables
-- Layer: 03_modules
-- Description: 問題追蹤模組 - 表結構定義
-- Dependencies: 02_workspace/020_blueprints, 030_tasks
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: issues (問題)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity issue_severity NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'new',
  reported_by UUID REFERENCES accounts(id),
  assigned_to UUID REFERENCES accounts(id),
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issues_blueprint ON issues(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_issues_task ON issues(task_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_to ON issues(assigned_to);

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: issue_comments (問題評論)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES issue_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_author ON issue_comments(author_id);

-- Enable RLS
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS issue_comments CASCADE;
-- DROP TABLE IF EXISTS issues CASCADE;

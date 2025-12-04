-- ============================================================================
-- Migration: 036_problems/tables
-- Layer: 03_modules
-- Description: 問題管理模組 - 表結構定義
-- Dependencies: 02_workspace/020_blueprints, 030_tasks, 034_qc, 035_acceptance
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: problems (問題記錄)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  qc_inspection_id UUID REFERENCES qc_inspections(id) ON DELETE SET NULL,
  acceptance_id UUID REFERENCES acceptances(id) ON DELETE SET NULL,
  qc_item_id UUID REFERENCES qc_inspection_items(id) ON DELETE SET NULL,
  problem_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  problem_type problem_type DEFAULT 'defect' NOT NULL,
  source problem_source DEFAULT 'self_report' NOT NULL,
  status problem_status DEFAULT 'open' NOT NULL,
  priority problem_priority DEFAULT 'medium' NOT NULL,
  severity problem_severity DEFAULT 'minor' NOT NULL,
  impact_description TEXT,
  impact_cost DECIMAL(15,2),
  impact_schedule INTEGER,
  risk_flag BOOLEAN DEFAULT FALSE,
  location TEXT,
  area TEXT,
  reporter_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  verifier_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  target_date DATE,
  resolved_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  root_cause TEXT,
  resolution TEXT,
  prevention TEXT,
  notes TEXT,
  metadata JSONB,
  knowledge_base BOOLEAN DEFAULT FALSE,
  knowledge_tags TEXT[],
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_problems_blueprint_id ON problems(blueprint_id);
CREATE INDEX idx_problems_task_id ON problems(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_problems_qc_inspection_id ON problems(qc_inspection_id) WHERE qc_inspection_id IS NOT NULL;
CREATE INDEX idx_problems_acceptance_id ON problems(acceptance_id) WHERE acceptance_id IS NOT NULL;
CREATE INDEX idx_problems_status ON problems(status);
CREATE INDEX idx_problems_type ON problems(problem_type);
CREATE INDEX idx_problems_priority ON problems(priority);
CREATE INDEX idx_problems_severity ON problems(severity);
CREATE INDEX idx_problems_assignee_id ON problems(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_problems_risk_flag ON problems(risk_flag) WHERE risk_flag = TRUE;
CREATE INDEX idx_problems_not_deleted ON problems(blueprint_id, status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: problem_actions (問題處置記錄)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS problem_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  from_status problem_status,
  to_status problem_status,
  actor_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_problem_actions_problem_id ON problem_actions(problem_id);

-- Enable RLS
ALTER TABLE problem_actions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: problem_comments (問題評論)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS problem_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES problem_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_problem_comments_problem_id ON problem_comments(problem_id);

-- Enable RLS
ALTER TABLE problem_comments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: problem_attachments (問題附件)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS problem_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  attachment_type TEXT,
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_problem_attachments_problem_id ON problem_attachments(problem_id);

-- Enable RLS
ALTER TABLE problem_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE problems IS '問題記錄表 - 管理問題生命週期';
COMMENT ON TABLE problem_actions IS '問題處置記錄表 - 記錄處置歷史';
COMMENT ON TABLE problem_comments IS '問題評論表 - 問題討論留言';
COMMENT ON TABLE problem_attachments IS '問題附件表 - 存放問題相關檔案';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS problem_attachments CASCADE;
-- DROP TABLE IF EXISTS problem_comments CASCADE;
-- DROP TABLE IF EXISTS problem_actions CASCADE;
-- DROP TABLE IF EXISTS problems CASCADE;

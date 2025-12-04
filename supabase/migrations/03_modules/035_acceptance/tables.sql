-- ============================================================================
-- Migration: 035_acceptance/tables
-- Layer: 03_modules
-- Description: 驗收模組 - 表結構定義
-- Dependencies: 02_workspace/020_blueprints, 030_tasks, 034_qc
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: acceptances (驗收記錄)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  qc_inspection_id UUID REFERENCES qc_inspections(id) ON DELETE SET NULL,
  acceptance_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  acceptance_type acceptance_type DEFAULT 'interim' NOT NULL,
  status acceptance_status DEFAULT 'pending' NOT NULL,
  scope TEXT,
  criteria TEXT,
  decision acceptance_decision,
  decision_reason TEXT,
  conditions TEXT,
  applicant_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  approver_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ,
  scheduled_date DATE,
  acceptance_date TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB,
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_acceptances_blueprint_id ON acceptances(blueprint_id);
CREATE INDEX idx_acceptances_task_id ON acceptances(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_acceptances_qc_inspection_id ON acceptances(qc_inspection_id) WHERE qc_inspection_id IS NOT NULL;
CREATE INDEX idx_acceptances_status ON acceptances(status);
CREATE INDEX idx_acceptances_type ON acceptances(acceptance_type);
CREATE INDEX idx_acceptances_scheduled_date ON acceptances(scheduled_date);
CREATE INDEX idx_acceptances_not_deleted ON acceptances(blueprint_id, status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE acceptances ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: acceptance_approvals (驗收審批)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS acceptance_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acceptance_id UUID NOT NULL REFERENCES acceptances(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  decision acceptance_decision NOT NULL,
  comments TEXT,
  approval_order INTEGER DEFAULT 0,
  approved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_acceptance_approvals_acceptance_id ON acceptance_approvals(acceptance_id);

-- Enable RLS
ALTER TABLE acceptance_approvals ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: acceptance_attachments (驗收附件)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS acceptance_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acceptance_id UUID NOT NULL REFERENCES acceptances(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  document_type TEXT,
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_acceptance_attachments_acceptance_id ON acceptance_attachments(acceptance_id);

-- Enable RLS
ALTER TABLE acceptance_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE acceptances IS '驗收記錄表 - 記錄驗收流程';
COMMENT ON TABLE acceptance_approvals IS '驗收審批記錄表 - 記錄審批歷史';
COMMENT ON TABLE acceptance_attachments IS '驗收附件表 - 存放驗收相關文件';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS acceptance_attachments CASCADE;
-- DROP TABLE IF EXISTS acceptance_approvals CASCADE;
-- DROP TABLE IF EXISTS acceptances CASCADE;

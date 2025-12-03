-- Migration: Create Acceptances Tables
-- Description: 驗收表 - 驗收流程管理系統
-- 
-- Prerequisites: 
--   先執行 seed.sql (建立基礎表：blueprints, tasks, accounts)
--   先執行 seed_diaries.sql (建立 diaries 表)
--   先執行 seed_qc_inspections.sql (建立 qc_inspections 表)
--
-- Run Order (執行順序):
--   1. seed.sql (必須先執行 - 建立基礎架構)
--   2. seed_diaries.sql
--   3. seed_qc_inspections.sql
--   4. seed_acceptances.sql (本檔案)
--   5. seed_problems.sql
--   6. seed_audit_logs.sql
--   7. seed_search_history.sql
--
-- Features:
--   - Acceptance workflow management
--   - Multi-level approval support
--   - Decision tracking (approve/reject/conditional/defer)
--   - Attachment support for documentation

-- ============================================================================
-- Enums
-- ============================================================================

-- 驗收狀態
DROP TYPE IF EXISTS acceptance_status CASCADE;
CREATE TYPE acceptance_status AS ENUM (
  'pending',        -- 待驗收
  'in_progress',    -- 驗收中
  'passed',         -- 驗收通過
  'failed',         -- 驗收失敗
  'conditionally_passed', -- 有條件通過
  'cancelled'       -- 已取消
);

-- 驗收類型
DROP TYPE IF EXISTS acceptance_type CASCADE;
CREATE TYPE acceptance_type AS ENUM (
  'interim',        -- 期中驗收
  'final',          -- 最終驗收
  'partial',        -- 部分驗收
  'stage',          -- 階段驗收
  'completion'      -- 完工驗收
);

-- 驗收決定類型
DROP TYPE IF EXISTS acceptance_decision CASCADE;
CREATE TYPE acceptance_decision AS ENUM (
  'approve',        -- 核准
  'reject',         -- 駁回
  'conditional',    -- 有條件核准
  'defer'           -- 延後
);

-- ============================================================================
-- Table: acceptances
-- ============================================================================

CREATE TABLE IF NOT EXISTS acceptances (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯資訊
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  qc_inspection_id UUID REFERENCES qc_inspections(id) ON DELETE SET NULL,
  
  -- 驗收資訊
  acceptance_code TEXT NOT NULL,            -- 驗收編號
  title TEXT NOT NULL,                      -- 驗收標題
  description TEXT,                         -- 驗收說明
  acceptance_type acceptance_type DEFAULT 'interim' NOT NULL,
  
  -- 狀態
  status acceptance_status DEFAULT 'pending' NOT NULL,
  
  -- 驗收範圍
  scope TEXT,                               -- 驗收範圍說明
  criteria TEXT,                            -- 驗收標準
  
  -- 驗收結果
  decision acceptance_decision,             -- 驗收決定
  decision_reason TEXT,                     -- 決定理由
  conditions TEXT,                          -- 條件說明
  
  -- 人員資訊
  applicant_id UUID REFERENCES accounts(id) ON DELETE SET NULL,      -- 申請人
  reviewer_id UUID REFERENCES accounts(id) ON DELETE SET NULL,       -- 審核人
  approver_id UUID REFERENCES accounts(id) ON DELETE SET NULL,       -- 核准人
  
  -- 時間資訊
  applied_at TIMESTAMPTZ,                   -- 申請時間
  scheduled_date DATE,                      -- 預定驗收日期
  acceptance_date TIMESTAMPTZ,              -- 實際驗收時間
  decided_at TIMESTAMPTZ,                   -- 決定時間
  
  -- 備註
  notes TEXT,
  
  -- 元數據
  metadata JSONB,
  
  -- 時間戳
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- Table: acceptance_approvals
-- ============================================================================

CREATE TABLE IF NOT EXISTS acceptance_approvals (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯
  acceptance_id UUID NOT NULL REFERENCES acceptances(id) ON DELETE CASCADE,
  
  -- 審批資訊
  approver_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  decision acceptance_decision NOT NULL,
  comments TEXT,
  
  -- 審批順序
  approval_order INTEGER DEFAULT 0,
  
  -- 時間戳
  approved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Table: acceptance_attachments
-- ============================================================================

CREATE TABLE IF NOT EXISTS acceptance_attachments (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯
  acceptance_id UUID NOT NULL REFERENCES acceptances(id) ON DELETE CASCADE,
  
  -- 檔案資訊
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  document_type TEXT,                       -- 文件類型 (certificate, report, photo, etc.)
  
  -- 上傳者
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Acceptance Indexes
CREATE INDEX idx_acceptances_blueprint_id ON acceptances(blueprint_id);
CREATE INDEX idx_acceptances_task_id ON acceptances(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_acceptances_qc_inspection_id ON acceptances(qc_inspection_id) WHERE qc_inspection_id IS NOT NULL;
CREATE INDEX idx_acceptances_status ON acceptances(status);
CREATE INDEX idx_acceptances_type ON acceptances(acceptance_type);
CREATE INDEX idx_acceptances_scheduled_date ON acceptances(scheduled_date);
CREATE INDEX idx_acceptances_not_deleted ON acceptances(blueprint_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_acceptance_approvals_acceptance_id ON acceptance_approvals(acceptance_id);
CREATE INDEX idx_acceptance_attachments_acceptance_id ON acceptance_attachments(acceptance_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_attachments ENABLE ROW LEVEL SECURITY;

-- Acceptances Policies
CREATE POLICY acceptances_select_policy ON acceptances
  FOR SELECT TO authenticated
  USING (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY acceptances_insert_policy ON acceptances
  FOR INSERT TO authenticated
  WITH CHECK (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY acceptances_update_policy ON acceptances
  FOR UPDATE TO authenticated
  USING (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY acceptances_delete_policy ON acceptances
  FOR DELETE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members 
      WHERE account_id = (SELECT auth.uid()) AND role IN ('contributor', 'maintainer')
    )
  );

-- Acceptance Approvals Policies
CREATE POLICY acceptance_approvals_select_policy ON acceptance_approvals
  FOR SELECT TO authenticated
  USING (
    acceptance_id IN (
      SELECT a.id FROM acceptances a
      JOIN blueprint_members bm ON a.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY acceptance_approvals_insert_policy ON acceptance_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    approver_id = (SELECT auth.uid())
    AND acceptance_id IN (
      SELECT a.id FROM acceptances a
      JOIN blueprint_members bm ON a.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

-- Acceptance Attachments Policies
CREATE POLICY acceptance_attachments_select_policy ON acceptance_attachments
  FOR SELECT TO authenticated
  USING (
    acceptance_id IN (
      SELECT a.id FROM acceptances a
      JOIN blueprint_members bm ON a.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY acceptance_attachments_insert_policy ON acceptance_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    acceptance_id IN (
      SELECT a.id FROM acceptances a
      JOIN blueprint_members bm ON a.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY acceptance_attachments_delete_policy ON acceptance_attachments
  FOR DELETE TO authenticated
  USING (
    uploaded_by = (SELECT auth.uid())
  );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger (reuse if exists, otherwise create)
CREATE OR REPLACE FUNCTION update_acceptance_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_acceptances_updated_at
  BEFORE UPDATE ON acceptances
  FOR EACH ROW
  EXECUTE FUNCTION update_acceptance_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE acceptances IS '驗收記錄表 - 記錄驗收流程';
COMMENT ON COLUMN acceptances.id IS '唯一識別碼';
COMMENT ON COLUMN acceptances.blueprint_id IS '所屬藍圖';
COMMENT ON COLUMN acceptances.task_id IS '關聯任務';
COMMENT ON COLUMN acceptances.qc_inspection_id IS '關聯品管檢查';
COMMENT ON COLUMN acceptances.acceptance_code IS '驗收編號';
COMMENT ON COLUMN acceptances.title IS '驗收標題';
COMMENT ON COLUMN acceptances.description IS '驗收說明';
COMMENT ON COLUMN acceptances.acceptance_type IS '驗收類型';
COMMENT ON COLUMN acceptances.status IS '驗收狀態';
COMMENT ON COLUMN acceptances.scope IS '驗收範圍說明';
COMMENT ON COLUMN acceptances.criteria IS '驗收標準';
COMMENT ON COLUMN acceptances.decision IS '驗收決定';
COMMENT ON COLUMN acceptances.decision_reason IS '決定理由';
COMMENT ON COLUMN acceptances.conditions IS '條件說明';
COMMENT ON COLUMN acceptances.applicant_id IS '申請人';
COMMENT ON COLUMN acceptances.reviewer_id IS '審核人';
COMMENT ON COLUMN acceptances.approver_id IS '核准人';
COMMENT ON COLUMN acceptances.applied_at IS '申請時間';
COMMENT ON COLUMN acceptances.scheduled_date IS '預定驗收日期';
COMMENT ON COLUMN acceptances.acceptance_date IS '實際驗收時間';
COMMENT ON COLUMN acceptances.decided_at IS '決定時間';

COMMENT ON TABLE acceptance_approvals IS '驗收審批記錄表 - 記錄審批歷史';
COMMENT ON COLUMN acceptance_approvals.id IS '唯一識別碼';
COMMENT ON COLUMN acceptance_approvals.acceptance_id IS '所屬驗收';
COMMENT ON COLUMN acceptance_approvals.approver_id IS '審批人';
COMMENT ON COLUMN acceptance_approvals.decision IS '審批決定';
COMMENT ON COLUMN acceptance_approvals.comments IS '審批意見';
COMMENT ON COLUMN acceptance_approvals.approval_order IS '審批順序';
COMMENT ON COLUMN acceptance_approvals.approved_at IS '審批時間';

COMMENT ON TABLE acceptance_attachments IS '驗收附件表 - 存放驗收相關文件';
COMMENT ON COLUMN acceptance_attachments.id IS '唯一識別碼';
COMMENT ON COLUMN acceptance_attachments.acceptance_id IS '所屬驗收';
COMMENT ON COLUMN acceptance_attachments.file_name IS '檔案名稱';
COMMENT ON COLUMN acceptance_attachments.file_path IS '檔案路徑';
COMMENT ON COLUMN acceptance_attachments.file_size IS '檔案大小';
COMMENT ON COLUMN acceptance_attachments.mime_type IS '檔案類型';
COMMENT ON COLUMN acceptance_attachments.caption IS '說明文字';
COMMENT ON COLUMN acceptance_attachments.document_type IS '文件類型';
COMMENT ON COLUMN acceptance_attachments.uploaded_by IS '上傳者';

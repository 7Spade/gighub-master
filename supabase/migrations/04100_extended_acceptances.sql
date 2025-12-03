-- ============================================================================
-- Migration: 04100_extended_acceptances.sql
-- Layer: Extended Modules (擴展模組)
-- Module: Acceptances (驗收管理)
-- Description: 驗收管理模組 - 驗收流程和審批工作流
--
-- Features:
--   - Acceptance workflow management (驗收流程管理)
--   - Multi-level approval support (多級審批支援)
--   - Attachments for documents (文件附件)
--   - Decision tracking (決定追蹤)
--
-- Dependencies:
--   - blueprints table (02000)
--   - accounts table (01000)
--   - blueprint_members table (02001)
--   - tasks table (03000)
--   - qc_inspections table (04000)
--
-- Based on GigHub Architecture:
--   - Three-layer architecture (Foundation/Container/Business)
--   - Blueprint as logical container
--   - RLS with helper functions pattern
-- ============================================================================

-- ============================================================================
-- 1. Enums (枚舉類型)
-- ============================================================================

-- 驗收狀態
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acceptance_status') THEN
    CREATE TYPE acceptance_status AS ENUM (
      'pending',        -- 待驗收
      'in_progress',    -- 驗收中
      'passed',         -- 驗收通過
      'failed',         -- 驗收不通過
      'conditionally_passed', -- 有條件通過
      'cancelled'       -- 已取消
    );
  END IF;
END $$;

-- 驗收類型
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acceptance_type') THEN
    CREATE TYPE acceptance_type AS ENUM (
      'interim',        -- 中間驗收
      'milestone',      -- 里程碑驗收
      'final',          -- 最終驗收
      'partial',        -- 部分驗收
      'special'         -- 特殊驗收
    );
  END IF;
END $$;

-- 驗收決定
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'acceptance_decision') THEN
    CREATE TYPE acceptance_decision AS ENUM (
      'approve',        -- 核准
      'reject',         -- 駁回
      'conditional',    -- 有條件核准
      'defer'           -- 延後
    );
  END IF;
END $$;

-- ============================================================================
-- 2. Table Definitions (資料表定義)
-- ============================================================================

-- 驗收記錄表
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

-- 驗收審批記錄表
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

-- 驗收附件表
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
-- 3. Indexes (索引)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_acceptances_blueprint_id ON acceptances(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_acceptances_task_id ON acceptances(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_acceptances_qc_inspection_id ON acceptances(qc_inspection_id) WHERE qc_inspection_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_acceptances_status ON acceptances(status);
CREATE INDEX IF NOT EXISTS idx_acceptances_type ON acceptances(acceptance_type);
CREATE INDEX IF NOT EXISTS idx_acceptances_scheduled_date ON acceptances(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_acceptances_not_deleted ON acceptances(blueprint_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_acceptance_approvals_acceptance_id ON acceptance_approvals(acceptance_id);
CREATE INDEX IF NOT EXISTS idx_acceptance_attachments_acceptance_id ON acceptance_attachments(acceptance_id);

-- ============================================================================
-- 4. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS acceptances_select_policy ON acceptances;
DROP POLICY IF EXISTS acceptances_insert_policy ON acceptances;
DROP POLICY IF EXISTS acceptances_update_policy ON acceptances;
DROP POLICY IF EXISTS acceptances_delete_policy ON acceptances;

DROP POLICY IF EXISTS acceptance_approvals_select_policy ON acceptance_approvals;
DROP POLICY IF EXISTS acceptance_approvals_insert_policy ON acceptance_approvals;

DROP POLICY IF EXISTS acceptance_attachments_select_policy ON acceptance_attachments;
DROP POLICY IF EXISTS acceptance_attachments_insert_policy ON acceptance_attachments;
DROP POLICY IF EXISTS acceptance_attachments_delete_policy ON acceptance_attachments;

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
      WHERE account_id = (SELECT auth.uid()) AND role IN ('maintainer')
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
-- 5. Triggers (觸發器)
-- ============================================================================

-- Drop existing triggers for idempotency
DROP TRIGGER IF EXISTS trg_acceptances_updated_at ON acceptances;

-- Recreate triggers (reuse update function from QC module)
CREATE TRIGGER trg_acceptances_updated_at
  BEFORE UPDATE ON acceptances
  FOR EACH ROW
  EXECUTE FUNCTION update_qc_inspection_updated_at();

-- ============================================================================
-- 6. Comments (文件註解)
-- ============================================================================

COMMENT ON TABLE acceptances IS '驗收記錄表 - 記錄驗收流程';
COMMENT ON COLUMN acceptances.id IS '唯一識別碼';
COMMENT ON COLUMN acceptances.blueprint_id IS '所屬藍圖';
COMMENT ON COLUMN acceptances.acceptance_code IS '驗收編號';
COMMENT ON COLUMN acceptances.title IS '驗收標題';
COMMENT ON COLUMN acceptances.acceptance_type IS '驗收類型';
COMMENT ON COLUMN acceptances.status IS '驗收狀態';
COMMENT ON COLUMN acceptances.decision IS '驗收決定';

COMMENT ON TABLE acceptance_approvals IS '驗收審批記錄表 - 記錄審批歷史';
COMMENT ON TABLE acceptance_attachments IS '驗收附件表 - 存放驗收相關文件';

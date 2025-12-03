-- Migration: Create Problems Tables
-- Description: 問題管理表 - 問題生命週期管理系統
-- 
-- Prerequisites: 
--   先執行 seed.sql (建立基礎表：blueprints, tasks, accounts)
--   先執行 seed_qc_inspections.sql (建立 qc_inspections, qc_inspection_items 表)
--   先執行 seed_acceptances.sql (建立 acceptances 表)
--
-- Run Order (執行順序):
--   1. seed.sql (必須先執行)
--   2. seed_qc_inspections.sql
--   3. seed_acceptances.sql
--   4. seed_problems.sql (本檔案)
--
-- Features:
--   - Problem lifecycle management (Open → Assessing → Assigned → In Progress → Resolved → Verifying → Closed)
--   - Problem types (defect, risk, gap, improvement, change request)
--   - Priority and severity classification
--   - Action tracking and comments
--   - Knowledge base integration

-- ============================================================================
-- Enums
-- ============================================================================

-- 問題類型
CREATE TYPE problem_type AS ENUM (
  'defect',         -- 缺陷
  'risk',           -- 風險
  'gap',            -- 差距
  'improvement',    -- 改善建議
  'change_request', -- 變更請求
  'non_conformance', -- 不符合
  'safety',         -- 安全問題
  'quality',        -- 品質問題
  'other'           -- 其他
);

-- 問題狀態 (生命週期)
CREATE TYPE problem_status AS ENUM (
  'open',           -- 開立
  'assessing',      -- 評估中
  'assigned',       -- 已分派
  'in_progress',    -- 處理中
  'resolved',       -- 已解決
  'verifying',      -- 驗證中
  'closed',         -- 已關閉
  'cancelled',      -- 已取消
  'deferred'        -- 已延期
);

-- 問題優先級
CREATE TYPE problem_priority AS ENUM (
  'critical',       -- 嚴重
  'high',           -- 高
  'medium',         -- 中
  'low'             -- 低
);

-- 問題嚴重程度
CREATE TYPE problem_severity AS ENUM (
  'critical',       -- 嚴重
  'major',          -- 主要
  'minor',          -- 次要
  'cosmetic'        -- 外觀
);

-- 問題來源
CREATE TYPE problem_source AS ENUM (
  'qc_inspection',  -- 品管檢查
  'acceptance',     -- 驗收
  'self_report',    -- 自我回報
  'customer',       -- 客戶反映
  'audit',          -- 稽核
  'other'           -- 其他
);

-- ============================================================================
-- Table: problems
-- ============================================================================

CREATE TABLE IF NOT EXISTS problems (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯資訊
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  qc_inspection_id UUID REFERENCES qc_inspections(id) ON DELETE SET NULL,
  acceptance_id UUID REFERENCES acceptances(id) ON DELETE SET NULL,
  qc_item_id UUID REFERENCES qc_inspection_items(id) ON DELETE SET NULL,
  
  -- 問題資訊
  problem_code TEXT NOT NULL,               -- 問題編號
  title TEXT NOT NULL,                      -- 問題標題
  description TEXT,                         -- 問題描述
  problem_type problem_type DEFAULT 'defect' NOT NULL,
  source problem_source DEFAULT 'self_report' NOT NULL,
  
  -- 狀態
  status problem_status DEFAULT 'open' NOT NULL,
  priority problem_priority DEFAULT 'medium' NOT NULL,
  severity problem_severity DEFAULT 'minor' NOT NULL,
  
  -- 影響評估
  impact_description TEXT,                  -- 影響說明
  impact_cost DECIMAL(15,2),                -- 影響成本
  impact_schedule INTEGER,                  -- 影響工期 (天)
  risk_flag BOOLEAN DEFAULT FALSE,          -- 高風險標記
  
  -- 位置資訊
  location TEXT,                            -- 問題位置
  area TEXT,                                -- 區域
  
  -- 人員資訊
  reporter_id UUID REFERENCES accounts(id) ON DELETE SET NULL,        -- 回報人
  assignee_id UUID REFERENCES accounts(id) ON DELETE SET NULL,        -- 負責人
  verifier_id UUID REFERENCES accounts(id) ON DELETE SET NULL,        -- 驗證人
  
  -- 時間資訊
  reported_at TIMESTAMPTZ DEFAULT NOW(),    -- 回報時間
  target_date DATE,                         -- 目標完成日
  resolved_at TIMESTAMPTZ,                  -- 解決時間
  verified_at TIMESTAMPTZ,                  -- 驗證時間
  closed_at TIMESTAMPTZ,                    -- 關閉時間
  
  -- 解決方案
  root_cause TEXT,                          -- 根本原因
  resolution TEXT,                          -- 解決方案
  prevention TEXT,                          -- 預防措施
  
  -- 備註
  notes TEXT,
  
  -- 元數據
  metadata JSONB,
  
  -- 知識庫標記
  knowledge_base BOOLEAN DEFAULT FALSE,     -- 是否納入知識庫
  knowledge_tags TEXT[],                    -- 知識標籤
  
  -- 時間戳
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- Table: problem_actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS problem_actions (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  
  -- 處置資訊
  action_type TEXT NOT NULL,                -- 處置類型 (assess, assign, resolve, verify, etc.)
  action_description TEXT NOT NULL,         -- 處置說明
  
  -- 狀態變更
  from_status problem_status,
  to_status problem_status,
  
  -- 人員資訊
  actor_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Table: problem_comments
-- ============================================================================

CREATE TABLE IF NOT EXISTS problem_comments (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES problem_comments(id) ON DELETE CASCADE,
  
  -- 評論內容
  content TEXT NOT NULL,
  
  -- 人員資訊
  author_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- Table: problem_attachments
-- ============================================================================

CREATE TABLE IF NOT EXISTS problem_attachments (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  
  -- 檔案資訊
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  attachment_type TEXT,                     -- 附件類型 (evidence, resolution, etc.)
  
  -- 上傳者
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Problem Indexes
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
CREATE INDEX idx_problem_actions_problem_id ON problem_actions(problem_id);
CREATE INDEX idx_problem_comments_problem_id ON problem_comments(problem_id);
CREATE INDEX idx_problem_attachments_problem_id ON problem_attachments(problem_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_attachments ENABLE ROW LEVEL SECURITY;

-- Problems Policies
CREATE POLICY problems_select_policy ON problems
  FOR SELECT TO authenticated
  USING (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY problems_insert_policy ON problems
  FOR INSERT TO authenticated
  WITH CHECK (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY problems_update_policy ON problems
  FOR UPDATE TO authenticated
  USING (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY problems_delete_policy ON problems
  FOR DELETE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members 
      WHERE account_id = (SELECT auth.uid()) AND role IN ('contributor', 'maintainer')
    )
  );

-- Problem Actions Policies
CREATE POLICY problem_actions_select_policy ON problem_actions
  FOR SELECT TO authenticated
  USING (
    problem_id IN (
      SELECT p.id FROM problems p
      JOIN blueprint_members bm ON p.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY problem_actions_insert_policy ON problem_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    problem_id IN (
      SELECT p.id FROM problems p
      JOIN blueprint_members bm ON p.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

-- Problem Comments Policies
CREATE POLICY problem_comments_select_policy ON problem_comments
  FOR SELECT TO authenticated
  USING (
    problem_id IN (
      SELECT p.id FROM problems p
      JOIN blueprint_members bm ON p.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY problem_comments_insert_policy ON problem_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND problem_id IN (
      SELECT p.id FROM problems p
      JOIN blueprint_members bm ON p.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY problem_comments_update_policy ON problem_comments
  FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
  );

CREATE POLICY problem_comments_delete_policy ON problem_comments
  FOR DELETE TO authenticated
  USING (
    author_id = (SELECT auth.uid())
  );

-- Problem Attachments Policies
CREATE POLICY problem_attachments_select_policy ON problem_attachments
  FOR SELECT TO authenticated
  USING (
    problem_id IN (
      SELECT p.id FROM problems p
      JOIN blueprint_members bm ON p.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY problem_attachments_insert_policy ON problem_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    problem_id IN (
      SELECT p.id FROM problems p
      JOIN blueprint_members bm ON p.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY problem_attachments_delete_policy ON problem_attachments
  FOR DELETE TO authenticated
  USING (
    uploaded_by = (SELECT auth.uid())
  );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger (reuse if exists, otherwise create)
CREATE OR REPLACE FUNCTION update_problem_updated_at()
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

CREATE TRIGGER trg_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_problem_updated_at();

CREATE TRIGGER trg_problem_comments_updated_at
  BEFORE UPDATE ON problem_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_problem_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE problems IS '問題記錄表 - 管理問題生命週期';
COMMENT ON COLUMN problems.id IS '唯一識別碼';
COMMENT ON COLUMN problems.blueprint_id IS '所屬藍圖';
COMMENT ON COLUMN problems.task_id IS '關聯任務';
COMMENT ON COLUMN problems.qc_inspection_id IS '關聯品管檢查';
COMMENT ON COLUMN problems.acceptance_id IS '關聯驗收';
COMMENT ON COLUMN problems.qc_item_id IS '關聯品管項目';
COMMENT ON COLUMN problems.problem_code IS '問題編號';
COMMENT ON COLUMN problems.title IS '問題標題';
COMMENT ON COLUMN problems.description IS '問題描述';
COMMENT ON COLUMN problems.problem_type IS '問題類型';
COMMENT ON COLUMN problems.source IS '問題來源';
COMMENT ON COLUMN problems.status IS '問題狀態';
COMMENT ON COLUMN problems.priority IS '優先級';
COMMENT ON COLUMN problems.severity IS '嚴重程度';
COMMENT ON COLUMN problems.impact_description IS '影響說明';
COMMENT ON COLUMN problems.impact_cost IS '影響成本';
COMMENT ON COLUMN problems.impact_schedule IS '影響工期 (天)';
COMMENT ON COLUMN problems.risk_flag IS '高風險標記';
COMMENT ON COLUMN problems.location IS '問題位置';
COMMENT ON COLUMN problems.area IS '區域';
COMMENT ON COLUMN problems.reporter_id IS '回報人';
COMMENT ON COLUMN problems.assignee_id IS '負責人';
COMMENT ON COLUMN problems.verifier_id IS '驗證人';
COMMENT ON COLUMN problems.reported_at IS '回報時間';
COMMENT ON COLUMN problems.target_date IS '目標完成日';
COMMENT ON COLUMN problems.resolved_at IS '解決時間';
COMMENT ON COLUMN problems.verified_at IS '驗證時間';
COMMENT ON COLUMN problems.closed_at IS '關閉時間';
COMMENT ON COLUMN problems.root_cause IS '根本原因';
COMMENT ON COLUMN problems.resolution IS '解決方案';
COMMENT ON COLUMN problems.prevention IS '預防措施';
COMMENT ON COLUMN problems.knowledge_base IS '是否納入知識庫';
COMMENT ON COLUMN problems.knowledge_tags IS '知識標籤';

COMMENT ON TABLE problem_actions IS '問題處置記錄表 - 記錄處置歷史';
COMMENT ON COLUMN problem_actions.id IS '唯一識別碼';
COMMENT ON COLUMN problem_actions.problem_id IS '所屬問題';
COMMENT ON COLUMN problem_actions.action_type IS '處置類型';
COMMENT ON COLUMN problem_actions.action_description IS '處置說明';
COMMENT ON COLUMN problem_actions.from_status IS '變更前狀態';
COMMENT ON COLUMN problem_actions.to_status IS '變更後狀態';
COMMENT ON COLUMN problem_actions.actor_id IS '執行人';

COMMENT ON TABLE problem_comments IS '問題評論表 - 問題討論留言';
COMMENT ON COLUMN problem_comments.id IS '唯一識別碼';
COMMENT ON COLUMN problem_comments.problem_id IS '所屬問題';
COMMENT ON COLUMN problem_comments.parent_id IS '父評論';
COMMENT ON COLUMN problem_comments.content IS '評論內容';
COMMENT ON COLUMN problem_comments.author_id IS '評論作者';

COMMENT ON TABLE problem_attachments IS '問題附件表 - 存放問題相關檔案';
COMMENT ON COLUMN problem_attachments.id IS '唯一識別碼';
COMMENT ON COLUMN problem_attachments.problem_id IS '所屬問題';
COMMENT ON COLUMN problem_attachments.file_name IS '檔案名稱';
COMMENT ON COLUMN problem_attachments.file_path IS '檔案路徑';
COMMENT ON COLUMN problem_attachments.file_size IS '檔案大小';
COMMENT ON COLUMN problem_attachments.mime_type IS '檔案類型';
COMMENT ON COLUMN problem_attachments.caption IS '說明文字';
COMMENT ON COLUMN problem_attachments.attachment_type IS '附件類型';
COMMENT ON COLUMN problem_attachments.uploaded_by IS '上傳者';

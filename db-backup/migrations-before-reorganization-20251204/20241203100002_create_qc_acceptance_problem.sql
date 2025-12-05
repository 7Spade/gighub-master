-- Migration: Create QC, Acceptance, and Problem Management Tables
-- Description: 品管、驗收、問題管理模組資料表
-- Features:
--   - Quality Control inspections and checklists
--   - Acceptance workflow management
--   - Problem lifecycle management
--   - Traceability and audit support

-- ============================================================================
-- Part 1: Quality Control (QC) Module
-- ============================================================================

-- 品管檢查狀態
CREATE TYPE qc_inspection_status AS ENUM (
  'pending',        -- 待檢查
  'in_progress',    -- 檢查中
  'passed',         -- 通過
  'failed',         -- 未通過
  'conditionally_passed', -- 有條件通過
  'cancelled'       -- 已取消
);

-- 品管檢查類型
CREATE TYPE qc_inspection_type AS ENUM (
  'self_check',     -- 自主檢查
  'supervisor_check', -- 主管檢查
  'third_party',    -- 第三方檢查
  'random_check',   -- 隨機抽查
  'final_check'     -- 最終檢查
);

-- 品管檢查項目狀態
CREATE TYPE qc_item_status AS ENUM (
  'pending',        -- 待檢查
  'passed',         -- 合格
  'failed',         -- 不合格
  'na'              -- 不適用
);

-- 品管檢查表
CREATE TABLE IF NOT EXISTS qc_inspections (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯資訊
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  diary_id UUID REFERENCES diaries(id) ON DELETE SET NULL,
  
  -- 檢查資訊
  inspection_code TEXT NOT NULL,           -- 檢查編號
  title TEXT NOT NULL,                      -- 檢查標題
  description TEXT,                         -- 檢查說明
  inspection_type qc_inspection_type DEFAULT 'self_check' NOT NULL,
  
  -- 狀態
  status qc_inspection_status DEFAULT 'pending' NOT NULL,
  
  -- 檢查結果
  passed_count INTEGER DEFAULT 0,           -- 通過項目數
  failed_count INTEGER DEFAULT 0,           -- 未通過項目數
  total_count INTEGER DEFAULT 0,            -- 總項目數
  pass_rate DECIMAL(5,2) DEFAULT 0,         -- 通過率
  
  -- 人員資訊
  inspector_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- 時間資訊
  scheduled_date DATE,                      -- 預定檢查日期
  inspection_date TIMESTAMPTZ,              -- 實際檢查時間
  reviewed_at TIMESTAMPTZ,                  -- 審核時間
  
  -- 備註
  notes TEXT,
  findings TEXT,                            -- 發現問題
  recommendations TEXT,                     -- 建議事項
  
  -- 元數據
  metadata JSONB,
  
  -- 時間戳
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- 品管檢查項目表
CREATE TABLE IF NOT EXISTS qc_inspection_items (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯
  inspection_id UUID NOT NULL REFERENCES qc_inspections(id) ON DELETE CASCADE,
  
  -- 項目資訊
  item_code TEXT NOT NULL,                  -- 項目編號
  title TEXT NOT NULL,                      -- 項目標題
  description TEXT,                         -- 項目說明
  standard TEXT,                            -- 檢查標準
  
  -- 檢查結果
  status qc_item_status DEFAULT 'pending' NOT NULL,
  actual_value TEXT,                        -- 實測值
  expected_value TEXT,                      -- 標準值
  deviation TEXT,                           -- 偏差說明
  
  -- 評分
  score DECIMAL(5,2),                       -- 評分
  weight DECIMAL(5,2) DEFAULT 1.0,          -- 權重
  
  -- 備註
  notes TEXT,
  
  -- 排序
  sort_order INTEGER DEFAULT 0,
  
  -- 時間戳
  checked_at TIMESTAMPTZ,
  checked_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 品管檢查附件表
CREATE TABLE IF NOT EXISTS qc_inspection_attachments (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯
  inspection_id UUID REFERENCES qc_inspections(id) ON DELETE CASCADE,
  item_id UUID REFERENCES qc_inspection_items(id) ON DELETE CASCADE,
  
  -- 檔案資訊
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  
  -- 上傳者
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- 至少要關聯到 inspection 或 item
  CONSTRAINT qc_attachment_relation CHECK (inspection_id IS NOT NULL OR item_id IS NOT NULL)
);

-- ============================================================================
-- Part 2: Acceptance Module
-- ============================================================================

-- 驗收狀態
CREATE TYPE acceptance_status AS ENUM (
  'pending',        -- 待驗收
  'in_progress',    -- 驗收中
  'passed',         -- 驗收通過
  'failed',         -- 驗收失敗
  'conditionally_passed', -- 有條件通過
  'cancelled'       -- 已取消
);

-- 驗收類型
CREATE TYPE acceptance_type AS ENUM (
  'interim',        -- 期中驗收
  'final',          -- 最終驗收
  'partial',        -- 部分驗收
  'stage',          -- 階段驗收
  'completion'      -- 完工驗收
);

-- 驗收決定類型
CREATE TYPE acceptance_decision AS ENUM (
  'approve',        -- 核准
  'reject',         -- 駁回
  'conditional',    -- 有條件核准
  'defer'           -- 延後
);

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
-- Part 3: Problem Management Module
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

-- 問題記錄表
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

-- 問題處置記錄表
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

-- 問題評論表
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

-- 問題附件表
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

-- QC Inspection Indexes
CREATE INDEX idx_qc_inspections_blueprint_id ON qc_inspections(blueprint_id);
CREATE INDEX idx_qc_inspections_task_id ON qc_inspections(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_qc_inspections_status ON qc_inspections(status);
CREATE INDEX idx_qc_inspections_type ON qc_inspections(inspection_type);
CREATE INDEX idx_qc_inspections_scheduled_date ON qc_inspections(scheduled_date);
CREATE INDEX idx_qc_inspections_not_deleted ON qc_inspections(blueprint_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_qc_inspection_items_inspection_id ON qc_inspection_items(inspection_id);
CREATE INDEX idx_qc_inspection_items_status ON qc_inspection_items(status);
CREATE INDEX idx_qc_inspection_attachments_inspection_id ON qc_inspection_attachments(inspection_id) WHERE inspection_id IS NOT NULL;
CREATE INDEX idx_qc_inspection_attachments_item_id ON qc_inspection_attachments(item_id) WHERE item_id IS NOT NULL;

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
ALTER TABLE qc_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_inspection_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE acceptance_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_attachments ENABLE ROW LEVEL SECURITY;

-- QC Inspections Policies
CREATE POLICY qc_inspections_select_policy ON qc_inspections
  FOR SELECT TO authenticated
  USING (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY qc_inspections_insert_policy ON qc_inspections
  FOR INSERT TO authenticated
  WITH CHECK (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY qc_inspections_update_policy ON qc_inspections
  FOR UPDATE TO authenticated
  USING (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY qc_inspections_delete_policy ON qc_inspections
  FOR DELETE TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members 
      WHERE account_id = (SELECT auth.uid()) AND role IN ('contributor', 'maintainer')
    )
  );

-- QC Inspection Items Policies
CREATE POLICY qc_inspection_items_select_policy ON qc_inspection_items
  FOR SELECT TO authenticated
  USING (
    inspection_id IN (
      SELECT i.id FROM qc_inspections i
      JOIN blueprint_members bm ON i.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY qc_inspection_items_insert_policy ON qc_inspection_items
  FOR INSERT TO authenticated
  WITH CHECK (
    inspection_id IN (
      SELECT i.id FROM qc_inspections i
      JOIN blueprint_members bm ON i.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY qc_inspection_items_update_policy ON qc_inspection_items
  FOR UPDATE TO authenticated
  USING (
    inspection_id IN (
      SELECT i.id FROM qc_inspections i
      JOIN blueprint_members bm ON i.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

CREATE POLICY qc_inspection_items_delete_policy ON qc_inspection_items
  FOR DELETE TO authenticated
  USING (
    checked_by = (SELECT auth.uid())
    OR inspection_id IN (
      SELECT i.id FROM qc_inspections i
      JOIN blueprint_members bm ON i.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid()) AND bm.role IN ('contributor', 'maintainer')
    )
  );

-- QC Inspection Attachments Policies
CREATE POLICY qc_inspection_attachments_select_policy ON qc_inspection_attachments
  FOR SELECT TO authenticated
  USING (
    (inspection_id IS NOT NULL AND inspection_id IN (
      SELECT i.id FROM qc_inspections i
      JOIN blueprint_members bm ON i.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    ))
    OR
    (item_id IS NOT NULL AND item_id IN (
      SELECT it.id FROM qc_inspection_items it
      JOIN qc_inspections i ON it.inspection_id = i.id
      JOIN blueprint_members bm ON i.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    ))
  );

CREATE POLICY qc_inspection_attachments_insert_policy ON qc_inspection_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    (inspection_id IS NOT NULL AND inspection_id IN (
      SELECT i.id FROM qc_inspections i
      JOIN blueprint_members bm ON i.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    ))
    OR
    (item_id IS NOT NULL AND item_id IN (
      SELECT it.id FROM qc_inspection_items it
      JOIN qc_inspections i ON it.inspection_id = i.id
      JOIN blueprint_members bm ON i.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    ))
  );

CREATE POLICY qc_inspection_attachments_delete_policy ON qc_inspection_attachments
  FOR DELETE TO authenticated
  USING (
    uploaded_by = (SELECT auth.uid())
  );

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

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_qc_inspection_updated_at()
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

CREATE TRIGGER trg_qc_inspections_updated_at
  BEFORE UPDATE ON qc_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_qc_inspection_updated_at();

CREATE TRIGGER trg_qc_inspection_items_updated_at
  BEFORE UPDATE ON qc_inspection_items
  FOR EACH ROW
  EXECUTE FUNCTION update_qc_inspection_updated_at();

CREATE TRIGGER trg_acceptances_updated_at
  BEFORE UPDATE ON acceptances
  FOR EACH ROW
  EXECUTE FUNCTION update_qc_inspection_updated_at();

CREATE TRIGGER trg_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_qc_inspection_updated_at();

CREATE TRIGGER trg_problem_comments_updated_at
  BEFORE UPDATE ON problem_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_qc_inspection_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE qc_inspections IS '品管檢查表 - 記錄品質控制檢查';
COMMENT ON TABLE qc_inspection_items IS '品管檢查項目表 - 記錄檢查項目詳情';
COMMENT ON TABLE qc_inspection_attachments IS '品管檢查附件表 - 存放檢查相關圖片和文件';
COMMENT ON TABLE acceptances IS '驗收記錄表 - 記錄驗收流程';
COMMENT ON TABLE acceptance_approvals IS '驗收審批記錄表 - 記錄審批歷史';
COMMENT ON TABLE acceptance_attachments IS '驗收附件表 - 存放驗收相關文件';
COMMENT ON TABLE problems IS '問題記錄表 - 管理問題生命週期';
COMMENT ON TABLE problem_actions IS '問題處置記錄表 - 記錄處置歷史';
COMMENT ON TABLE problem_comments IS '問題評論表 - 問題討論留言';
COMMENT ON TABLE problem_attachments IS '問題附件表 - 存放問題相關檔案';

-- ============================================================================
-- Migration: 04200_extended_problems.sql
-- Layer: Extended Modules (擴展模組)
-- Module: Problems (問題管理)
-- Description: 問題管理模組 - 問題生命週期管理
--
-- Features:
--   - Problem lifecycle management (問題生命週期管理)
--   - Action tracking (處置追蹤)
--   - Comments and discussions (評論討論)
--   - Knowledge base integration (知識庫整合)
--
-- Dependencies:
--   - blueprints table (02000)
--   - accounts table (01000)
--   - blueprint_members table (02001)
--   - tasks table (03000)
--   - qc_inspections table (04000)
--   - acceptances table (04100)
--
-- Based on GigHub Architecture:
--   - Three-layer architecture (Foundation/Container/Business)
--   - Blueprint as logical container
--   - RLS with helper functions pattern
-- ============================================================================

-- ============================================================================
-- 1. Enums (枚舉類型)
-- ============================================================================

-- 問題類型
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_type') THEN
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
  END IF;
END $$;

-- 問題狀態 (生命週期)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_status') THEN
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
  END IF;
END $$;

-- 問題優先級
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_priority') THEN
    CREATE TYPE problem_priority AS ENUM (
      'critical',       -- 嚴重
      'high',           -- 高
      'medium',         -- 中
      'low'             -- 低
    );
  END IF;
END $$;

-- 問題嚴重程度
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_severity') THEN
    CREATE TYPE problem_severity AS ENUM (
      'critical',       -- 嚴重
      'major',          -- 主要
      'minor',          -- 次要
      'cosmetic'        -- 外觀
    );
  END IF;
END $$;

-- 問題來源
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'problem_source') THEN
    CREATE TYPE problem_source AS ENUM (
      'qc_inspection',  -- 品管檢查
      'acceptance',     -- 驗收
      'self_report',    -- 自我回報
      'customer',       -- 客戶反映
      'audit',          -- 稽核
      'other'           -- 其他
    );
  END IF;
END $$;

-- ============================================================================
-- 2. Table Definitions (資料表定義)
-- ============================================================================

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
-- 3. Indexes (索引)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_problems_blueprint_id ON problems(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_problems_task_id ON problems(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_problems_qc_inspection_id ON problems(qc_inspection_id) WHERE qc_inspection_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_problems_acceptance_id ON problems(acceptance_id) WHERE acceptance_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_problems_type ON problems(problem_type);
CREATE INDEX IF NOT EXISTS idx_problems_priority ON problems(priority);
CREATE INDEX IF NOT EXISTS idx_problems_severity ON problems(severity);
CREATE INDEX IF NOT EXISTS idx_problems_assignee_id ON problems(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_problems_target_date ON problems(target_date);
CREATE INDEX IF NOT EXISTS idx_problems_not_deleted ON problems(blueprint_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_problems_knowledge_base ON problems(blueprint_id) WHERE knowledge_base = TRUE;

CREATE INDEX IF NOT EXISTS idx_problem_actions_problem_id ON problem_actions(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_comments_problem_id ON problem_comments(problem_id);
CREATE INDEX IF NOT EXISTS idx_problem_attachments_problem_id ON problem_attachments(problem_id);

-- ============================================================================
-- 4. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS problems_select_policy ON problems;
DROP POLICY IF EXISTS problems_insert_policy ON problems;
DROP POLICY IF EXISTS problems_update_policy ON problems;
DROP POLICY IF EXISTS problems_delete_policy ON problems;

DROP POLICY IF EXISTS problem_actions_select_policy ON problem_actions;
DROP POLICY IF EXISTS problem_actions_insert_policy ON problem_actions;

DROP POLICY IF EXISTS problem_comments_select_policy ON problem_comments;
DROP POLICY IF EXISTS problem_comments_insert_policy ON problem_comments;
DROP POLICY IF EXISTS problem_comments_update_policy ON problem_comments;
DROP POLICY IF EXISTS problem_comments_delete_policy ON problem_comments;

DROP POLICY IF EXISTS problem_attachments_select_policy ON problem_attachments;
DROP POLICY IF EXISTS problem_attachments_insert_policy ON problem_attachments;
DROP POLICY IF EXISTS problem_attachments_delete_policy ON problem_attachments;

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
      WHERE account_id = (SELECT auth.uid()) AND role IN ('maintainer')
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
-- 5. Triggers (觸發器)
-- ============================================================================

-- Drop existing triggers for idempotency
DROP TRIGGER IF EXISTS trg_problems_updated_at ON problems;
DROP TRIGGER IF EXISTS trg_problem_comments_updated_at ON problem_comments;

-- Recreate triggers (reuse update function from QC module)
CREATE TRIGGER trg_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_qc_inspection_updated_at();

CREATE TRIGGER trg_problem_comments_updated_at
  BEFORE UPDATE ON problem_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_qc_inspection_updated_at();

-- ============================================================================
-- 6. Comments (文件註解)
-- ============================================================================

COMMENT ON TABLE problems IS '問題記錄表 - 管理問題生命週期';
COMMENT ON COLUMN problems.id IS '唯一識別碼';
COMMENT ON COLUMN problems.blueprint_id IS '所屬藍圖';
COMMENT ON COLUMN problems.problem_code IS '問題編號';
COMMENT ON COLUMN problems.title IS '問題標題';
COMMENT ON COLUMN problems.problem_type IS '問題類型';
COMMENT ON COLUMN problems.status IS '問題狀態';
COMMENT ON COLUMN problems.priority IS '優先級';
COMMENT ON COLUMN problems.severity IS '嚴重程度';
COMMENT ON COLUMN problems.root_cause IS '根本原因';
COMMENT ON COLUMN problems.resolution IS '解決方案';
COMMENT ON COLUMN problems.knowledge_base IS '是否納入知識庫';

COMMENT ON TABLE problem_actions IS '問題處置記錄表 - 記錄處置歷史';
COMMENT ON TABLE problem_comments IS '問題評論表 - 問題討論留言';
COMMENT ON TABLE problem_attachments IS '問題附件表 - 存放問題相關檔案';

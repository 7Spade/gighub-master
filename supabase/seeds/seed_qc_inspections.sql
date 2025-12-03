-- Migration: Create QC Inspections Tables
-- Description: 品管檢查表 - 品質控制檢查系統
-- 
-- Prerequisites: 
--   先執行 seed.sql (建立基礎表：blueprints, tasks, diaries, accounts)
--
-- Run Order (執行順序):
--   1. seed.sql (必須先執行)
--   2. seed_qc_inspections.sql (本檔案)
--   3. seed_acceptances.sql
--   4. seed_problems.sql
--
-- Features:
--   - QC inspection tracking
--   - Inspection items and checklists
--   - Attachment support for evidence
--   - Pass rate calculation

-- ============================================================================
-- Enums
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

-- ============================================================================
-- Table: qc_inspections
-- ============================================================================

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

-- ============================================================================
-- Table: qc_inspection_items
-- ============================================================================

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

-- ============================================================================
-- Table: qc_inspection_attachments
-- ============================================================================

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

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE qc_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_inspection_attachments ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger
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

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE qc_inspections IS '品管檢查表 - 記錄品質控制檢查';
COMMENT ON COLUMN qc_inspections.id IS '唯一識別碼';
COMMENT ON COLUMN qc_inspections.blueprint_id IS '所屬藍圖';
COMMENT ON COLUMN qc_inspections.task_id IS '關聯任務';
COMMENT ON COLUMN qc_inspections.diary_id IS '關聯日誌';
COMMENT ON COLUMN qc_inspections.inspection_code IS '檢查編號';
COMMENT ON COLUMN qc_inspections.title IS '檢查標題';
COMMENT ON COLUMN qc_inspections.description IS '檢查說明';
COMMENT ON COLUMN qc_inspections.inspection_type IS '檢查類型';
COMMENT ON COLUMN qc_inspections.status IS '檢查狀態';
COMMENT ON COLUMN qc_inspections.passed_count IS '通過項目數';
COMMENT ON COLUMN qc_inspections.failed_count IS '未通過項目數';
COMMENT ON COLUMN qc_inspections.total_count IS '總項目數';
COMMENT ON COLUMN qc_inspections.pass_rate IS '通過率';
COMMENT ON COLUMN qc_inspections.inspector_id IS '檢查人員';
COMMENT ON COLUMN qc_inspections.reviewer_id IS '審核人員';
COMMENT ON COLUMN qc_inspections.scheduled_date IS '預定檢查日期';
COMMENT ON COLUMN qc_inspections.inspection_date IS '實際檢查時間';
COMMENT ON COLUMN qc_inspections.reviewed_at IS '審核時間';
COMMENT ON COLUMN qc_inspections.notes IS '備註';
COMMENT ON COLUMN qc_inspections.findings IS '發現問題';
COMMENT ON COLUMN qc_inspections.recommendations IS '建議事項';

COMMENT ON TABLE qc_inspection_items IS '品管檢查項目表 - 記錄檢查項目詳情';
COMMENT ON COLUMN qc_inspection_items.id IS '唯一識別碼';
COMMENT ON COLUMN qc_inspection_items.inspection_id IS '所屬檢查';
COMMENT ON COLUMN qc_inspection_items.item_code IS '項目編號';
COMMENT ON COLUMN qc_inspection_items.title IS '項目標題';
COMMENT ON COLUMN qc_inspection_items.description IS '項目說明';
COMMENT ON COLUMN qc_inspection_items.standard IS '檢查標準';
COMMENT ON COLUMN qc_inspection_items.status IS '檢查狀態';
COMMENT ON COLUMN qc_inspection_items.actual_value IS '實測值';
COMMENT ON COLUMN qc_inspection_items.expected_value IS '標準值';
COMMENT ON COLUMN qc_inspection_items.deviation IS '偏差說明';
COMMENT ON COLUMN qc_inspection_items.score IS '評分';
COMMENT ON COLUMN qc_inspection_items.weight IS '權重';

COMMENT ON TABLE qc_inspection_attachments IS '品管檢查附件表 - 存放檢查相關圖片和文件';
COMMENT ON COLUMN qc_inspection_attachments.id IS '唯一識別碼';
COMMENT ON COLUMN qc_inspection_attachments.inspection_id IS '所屬檢查';
COMMENT ON COLUMN qc_inspection_attachments.item_id IS '所屬項目';
COMMENT ON COLUMN qc_inspection_attachments.file_name IS '檔案名稱';
COMMENT ON COLUMN qc_inspection_attachments.file_path IS '檔案路徑';
COMMENT ON COLUMN qc_inspection_attachments.file_size IS '檔案大小';
COMMENT ON COLUMN qc_inspection_attachments.mime_type IS '檔案類型';
COMMENT ON COLUMN qc_inspection_attachments.caption IS '說明文字';
COMMENT ON COLUMN qc_inspection_attachments.uploaded_by IS '上傳者';

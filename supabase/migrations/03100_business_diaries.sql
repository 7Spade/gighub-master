-- ============================================================================
-- Migration: 03100_business_diaries.sql
-- Layer: Business Modules (業務層)
-- Module: Diaries (施工日誌)
-- Description: 施工日誌模組 - 記錄每日施工情況
--
-- Features:
--   - Daily work diary with weather tracking (每日工作日誌與天氣追蹤)
--   - Diary attachments for photos/documents (日誌附件)
--   - Work item entries (工項記錄)
--   - Approval workflow support (審核流程支援)
--
-- Dependencies:
--   - blueprints table (02000)
--   - accounts table (01000)
--   - blueprint_members table (02001)
--   - tasks table (03000)
--
-- Based on GigHub Architecture:
--   - Three-layer architecture (Foundation/Container/Business)
--   - Blueprint as logical container
--   - RLS with helper functions pattern
-- ============================================================================

-- ============================================================================
-- 1. Enums (枚舉類型)
-- ============================================================================

-- 日誌狀態
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'diary_status') THEN
    CREATE TYPE diary_status AS ENUM (
      'draft',        -- 草稿
      'submitted',    -- 已提交
      'reviewing',    -- 審核中
      'approved',     -- 已核准
      'rejected',     -- 已駁回
      'archived'      -- 已歸檔
    );
  END IF;
END $$;

-- 工項類型
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_item_type') THEN
    CREATE TYPE work_item_type AS ENUM (
      'construction', -- 施工
      'inspection',   -- 檢查
      'delivery',     -- 進料
      'equipment',    -- 機具
      'safety',       -- 安全
      'meeting',      -- 會議
      'other'         -- 其他
    );
  END IF;
END $$;

-- ============================================================================
-- 2. Table Definitions (資料表定義)
-- ============================================================================

-- 施工日誌表
CREATE TABLE IF NOT EXISTS diaries (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 藍圖關聯
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  
  -- 日期資訊
  work_date DATE NOT NULL,
  
  -- 天氣資訊
  weather weather_type,
  temperature_min INTEGER,
  temperature_max INTEGER,
  
  -- 工作資訊
  work_hours DECIMAL(4,2),
  worker_count INTEGER,
  
  -- 內容
  summary TEXT,
  notes TEXT,
  
  -- 狀態
  status diary_status DEFAULT 'draft' NOT NULL,
  
  -- 審核資訊
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Add unique constraint (uses DO block for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uq_diary_blueprint_date'
  ) THEN
    ALTER TABLE diaries ADD CONSTRAINT uq_diary_blueprint_date UNIQUE (blueprint_id, work_date);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 日誌附件表
CREATE TABLE IF NOT EXISTS diary_attachments (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 日誌關聯
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  
  -- 檔案資訊
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  
  -- 上傳者
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 日誌工項表
CREATE TABLE IF NOT EXISTS diary_entries (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 日誌關聯
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  
  -- 工項內容
  type work_item_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2),
  unit TEXT,
  
  -- 任務關聯 (可選)
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- 排序
  sort_order INTEGER DEFAULT 0,
  
  -- 備註
  notes TEXT,
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 3. Indexes (索引)
-- ============================================================================

-- 日誌查詢
CREATE INDEX IF NOT EXISTS idx_diaries_blueprint_id ON diaries(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_diaries_work_date ON diaries(work_date DESC);
CREATE INDEX IF NOT EXISTS idx_diaries_status ON diaries(status);
CREATE INDEX IF NOT EXISTS idx_diaries_created_by ON diaries(created_by);

-- 複合索引
CREATE INDEX IF NOT EXISTS idx_diaries_blueprint_date ON diaries(blueprint_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_diaries_blueprint_status ON diaries(blueprint_id, status);

-- 軟刪除過濾
CREATE INDEX IF NOT EXISTS idx_diaries_not_deleted ON diaries(blueprint_id, work_date) WHERE deleted_at IS NULL;

-- 附件查詢
CREATE INDEX IF NOT EXISTS idx_diary_attachments_diary_id ON diary_attachments(diary_id);

-- 工項查詢
CREATE INDEX IF NOT EXISTS idx_diary_entries_diary_id ON diary_entries(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_task_id ON diary_entries(task_id) WHERE task_id IS NOT NULL;

-- ============================================================================
-- 4. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS diaries_select_policy ON diaries;
DROP POLICY IF EXISTS diaries_insert_policy ON diaries;
DROP POLICY IF EXISTS diaries_update_policy ON diaries;
DROP POLICY IF EXISTS diaries_delete_policy ON diaries;

DROP POLICY IF EXISTS diary_attachments_select_policy ON diary_attachments;
DROP POLICY IF EXISTS diary_attachments_insert_policy ON diary_attachments;
DROP POLICY IF EXISTS diary_attachments_delete_policy ON diary_attachments;

DROP POLICY IF EXISTS diary_entries_select_policy ON diary_entries;
DROP POLICY IF EXISTS diary_entries_insert_policy ON diary_entries;
DROP POLICY IF EXISTS diary_entries_update_policy ON diary_entries;
DROP POLICY IF EXISTS diary_entries_delete_policy ON diary_entries;

-- 日誌查看權限
CREATE POLICY diaries_select_policy ON diaries
  FOR SELECT
  TO authenticated
  USING (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

-- 日誌建立權限
CREATE POLICY diaries_insert_policy ON diaries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
  );

-- 日誌更新權限 (只能更新草稿或已駁回的日誌)
CREATE POLICY diaries_update_policy ON diaries
  FOR UPDATE
  TO authenticated
  USING (
    blueprint_id IN (
      SELECT blueprint_id FROM blueprint_members WHERE account_id = (SELECT auth.uid())
    )
    AND (status = 'draft' OR status = 'rejected' OR created_by = (SELECT auth.uid()))
  );

-- 日誌刪除權限 (只能刪除自己建立的草稿)
CREATE POLICY diaries_delete_policy ON diaries
  FOR DELETE
  TO authenticated
  USING (
    created_by = (SELECT auth.uid()) AND status = 'draft'
  );

-- 附件查看權限
CREATE POLICY diary_attachments_select_policy ON diary_attachments
  FOR SELECT
  TO authenticated
  USING (
    diary_id IN (
      SELECT d.id FROM diaries d
      JOIN blueprint_members bm ON d.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

-- 附件建立權限
CREATE POLICY diary_attachments_insert_policy ON diary_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    diary_id IN (
      SELECT d.id FROM diaries d
      JOIN blueprint_members bm ON d.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

-- 附件刪除權限
CREATE POLICY diary_attachments_delete_policy ON diary_attachments
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = (SELECT auth.uid())
    OR diary_id IN (
      SELECT d.id FROM diaries d WHERE d.created_by = (SELECT auth.uid())
    )
  );

-- 工項查看權限
CREATE POLICY diary_entries_select_policy ON diary_entries
  FOR SELECT
  TO authenticated
  USING (
    diary_id IN (
      SELECT d.id FROM diaries d
      JOIN blueprint_members bm ON d.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

-- 工項建立權限
CREATE POLICY diary_entries_insert_policy ON diary_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    diary_id IN (
      SELECT d.id FROM diaries d
      JOIN blueprint_members bm ON d.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
    )
  );

-- 工項更新權限
CREATE POLICY diary_entries_update_policy ON diary_entries
  FOR UPDATE
  TO authenticated
  USING (
    diary_id IN (
      SELECT d.id FROM diaries d
      JOIN blueprint_members bm ON d.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (SELECT auth.uid())
      AND (d.status = 'draft' OR d.status = 'rejected')
    )
  );

-- 工項刪除權限
CREATE POLICY diary_entries_delete_policy ON diary_entries
  FOR DELETE
  TO authenticated
  USING (
    diary_id IN (
      SELECT d.id FROM diaries d WHERE d.created_by = (SELECT auth.uid()) AND d.status = 'draft'
    )
  );

-- ============================================================================
-- 5. Triggers (觸發器)
-- ============================================================================

-- 更新時間觸發器函數
CREATE OR REPLACE FUNCTION update_diary_updated_at()
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

-- Drop existing triggers for idempotency
DROP TRIGGER IF EXISTS trg_diaries_updated_at ON diaries;
DROP TRIGGER IF EXISTS trg_diary_entries_updated_at ON diary_entries;

-- Recreate triggers
CREATE TRIGGER trg_diaries_updated_at
  BEFORE UPDATE ON diaries
  FOR EACH ROW
  EXECUTE FUNCTION update_diary_updated_at();

CREATE TRIGGER trg_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_diary_updated_at();

-- ============================================================================
-- 6. Comments (文件註解)
-- ============================================================================

COMMENT ON TABLE diaries IS '施工日誌表 - 記錄每日施工情況';
COMMENT ON COLUMN diaries.id IS '唯一識別碼';
COMMENT ON COLUMN diaries.blueprint_id IS '所屬藍圖';
COMMENT ON COLUMN diaries.work_date IS '工作日期';
COMMENT ON COLUMN diaries.weather IS '天氣狀況';
COMMENT ON COLUMN diaries.temperature_min IS '最低溫度 (°C)';
COMMENT ON COLUMN diaries.temperature_max IS '最高溫度 (°C)';
COMMENT ON COLUMN diaries.work_hours IS '工作時數';
COMMENT ON COLUMN diaries.worker_count IS '出工人數';
COMMENT ON COLUMN diaries.summary IS '工作摘要';
COMMENT ON COLUMN diaries.notes IS '備註';
COMMENT ON COLUMN diaries.status IS '審核狀態';
COMMENT ON COLUMN diaries.created_by IS '建立者';
COMMENT ON COLUMN diaries.approved_by IS '核准者';
COMMENT ON COLUMN diaries.approved_at IS '核准時間';

COMMENT ON TABLE diary_attachments IS '日誌附件表 - 存放日誌相關圖片和文件';
COMMENT ON TABLE diary_entries IS '日誌工項表 - 記錄每日工作項目';

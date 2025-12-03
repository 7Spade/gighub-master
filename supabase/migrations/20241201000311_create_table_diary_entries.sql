-- ============================================================================
-- Migration: Create Diary Entries Table
-- Description: 日誌工項表 - 記錄每日工作項目詳情
-- Created: 2024-12-01
-- Source: backup/migrations_diaries.sql
-- ============================================================================

-- 工項類型 (如果不存在)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_item_type') THEN
    CREATE TYPE work_item_type AS ENUM (
      'construction',    -- 施工
      'material',        -- 材料
      'equipment',       -- 設備
      'labor',           -- 人工
      'inspection',      -- 檢查
      'safety',          -- 安全
      'quality',         -- 品質
      'meeting',         -- 會議
      'other'            -- 其他
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Table: diary_entries (日誌工項)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  type work_item_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2),
  unit TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diary_entries_diary_id ON diary_entries(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_task_id ON diary_entries(task_id) WHERE task_id IS NOT NULL;

-- Enable RLS
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS diary_entries_select_policy ON diary_entries;
DROP POLICY IF EXISTS diary_entries_insert_policy ON diary_entries;
DROP POLICY IF EXISTS diary_entries_update_policy ON diary_entries;
DROP POLICY IF EXISTS diary_entries_delete_policy ON diary_entries;

CREATE POLICY diary_entries_select_policy ON diary_entries
  FOR SELECT
  TO authenticated
  USING (
    diary_id IN (
      SELECT d.id FROM diaries d
      JOIN blueprint_members bm ON d.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (select auth.uid())
    )
  );

CREATE POLICY diary_entries_insert_policy ON diary_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    diary_id IN (
      SELECT d.id FROM diaries d
      JOIN blueprint_members bm ON d.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (select auth.uid())
    )
  );

CREATE POLICY diary_entries_update_policy ON diary_entries
  FOR UPDATE
  TO authenticated
  USING (
    diary_id IN (
      SELECT d.id FROM diaries d
      JOIN blueprint_members bm ON d.blueprint_id = bm.blueprint_id
      WHERE bm.account_id = (select auth.uid())
      AND (d.status = 'draft' OR d.status = 'rejected')
    )
  );

CREATE POLICY diary_entries_delete_policy ON diary_entries
  FOR DELETE
  TO authenticated
  USING (
    diary_id IN (
      SELECT d.id FROM diaries d WHERE d.created_by = (select auth.uid()) AND d.status = 'draft'
    )
  );

-- Note: Trigger for updated_at is defined in 20241201000500_create_triggers.sql
-- to maintain proper migration dependency order

-- Comments
COMMENT ON TABLE diary_entries IS '日誌工項表 - 記錄每日工作項目詳情';
COMMENT ON COLUMN diary_entries.type IS '工項類型';
COMMENT ON COLUMN diary_entries.title IS '工項標題';
COMMENT ON COLUMN diary_entries.description IS '工項描述';
COMMENT ON COLUMN diary_entries.quantity IS '數量';
COMMENT ON COLUMN diary_entries.unit IS '單位';
COMMENT ON COLUMN diary_entries.task_id IS '關聯任務 (可選)';
COMMENT ON COLUMN diary_entries.sort_order IS '排序順序';

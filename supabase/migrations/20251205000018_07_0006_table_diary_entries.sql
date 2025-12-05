-- ============================================================================
-- Migration: 07-0006 - Table: diary_entries
-- Description: 日誌工項表
-- Category: 07 - Module Tables
-- ============================================================================

CREATE TABLE diary_entries (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_diary_entries_diary ON diary_entries(diary_id);
CREATE INDEX idx_diary_entries_task ON diary_entries(task_id) WHERE task_id IS NOT NULL;

-- Enable RLS
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

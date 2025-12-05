-- ============================================================================
-- Migration: Create Diary Attachments Table
-- Description: 施工日誌附件表
-- Created: 2024-12-01
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: diary_attachments (施工日誌附件)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diary_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diary_attachments_diary ON diary_attachments(diary_id);

-- Enable RLS
ALTER TABLE diary_attachments ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON TABLE diary_attachments IS '日誌附件表 - 存放日誌相關圖片和文件';
COMMENT ON COLUMN diary_attachments.id IS '唯一識別碼';
COMMENT ON COLUMN diary_attachments.diary_id IS '所屬日誌';
COMMENT ON COLUMN diary_attachments.file_name IS '檔案名稱';
COMMENT ON COLUMN diary_attachments.file_path IS '檔案路徑';
COMMENT ON COLUMN diary_attachments.file_size IS '檔案大小';
COMMENT ON COLUMN diary_attachments.mime_type IS '檔案類型';
COMMENT ON COLUMN diary_attachments.caption IS '說明文字';
COMMENT ON COLUMN diary_attachments.uploaded_by IS '上傳者';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS diary_attachments CASCADE;

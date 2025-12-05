-- ============================================================================
-- Migration: 07-0005 - Table: diary_attachments
-- Description: 日誌附件表
-- Category: 07 - Module Tables
-- ============================================================================

CREATE TABLE diary_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_diary_attachments_diary ON diary_attachments(diary_id);

-- Enable RLS
ALTER TABLE diary_attachments ENABLE ROW LEVEL SECURITY;

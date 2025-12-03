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

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS diary_attachments CASCADE;

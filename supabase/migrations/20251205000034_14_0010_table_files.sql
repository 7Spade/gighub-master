-- ============================================================================
-- Migration: 14-0010 - Table: files
-- Description: 檔案管理
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  status file_status NOT NULL DEFAULT 'uploading',
  storage_key TEXT,
  parent_id UUID REFERENCES files(id) ON DELETE CASCADE,
  is_folder BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_files_blueprint ON files(blueprint_id);
CREATE INDEX idx_files_parent ON files(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_files_status ON files(status);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration: 17-0010 - Table: acceptance_attachments
-- Description: 驗收附件表
-- Category: 17 - Business Extensions (Acceptance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS acceptance_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acceptance_id UUID NOT NULL REFERENCES acceptances(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_acceptance_attachments_acceptance ON acceptance_attachments(acceptance_id);

-- Enable RLS
ALTER TABLE acceptance_attachments ENABLE ROW LEVEL SECURITY;

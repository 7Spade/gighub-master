-- ============================================================================
-- Migration: 17-0014 - Table: problem_attachments
-- Description: 問題附件表
-- Category: 17 - Business Extensions (Problem)
-- ============================================================================

CREATE TABLE IF NOT EXISTS problem_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_problem_attachments_problem ON problem_attachments(problem_id);

-- Enable RLS
ALTER TABLE problem_attachments ENABLE ROW LEVEL SECURITY;

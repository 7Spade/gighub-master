-- ============================================================================
-- Migration: 07-0011 - Table: issue_comments
-- Description: 問題評論表
-- Category: 07 - Module Tables
-- ============================================================================

CREATE TABLE issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_issue_comments_issue ON issue_comments(issue_id);

-- Enable RLS
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration: Create Issue Comments Table
-- Description: 問題評論表
-- Created: 2024-12-01
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: issue_comments (問題評論)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON issue_comments(issue_id);

-- Enable RLS
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS issue_comments CASCADE;

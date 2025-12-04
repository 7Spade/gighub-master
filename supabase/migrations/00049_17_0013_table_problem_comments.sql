-- ============================================================================
-- Migration: 17-0013 - Table: problem_comments
-- Description: 問題評論表
-- Category: 17 - Business Extensions (Problem)
-- ============================================================================

CREATE TABLE IF NOT EXISTS problem_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_problem_comments_problem ON problem_comments(problem_id);

-- Enable RLS
ALTER TABLE problem_comments ENABLE ROW LEVEL SECURITY;

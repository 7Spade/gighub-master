-- ============================================================================
-- Migration: 17-0009 - Table: acceptance_approvals
-- Description: 驗收審核表
-- Category: 17 - Business Extensions (Acceptance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS acceptance_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acceptance_id UUID NOT NULL REFERENCES acceptances(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  decision acceptance_decision DEFAULT 'pending' NOT NULL,
  comments TEXT,
  approved_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_acceptance_approvals_acceptance ON acceptance_approvals(acceptance_id);
CREATE INDEX IF NOT EXISTS idx_acceptance_approvals_approver ON acceptance_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_acceptance_approvals_decision ON acceptance_approvals(decision);

-- Enable RLS
ALTER TABLE acceptance_approvals ENABLE ROW LEVEL SECURITY;

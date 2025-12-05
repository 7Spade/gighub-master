-- ============================================================================
-- Migration: 14-0011 - Table: file_shares
-- Description: 檔案分享
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL DEFAULT 'view',
  shared_by UUID REFERENCES accounts(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT file_shares_unique UNIQUE (file_id, shared_with)
);

-- Indexes
CREATE INDEX idx_file_shares_file ON file_shares(file_id);
CREATE INDEX idx_file_shares_shared_with ON file_shares(shared_with);

-- Enable RLS
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

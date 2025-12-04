-- ============================================================================
-- Migration: 04-0001 - Table: accounts
-- Description: 帳號表 - 基礎層核心表
-- Category: 04 - Foundation Tables
-- ============================================================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  type account_type NOT NULL DEFAULT 'user',
  status account_status NOT NULL DEFAULT 'active',
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  avatar TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_accounts_auth_user_id ON accounts(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_email ON accounts(email) WHERE email IS NOT NULL;

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

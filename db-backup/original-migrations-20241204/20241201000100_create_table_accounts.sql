-- ============================================================================
-- Migration: Create Accounts Table
-- Description: 帳戶表 - 核心用戶實體
-- Created: 2024-12-01
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: accounts (帳號)
-- 統一帳號表，包含 user, org, bot 三種類型
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,                              -- 連結 auth.users (僅 user 類型需要)
  type account_type NOT NULL DEFAULT 'user',
  status account_status NOT NULL DEFAULT 'active',
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  avatar TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT accounts_email_unique UNIQUE (email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_auth_user_id ON accounts(auth_user_id);

-- user 類型的 auth_user_id 必須唯一
CREATE UNIQUE INDEX IF NOT EXISTS accounts_auth_user_id_unique_user_only 
ON accounts (auth_user_id) 
WHERE type = 'user' AND auth_user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS accounts CASCADE;

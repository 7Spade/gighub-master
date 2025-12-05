-- ============================================================================
-- Migration: 17-0001 - Table: contracts
-- Description: 合約表
-- Category: 17 - Business Extensions (Financial)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  vendor_name TEXT,
  contract_number VARCHAR(100),
  contract_amount NUMERIC(18,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'TWD',
  start_date DATE,
  end_date DATE,
  description TEXT,
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_blueprint ON contracts(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_contracts_lifecycle ON contracts(lifecycle);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration: 17-0003 - Table: payment_requests
-- Description: 請款單表
-- Category: 17 - Business Extensions (Financial)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  request_number VARCHAR(100),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  amount NUMERIC(18,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'TWD',
  request_date DATE NOT NULL,
  due_date DATE,
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_requests_blueprint ON payment_requests(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_contract ON payment_requests(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_requests_lifecycle ON payment_requests(lifecycle);

-- Enable RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

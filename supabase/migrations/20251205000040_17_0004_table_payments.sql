-- ============================================================================
-- Migration: 17-0004 - Table: payments
-- Description: 付款記錄表
-- Category: 17 - Business Extensions (Financial)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  payment_request_id UUID REFERENCES payment_requests(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  payment_number VARCHAR(100),
  amount NUMERIC(18,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'TWD',
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  reference_number TEXT,
  notes TEXT,
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_blueprint ON payments(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_request ON payments(payment_request_id) WHERE payment_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_contract ON payments(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

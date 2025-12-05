-- ============================================================================
-- Migration: 17-0002 - Table: expenses
-- Description: 費用表
-- Category: 17 - Business Extensions (Financial)
-- ============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  amount NUMERIC(18,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'TWD',
  expense_date DATE NOT NULL,
  category VARCHAR(100),
  receipt_url TEXT,
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_blueprint ON expenses(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_expenses_contract ON expenses(contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

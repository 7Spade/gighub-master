-- ============================================================================
-- Migration: 17-0008 - Table: acceptances
-- Description: 驗收表
-- Category: 17 - Business Extensions (Acceptance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  qc_inspection_id UUID REFERENCES qc_inspections(id) ON DELETE SET NULL,
  acceptance_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  acceptance_type acceptance_type DEFAULT 'phase' NOT NULL,
  status acceptance_status DEFAULT 'pending' NOT NULL,
  scheduled_date DATE,
  actual_date TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  metadata JSONB,
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_acceptances_blueprint ON acceptances(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_acceptances_task ON acceptances(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_acceptances_status ON acceptances(status);

-- Enable RLS
ALTER TABLE acceptances ENABLE ROW LEVEL SECURITY;

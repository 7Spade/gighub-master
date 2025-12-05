-- ============================================================================
-- Migration: 17-0005 - Table: qc_inspections
-- Description: 品管檢查表
-- Category: 17 - Business Extensions (QC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS qc_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  diary_id UUID REFERENCES diaries(id) ON DELETE SET NULL,
  inspection_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  inspection_type qc_inspection_type DEFAULT 'self_check' NOT NULL,
  status qc_inspection_status DEFAULT 'pending' NOT NULL,
  passed_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  pass_rate DECIMAL(5,2) DEFAULT 0,
  inspector_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  scheduled_date DATE,
  inspection_date TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  findings TEXT,
  recommendations TEXT,
  metadata JSONB,
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qc_inspections_blueprint ON qc_inspections(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_qc_inspections_task ON qc_inspections(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qc_inspections_status ON qc_inspections(status);

-- Enable RLS
ALTER TABLE qc_inspections ENABLE ROW LEVEL SECURITY;

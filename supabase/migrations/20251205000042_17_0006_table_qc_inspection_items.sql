-- ============================================================================
-- Migration: 17-0006 - Table: qc_inspection_items
-- Description: 品管檢查項目表
-- Category: 17 - Business Extensions (QC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS qc_inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES qc_inspections(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  standard TEXT,
  status qc_item_status DEFAULT 'pending' NOT NULL,
  actual_value TEXT,
  notes TEXT,
  checked_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qc_inspection_items_inspection ON qc_inspection_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_qc_inspection_items_status ON qc_inspection_items(status);

-- Enable RLS
ALTER TABLE qc_inspection_items ENABLE ROW LEVEL SECURITY;

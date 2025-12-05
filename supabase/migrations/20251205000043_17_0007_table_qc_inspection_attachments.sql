-- ============================================================================
-- Migration: 17-0007 - Table: qc_inspection_attachments
-- Description: 品管檢查附件表
-- Category: 17 - Business Extensions (QC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS qc_inspection_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES qc_inspections(id) ON DELETE CASCADE,
  item_id UUID REFERENCES qc_inspection_items(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qc_inspection_attachments_inspection ON qc_inspection_attachments(inspection_id);
CREATE INDEX IF NOT EXISTS idx_qc_inspection_attachments_item ON qc_inspection_attachments(item_id) WHERE item_id IS NOT NULL;

-- Enable RLS
ALTER TABLE qc_inspection_attachments ENABLE ROW LEVEL SECURITY;

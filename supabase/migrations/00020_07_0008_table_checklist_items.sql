-- ============================================================================
-- Migration: 07-0008 - Table: checklist_items
-- Description: 檢查清單項目表
-- Category: 07 - Module Tables
-- ============================================================================

CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  checked_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);

-- Enable RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

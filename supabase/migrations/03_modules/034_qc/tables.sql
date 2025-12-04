-- ============================================================================
-- Migration: 034_qc/tables
-- Layer: 03_modules
-- Description: 品管模組 (Quality Control) - 表結構定義
-- Dependencies: 02_workspace/020_blueprints, 030_tasks, 031_diary
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: qc_inspections (品管檢查)
-- ----------------------------------------------------------------------------
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_qc_inspections_blueprint_id ON qc_inspections(blueprint_id);
CREATE INDEX idx_qc_inspections_task_id ON qc_inspections(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_qc_inspections_status ON qc_inspections(status);
CREATE INDEX idx_qc_inspections_type ON qc_inspections(inspection_type);
CREATE INDEX idx_qc_inspections_scheduled_date ON qc_inspections(scheduled_date);
CREATE INDEX idx_qc_inspections_not_deleted ON qc_inspections(blueprint_id, status) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE qc_inspections ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: qc_inspection_items (品管檢查項目)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qc_inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES qc_inspections(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  standard TEXT,
  status qc_item_status DEFAULT 'pending' NOT NULL,
  actual_value TEXT,
  expected_value TEXT,
  deviation TEXT,
  score DECIMAL(5,2),
  weight DECIMAL(5,2) DEFAULT 1.0,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  checked_at TIMESTAMPTZ,
  checked_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_qc_inspection_items_inspection_id ON qc_inspection_items(inspection_id);
CREATE INDEX idx_qc_inspection_items_status ON qc_inspection_items(status);

-- Enable RLS
ALTER TABLE qc_inspection_items ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: qc_inspection_attachments (品管附件)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qc_inspection_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES qc_inspections(id) ON DELETE CASCADE,
  item_id UUID REFERENCES qc_inspection_items(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT qc_attachment_relation CHECK (inspection_id IS NOT NULL OR item_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_qc_inspection_attachments_inspection_id ON qc_inspection_attachments(inspection_id) WHERE inspection_id IS NOT NULL;
CREATE INDEX idx_qc_inspection_attachments_item_id ON qc_inspection_attachments(item_id) WHERE item_id IS NOT NULL;

-- Enable RLS
ALTER TABLE qc_inspection_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE qc_inspections IS '品管檢查表 - 記錄品質控制檢查';
COMMENT ON TABLE qc_inspection_items IS '品管檢查項目表 - 記錄檢查項目詳情';
COMMENT ON TABLE qc_inspection_attachments IS '品管檢查附件表 - 存放檢查相關圖片和文件';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS qc_inspection_attachments CASCADE;
-- DROP TABLE IF EXISTS qc_inspection_items CASCADE;
-- DROP TABLE IF EXISTS qc_inspections CASCADE;

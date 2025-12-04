-- ============================================================================
-- Migration: 031_diary/tables
-- Layer: 03_modules
-- Description: 施工日誌模組 - 表結構定義
-- Dependencies: 02_workspace/020_blueprints
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: diaries (施工日誌)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  weather weather_type,
  temperature_min DECIMAL(4,1),
  temperature_max DECIMAL(4,1),
  work_hours DECIMAL(4,1),
  worker_count INTEGER DEFAULT 0,
  summary TEXT,
  work_content TEXT,
  issues TEXT,
  notes TEXT,
  workers_count INTEGER DEFAULT 0,
  equipment_used TEXT[],
  materials_used JSONB DEFAULT '[]'::jsonb,
  is_holiday BOOLEAN DEFAULT false,
  status diary_status DEFAULT 'draft' NOT NULL,
  approved_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  is_submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES accounts(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT diaries_blueprint_date_unique UNIQUE (blueprint_id, work_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diaries_blueprint ON diaries(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_diaries_work_date ON diaries(work_date);
CREATE INDEX IF NOT EXISTS idx_diaries_status ON diaries(status);
CREATE INDEX IF NOT EXISTS idx_diaries_created_by ON diaries(created_by);
CREATE INDEX IF NOT EXISTS idx_diaries_blueprint_status ON diaries(blueprint_id, status);
CREATE INDEX IF NOT EXISTS idx_diaries_not_deleted ON diaries(blueprint_id, work_date) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: diary_attachments (日誌附件)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diary_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  caption TEXT,
  attachment_type TEXT DEFAULT 'photo',
  uploaded_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diary_attachments_diary ON diary_attachments(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_attachments_type ON diary_attachments(attachment_type);

-- Enable RLS
ALTER TABLE diary_attachments ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table: diary_entries (日誌工作項目條目)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  entry_type TEXT DEFAULT 'work',
  title TEXT,
  description TEXT,
  quantity DECIMAL(10,2),
  unit TEXT,
  location TEXT,
  workers_assigned INTEGER DEFAULT 0,
  hours_spent DECIMAL(4,1),
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diary_entries_diary ON diary_entries(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_task ON diary_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_type ON diary_entries(entry_type);

-- Enable RLS
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE diaries IS '施工日誌表 - 記錄每日施工情況';
COMMENT ON TABLE diary_attachments IS '日誌附件表 - 照片和文件';
COMMENT ON TABLE diary_entries IS '日誌工作項目條目 - 記錄具體工作內容';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS diary_entries CASCADE;
-- DROP TABLE IF EXISTS diary_attachments CASCADE;
-- DROP TABLE IF EXISTS diaries CASCADE;

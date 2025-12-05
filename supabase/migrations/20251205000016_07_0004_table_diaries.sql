-- ============================================================================
-- Migration: 07-0004 - Table: diaries
-- Description: 施工日誌表
-- Category: 07 - Module Tables
-- ============================================================================

CREATE TABLE diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  weather weather_type,
  temperature_min DECIMAL(5,2),
  temperature_max DECIMAL(5,2),
  work_hours DECIMAL(5,2),
  worker_count INTEGER DEFAULT 0,
  summary TEXT,
  work_content TEXT,
  issues TEXT,
  notes TEXT,
  workers_count INTEGER DEFAULT 0,
  equipment_used TEXT[],
  materials_used JSONB DEFAULT '[]'::jsonb,
  is_holiday BOOLEAN DEFAULT false,
  status diary_status NOT NULL DEFAULT 'draft',
  approved_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  is_submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT diaries_unique_date UNIQUE (blueprint_id, work_date)
);

-- Indexes
CREATE INDEX idx_diaries_blueprint ON diaries(blueprint_id);
CREATE INDEX idx_diaries_work_date ON diaries(work_date);
CREATE INDEX idx_diaries_status ON diaries(status);

-- Enable RLS
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

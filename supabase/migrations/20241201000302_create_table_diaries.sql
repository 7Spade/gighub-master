-- ============================================================================
-- Migration: Create Diaries Table
-- Description: 施工日誌表
-- Created: 2024-12-01
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
  work_content TEXT,
  issues TEXT,
  notes TEXT,
  workers_count INTEGER DEFAULT 0,
  equipment_used TEXT[],
  materials_used JSONB DEFAULT '[]'::jsonb,
  is_holiday BOOLEAN DEFAULT false,
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

-- Enable RLS
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS diaries CASCADE;

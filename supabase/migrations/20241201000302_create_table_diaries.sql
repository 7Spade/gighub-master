-- ============================================================================
-- Migration: Create Diaries Table
-- Description: 施工日誌表
-- Created: 2024-12-01
-- Source: backup/migrations_diaries.sql
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
  
  -- 審核狀態 (使用 diary_status enum)
  status diary_status DEFAULT 'draft' NOT NULL,
  
  -- 審核資訊
  approved_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  
  -- 提交資訊 (兼容舊版)
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

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TABLE IF EXISTS diaries CASCADE;

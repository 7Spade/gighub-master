-- ============================================================================
-- Migration: 14-0006 - Table: custom_field_definitions
-- Description: 自定義欄位定義
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  field_type custom_field_type NOT NULL,
  options JSONB DEFAULT '{}'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT custom_field_definitions_unique UNIQUE (blueprint_id, entity_type, name)
);

-- Indexes
CREATE INDEX idx_custom_field_definitions_blueprint ON custom_field_definitions(blueprint_id);
CREATE INDEX idx_custom_field_definitions_entity_type ON custom_field_definitions(entity_type);

-- Enable RLS
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;

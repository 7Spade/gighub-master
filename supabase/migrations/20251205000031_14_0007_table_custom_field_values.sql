-- ============================================================================
-- Migration: 14-0007 - Table: custom_field_values
-- Description: 自定義欄位值
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT custom_field_values_unique UNIQUE (definition_id, entity_id)
);

-- Indexes
CREATE INDEX idx_custom_field_values_definition ON custom_field_values(definition_id);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);

-- Enable RLS
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

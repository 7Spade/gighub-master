-- ============================================================================
-- Migration: 14-0005 - Table: entity_references
-- Description: 實體引用
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE entity_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  source_type entity_type NOT NULL,
  source_id UUID NOT NULL,
  target_type entity_type NOT NULL,
  target_id UUID NOT NULL,
  reference_type reference_type NOT NULL DEFAULT 'related',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_entity_references_blueprint ON entity_references(blueprint_id);
CREATE INDEX idx_entity_references_source ON entity_references(source_type, source_id);
CREATE INDEX idx_entity_references_target ON entity_references(target_type, target_id);

-- Enable RLS
ALTER TABLE entity_references ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration: 14-0008 - Table: lifecycle_transitions
-- Description: 生命週期轉換
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE lifecycle_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  from_state VARCHAR(100),
  to_state VARCHAR(100) NOT NULL,
  reason TEXT,
  actor_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_lifecycle_transitions_blueprint ON lifecycle_transitions(blueprint_id);
CREATE INDEX idx_lifecycle_transitions_entity ON lifecycle_transitions(entity_type, entity_id);
CREATE INDEX idx_lifecycle_transitions_created_at ON lifecycle_transitions(created_at DESC);

-- Enable RLS
ALTER TABLE lifecycle_transitions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Migration: 14-0009 - Table: search_index
-- Description: 搜尋索引
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT search_index_unique UNIQUE (entity_type, entity_id)
);

-- Indexes
CREATE INDEX idx_search_index_blueprint ON search_index(blueprint_id);
CREATE INDEX idx_search_index_entity ON search_index(entity_type, entity_id);
CREATE INDEX idx_search_index_vector ON search_index USING GIN (search_vector);
CREATE INDEX idx_search_index_tags ON search_index USING GIN (tags);

-- Enable RLS
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

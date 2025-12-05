-- ============================================================================
-- Migration: 14-0003 - Table: events
-- Description: 事件系統
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status event_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_events_blueprint ON events(blueprint_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_scheduled ON events(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

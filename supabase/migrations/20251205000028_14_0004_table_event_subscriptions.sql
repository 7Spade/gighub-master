-- ============================================================================
-- Migration: 14-0004 - Table: event_subscriptions
-- Description: 事件訂閱
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  entity_type entity_type,
  entity_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_event_subscriptions_blueprint ON event_subscriptions(blueprint_id);
CREATE INDEX idx_event_subscriptions_account ON event_subscriptions(account_id);
CREATE INDEX idx_event_subscriptions_event_type ON event_subscriptions(event_type);

-- Enable RLS
ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;

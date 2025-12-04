-- ============================================================================
-- Migration: 14-0012 - Table: notification_preferences
-- Description: 通知偏好設定
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT notification_preferences_unique UNIQUE (account_id, blueprint_id, notification_type, channel)
);

-- Indexes
CREATE INDEX idx_notification_preferences_account ON notification_preferences(account_id);
CREATE INDEX idx_notification_preferences_blueprint ON notification_preferences(blueprint_id) WHERE blueprint_id IS NOT NULL;

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

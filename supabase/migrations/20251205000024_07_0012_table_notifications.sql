-- ============================================================================
-- Migration: 07-0012 - Table: notifications
-- Description: 通知表
-- Category: 07 - Module Tables
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notifications_account ON notifications(account_id);
CREATE INDEX idx_notifications_blueprint ON notifications(blueprint_id) WHERE blueprint_id IS NOT NULL;
CREATE INDEX idx_notifications_unread ON notifications(account_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

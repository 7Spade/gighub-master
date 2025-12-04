-- ============================================================================
-- Migration: 14-0001 - Table: blueprint_configs
-- Description: 藍圖配置中心
-- Category: 14 - Container Infrastructure
-- ============================================================================

CREATE TABLE blueprint_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  config_type blueprint_config_type NOT NULL DEFAULT 'general',
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT blueprint_configs_unique UNIQUE (blueprint_id, config_type, key)
);

-- Indexes
CREATE INDEX idx_blueprint_configs_blueprint ON blueprint_configs(blueprint_id);
CREATE INDEX idx_blueprint_configs_type ON blueprint_configs(config_type);

-- Enable RLS
ALTER TABLE blueprint_configs ENABLE ROW LEVEL SECURITY;

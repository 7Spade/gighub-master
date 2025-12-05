-- ============================================================================
-- Migration: 06-0002 - Table: blueprint_roles
-- Description: 藍圖角色定義表
-- Category: 06 - Blueprint Tables
-- ============================================================================

CREATE TABLE blueprint_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  business_role blueprint_business_role NOT NULL DEFAULT 'observer',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT blueprint_roles_unique UNIQUE (blueprint_id, name)
);

-- Indexes
CREATE INDEX idx_blueprint_roles_blueprint ON blueprint_roles(blueprint_id);
CREATE INDEX idx_blueprint_roles_business_role ON blueprint_roles(business_role);

-- Enable RLS
ALTER TABLE blueprint_roles ENABLE ROW LEVEL SECURITY;

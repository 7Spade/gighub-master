-- ============================================================================
-- Migration: Add Core Modules to module_type Enum
-- Description: 添加核心模組到 module_type 枚舉
-- Created: 2025-12-08
-- ============================================================================
-- 
-- Purpose:
-- This migration adds missing core modules to the module_type enum:
-- - 'financial': 財務管理模組
-- - 'acceptance': 品質驗收模組  
-- - 'audit_log': 操作紀錄模組 (內建模組)
--
-- Note: Core modules (isCore: true) are built-in and always enabled.
-- Optional modules (isCore: false) can be selected by users.
--
-- Affected Tables:
-- - blueprints (enabled_modules column)
-- ============================================================================

-- Add new module types to the enum
-- Note: PostgreSQL doesn't support dropping enum values, only adding
DO $$ 
BEGIN
  -- Add 'financial' if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'financial' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'module_type')
  ) THEN
    ALTER TYPE module_type ADD VALUE 'financial';
  END IF;

  -- Add 'acceptance' if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'acceptance' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'module_type')
  ) THEN
    ALTER TYPE module_type ADD VALUE 'acceptance';
  END IF;

  -- Add 'audit_log' if not exists (核心內建模組)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'audit_log' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'module_type')
  ) THEN
    ALTER TYPE module_type ADD VALUE 'audit_log';
  END IF;
END $$;

-- Update existing blueprints to include core modules
-- This ensures backward compatibility with existing blueprints
DO $$
DECLARE
  blueprint_record RECORD;
  core_modules module_type[] := ARRAY['tasks', 'diary', 'checklists', 'issues', 'files', 'financial', 'audit_log']::module_type[];
  updated_modules module_type[];
BEGIN
  -- Iterate through all blueprints
  FOR blueprint_record IN 
    SELECT id, enabled_modules 
    FROM blueprints 
    WHERE enabled_modules IS NOT NULL
  LOOP
    -- Merge existing modules with core modules (removing duplicates)
    updated_modules := ARRAY(
      SELECT DISTINCT unnest(blueprint_record.enabled_modules || core_modules)
    );
    
    -- Update the blueprint with merged modules
    UPDATE blueprints 
    SET enabled_modules = updated_modules,
        updated_at = NOW()
    WHERE id = blueprint_record.id;
  END LOOP;
  
  -- Handle blueprints with NULL enabled_modules
  UPDATE blueprints
  SET enabled_modules = core_modules,
      updated_at = NOW()
  WHERE enabled_modules IS NULL;
  
  RAISE NOTICE 'Updated % blueprints with core modules', (SELECT COUNT(*) FROM blueprints);
END $$;

-- Add comment to document the change
COMMENT ON TYPE module_type IS 
'Blueprint module types. Core modules (tasks, diary, checklists, issues, files, financial, audit_log) are built-in and always enabled. Optional modules (acceptance) can be selected by users.';

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify the migration:
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'module_type') ORDER BY enumlabel;
-- SELECT id, name, enabled_modules FROM blueprints LIMIT 5;

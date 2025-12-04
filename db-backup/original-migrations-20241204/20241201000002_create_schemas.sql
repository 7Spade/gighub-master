-- ============================================================================
-- Migration: Create Schemas
-- Description: 建立命名空間架構
-- Created: 2024-12-01
-- ============================================================================

-- Create private schema for internal logic (RLS helper functions)
CREATE SCHEMA IF NOT EXISTS private;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP SCHEMA IF EXISTS private CASCADE;

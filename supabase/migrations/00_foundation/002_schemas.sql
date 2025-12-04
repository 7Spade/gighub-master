-- ============================================================================
-- Migration: 002_schemas
-- Layer: 00_foundation
-- Description: 建立命名空間架構
-- Dependencies: 001_extensions
-- ============================================================================

-- Create private schema for internal logic (RLS helper functions)
CREATE SCHEMA IF NOT EXISTS private;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP SCHEMA IF EXISTS private CASCADE;

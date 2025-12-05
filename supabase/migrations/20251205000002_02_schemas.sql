-- ============================================================================
-- Migration: 02 - Schemas
-- Description: 建立命名空間架構
-- Category: 02 - Schemas
-- ============================================================================

-- Create private schema for internal logic (RLS helper functions)
CREATE SCHEMA IF NOT EXISTS private;

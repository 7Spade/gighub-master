-- ============================================================================
-- Migration: Fix activities table schema to match TypeScript interface
-- Description: 修復 activities 表欄位以匹配 TypeScript 介面定義
-- ============================================================================

-- Add missing columns to activities table
ALTER TABLE public.activities 
  ADD COLUMN IF NOT EXISTS old_value JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS new_value JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS user_agent TEXT DEFAULT NULL;

-- Allow actor_id to be nullable for system-generated activities
ALTER TABLE public.activities 
  ALTER COLUMN actor_id DROP NOT NULL;

-- Update the summary column to be nullable (in case it was not already)
ALTER TABLE public.activities 
  ALTER COLUMN summary DROP NOT NULL;

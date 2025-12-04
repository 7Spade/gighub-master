-- ============================================================================
-- Migration: 001_extensions
-- Layer: 00_foundation
-- Description: 啟用必要的 PostgreSQL 擴展
-- Dependencies: None (must run first)
-- ============================================================================

-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- Enable uuid-ossp for UUID generation (if not using gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP EXTENSION IF EXISTS pg_trgm;
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- ============================================================================
-- Migration: 01 - Extensions
-- Description: 啟用必要的 PostgreSQL 擴展
-- Category: 01 - Extensions (最優先)
-- ============================================================================

-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

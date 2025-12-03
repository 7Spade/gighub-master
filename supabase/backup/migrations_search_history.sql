-- ============================================================================
-- Search History Table Migration
-- 搜尋歷史表遷移
--
-- Creates the search_history table for storing user search queries and history.
-- Supports the enterprise search engine with features like:
-- - Search history tracking per user
-- - Search analytics (result counts, click tracking)
-- - Category-based search filtering
-- - Automatic cleanup of old history
--
-- Prerequisites:
--   先執行 seed.sql (建立 auth.users 相關依賴)
--
-- Run Order (執行順序):
--   1. seed.sql (必須先執行 - 建立基礎架構)
--   2. seed_diaries.sql
--   3. seed_qc_inspections.sql
--   4. seed_acceptances.sql
--   5. seed_problems.sql
--   6. seed_audit_logs.sql
--   7. seed_search_history.sql (本檔案 - 可獨立執行，僅依賴 auth.users)
--
-- Created: 2024-12-03
-- ============================================================================

-- ============================================================================
-- 0. Enable Required Extensions
-- ============================================================================

-- Enable pg_trgm extension for trigram-based text search
-- This is required for the gin_trgm_ops operator class used in the search index
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- ============================================================================
-- 1. Create search_history table
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_history (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Reference (Foreign Key)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Search Query Data
  query TEXT NOT NULL,
  categories TEXT[] DEFAULT ARRAY['all']::TEXT[],
  result_count INTEGER DEFAULT 0,
  
  -- Click Tracking
  has_click BOOLEAN DEFAULT false,
  clicked_result_id UUID,
  
  -- Timestamps
  timestamp TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT query_min_length CHECK (char_length(query) >= 1),
  CONSTRAINT query_max_length CHECK (char_length(query) <= 500)
);

-- ============================================================================
-- 2. Create Indexes for Performance
-- ============================================================================

-- Index for user-specific queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_search_history_user_id 
  ON search_history(user_id);

-- Index for timestamp-based queries (recent searches, cleanup)
CREATE INDEX IF NOT EXISTS idx_search_history_timestamp 
  ON search_history(timestamp DESC);

-- Composite index for user's recent searches
CREATE INDEX IF NOT EXISTS idx_search_history_user_timestamp 
  ON search_history(user_id, timestamp DESC);

-- Full-text search index on query for suggestions
CREATE INDEX IF NOT EXISTS idx_search_history_query_trgm 
  ON search_history USING gin (query gin_trgm_ops);

-- ============================================================================
-- 3. Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own search history
CREATE POLICY "Users can view own search history"
  ON search_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own search history
CREATE POLICY "Users can insert own search history"
  ON search_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own search history (for click tracking)
CREATE POLICY "Users can update own search history"
  ON search_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own search history
CREATE POLICY "Users can delete own search history"
  ON search_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Helper Functions
-- ============================================================================

-- Function: Get popular search queries (for suggestions)
CREATE OR REPLACE FUNCTION get_popular_searches(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  query TEXT,
  search_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.query,
    COUNT(*) as search_count
  FROM search_history sh
  WHERE sh.timestamp > now() - interval '30 days'
  GROUP BY sh.query
  ORDER BY search_count DESC
  LIMIT p_limit;
END;
$$;

-- Function: Get user's recent unique searches
CREATE OR REPLACE FUNCTION get_user_recent_searches(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  query TEXT,
  categories TEXT[],
  result_count INTEGER,
  searched_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (sh.query)
    sh.id,
    sh.query,
    sh.categories,
    sh.result_count,
    sh.timestamp AS searched_at
  FROM search_history sh
  WHERE sh.user_id = p_user_id
  ORDER BY sh.query, sh.timestamp DESC
  LIMIT p_limit;
END;
$$;

-- Function: Cleanup old search history (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM search_history
  WHERE timestamp < now() - interval '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 5. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE search_history IS 'Stores user search queries for history, suggestions, and analytics';
COMMENT ON COLUMN search_history.id IS 'Unique identifier for the search history entry';
COMMENT ON COLUMN search_history.user_id IS 'Reference to the user who performed the search';
COMMENT ON COLUMN search_history.query IS 'The search query string (2-500 characters)';
COMMENT ON COLUMN search_history.categories IS 'Array of search categories (e.g., task, blueprint, diary)';
COMMENT ON COLUMN search_history.result_count IS 'Number of results returned for this search';
COMMENT ON COLUMN search_history.has_click IS 'Whether the user clicked on a result';
COMMENT ON COLUMN search_history.clicked_result_id IS 'ID of the result that was clicked';
COMMENT ON COLUMN search_history.timestamp IS 'When the search was performed';

-- ============================================================================
-- 6. Grant Permissions
-- ============================================================================

-- Grant usage on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_popular_searches(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recent_searches(UUID, INTEGER) TO authenticated;

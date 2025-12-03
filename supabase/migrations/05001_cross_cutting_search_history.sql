-- ============================================================================
-- Migration: 05001_cross_cutting_search_history.sql
-- Layer: Cross-Cutting (跨切面功能)
-- Module: Search History (搜尋歷史)
-- Description: 搜尋歷史表 - 支援企業搜尋引擎功能
--
-- Features:
--   - Search history tracking per user (用戶搜尋記錄)
--   - Search analytics (搜尋分析)
--   - Category-based search filtering (分類過濾)
--   - Automatic cleanup of old history (自動清理)
--
-- Dependencies:
--   - auth.users table (Supabase Auth)
--   - pg_trgm extension
--
-- Based on GigHub Architecture:
--   - Three-layer architecture (Foundation/Container/Business)
--   - User-scoped data with RLS
-- ============================================================================

-- ============================================================================
-- 1. Extensions (擴展)
-- ============================================================================

-- Enable pg_trgm extension for trigram-based text search
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- ============================================================================
-- 2. Table Definition (資料表定義)
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
-- 3. Indexes (索引)
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
-- 4. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for idempotency
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
DROP POLICY IF EXISTS "Users can insert own search history" ON search_history;
DROP POLICY IF EXISTS "Users can update own search history" ON search_history;
DROP POLICY IF EXISTS "Users can delete own search history" ON search_history;

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
-- 5. Helper Functions (輔助函數)
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
-- 6. Permissions (權限授予)
-- ============================================================================

-- Grant usage on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_popular_searches(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_recent_searches(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- 7. Comments (文件註解)
-- ============================================================================

COMMENT ON TABLE search_history IS '搜尋歷史表 - 存儲用戶搜尋查詢的歷史記錄、建議和分析';
COMMENT ON COLUMN search_history.id IS '唯一識別碼';
COMMENT ON COLUMN search_history.user_id IS '執行搜尋的用戶參考';
COMMENT ON COLUMN search_history.query IS '搜尋查詢字串 (1-500 字元)';
COMMENT ON COLUMN search_history.categories IS '搜尋分類陣列 (例如：task, blueprint, diary)';
COMMENT ON COLUMN search_history.result_count IS '此搜尋返回的結果數';
COMMENT ON COLUMN search_history.has_click IS '用戶是否點擊了結果';
COMMENT ON COLUMN search_history.clicked_result_id IS '被點擊的結果 ID';
COMMENT ON COLUMN search_history.timestamp IS '搜尋執行時間';

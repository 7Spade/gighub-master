-- ============================================================================
-- Migration: 17-0016 - Table: search_history
-- Description: 搜尋歷史表
-- Category: 17 - Business Extensions
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  categories TEXT[] DEFAULT ARRAY['all']::TEXT[],
  result_count INTEGER DEFAULT 0,
  has_click BOOLEAN DEFAULT false,
  clicked_result_id UUID,
  timestamp TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT query_min_length CHECK (char_length(query) >= 1),
  CONSTRAINT query_max_length CHECK (char_length(query) <= 500)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_timestamp ON search_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query_trgm ON search_history USING gin (query gin_trgm_ops);

-- Enable RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

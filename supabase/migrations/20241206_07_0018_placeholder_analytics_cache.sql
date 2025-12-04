-- ============================================================================
-- Migration: Analytics Cache (Placeholder)
-- Category: 07 - Module Tables
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟢 中 - 報表與分析模組
-- ============================================================================
-- 
-- 📋 功能說明：
-- 分析資料快取系統，用於加速報表查詢
--
-- 🎯 目標：
-- 1. 預計算報表資料
-- 2. 減少即時查詢負載
-- 3. 支援儀表板快速載入
--
-- 📦 計劃表結構：
-- analytics_cache
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - cache_key: TEXT NOT NULL (快取鍵，如 'daily_progress_20241201')
--   - cache_type: TEXT ('daily', 'weekly', 'monthly', 'custom')
--   - data: JSONB NOT NULL
--   - computed_at: TIMESTAMPTZ
--   - expires_at: TIMESTAMPTZ
--   - is_stale: BOOLEAN DEFAULT false
--
-- analytics_metrics
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - metric_date: DATE
--   - metric_name: TEXT (指標名稱)
--   - metric_value: DECIMAL
--   - metadata: JSONB
--
-- 📐 依賴關係：
-- - 依賴 06 - Blueprint Tables (blueprints)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看分析快取
-- - 系統自動更新快取
--
-- 📝 相關 PRD 章節：
-- - 8.3 資料存儲與隱私 - 快取策略
-- - 4.10 報表與分析
--
-- ⚠️ 實作注意事項：
-- 1. 使用物化視圖優化複雜聚合
-- 2. 定期刷新策略
-- 3. 快取失效機制
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
-- 1. 分析快取表
CREATE TABLE IF NOT EXISTS analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    cache_key TEXT NOT NULL,
    cache_type TEXT NOT NULL CHECK (cache_type IN ('daily', 'weekly', 'monthly', 'custom')),
    data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_stale BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_cache_key UNIQUE (blueprint_id, cache_key)
);

-- 2. 分析指標表（時間序列資料）
CREATE TABLE IF NOT EXISTS analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(20,4) NOT NULL,
    previous_value DECIMAL(20,4),
    change_percentage DECIMAL(10,4),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_metric UNIQUE (blueprint_id, metric_date, metric_name)
);

-- 3. 建立索引
CREATE INDEX idx_analytics_cache_blueprint ON analytics_cache(blueprint_id);
CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_type ON analytics_cache(cache_type);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_analytics_metrics_blueprint ON analytics_metrics(blueprint_id);
CREATE INDEX idx_analytics_metrics_date ON analytics_metrics(metric_date);
CREATE INDEX idx_analytics_metrics_name ON analytics_metrics(metric_name);
CREATE INDEX idx_analytics_metrics_lookup ON analytics_metrics(blueprint_id, metric_name, metric_date DESC);

-- 4. 啟用 RLS
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "analytics_cache_select" ON analytics_cache
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "analytics_metrics_select" ON analytics_metrics
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- 5. 物化視圖：每日進度彙總
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_progress_summary AS
SELECT 
    b.id AS blueprint_id,
    DATE_TRUNC('day', t.updated_at)::DATE AS date,
    COUNT(t.id) AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'done') AS completed_tasks,
    ROUND(
        COUNT(t.id) FILTER (WHERE t.status = 'done')::DECIMAL / 
        NULLIF(COUNT(t.id), 0) * 100, 
        2
    ) AS completion_percentage,
    SUM(t.progress) AS total_progress,
    AVG(t.progress)::DECIMAL(5,2) AS avg_progress
FROM blueprints b
LEFT JOIN tasks t ON t.blueprint_id = b.id
GROUP BY b.id, DATE_TRUNC('day', t.updated_at)::DATE
WITH NO DATA;

CREATE UNIQUE INDEX ON mv_daily_progress_summary (blueprint_id, date);

-- 刷新物化視圖
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_progress_summary;

-- 6. 快取更新函數
CREATE OR REPLACE FUNCTION private.refresh_analytics_cache(
    p_blueprint_id UUID,
    p_cache_type TEXT DEFAULT 'daily'
)
RETURNS VOID AS $$
BEGIN
    -- 標記舊快取為過期
    UPDATE analytics_cache
    SET is_stale = true
    WHERE blueprint_id = p_blueprint_id
    AND cache_type = p_cache_type
    AND NOT is_stale;
    
    -- 根據類型計算新快取
    -- 實際邏輯在此處實現...
    
END;
$$ LANGUAGE plpgsql;

-- 7. 定期刷新排程 (pg_cron)
-- SELECT cron.schedule('refresh-daily-analytics', '0 1 * * *', $$
--     REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_progress_summary;
-- $$);
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Analytics Cache - Placeholder Migration' AS status;

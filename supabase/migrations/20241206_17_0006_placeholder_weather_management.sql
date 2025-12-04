-- ============================================================================
-- Migration: Weather Management (Placeholder)
-- Category: 17 - Business Extensions
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟢 中 - 日誌系統增強
-- ============================================================================
-- 
-- 📋 功能說明：
-- 天氣資料管理與日誌整合
--
-- 🎯 目標：
-- 1. 記錄每日天氣狀況
-- 2. 與施工日誌整合
-- 3. 天氣影響工進分析
--
-- 📦 計劃表結構：
-- weather_records
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - record_date: DATE NOT NULL
--   - weather_morning: weather_type ENUM
--   - weather_afternoon: weather_type ENUM
--   - temperature_high: DECIMAL(5,2)
--   - temperature_low: DECIMAL(5,2)
--   - humidity: INTEGER
--   - wind_speed: DECIMAL(5,2)
--   - rainfall: DECIMAL(5,2) (降雨量 mm)
--   - is_workable: BOOLEAN (是否可施工)
--   - notes: TEXT
--   - source: TEXT ('manual', 'api', 'cwb')
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 03 - Custom Types (weather_type)
-- - 依賴 06 - Blueprint Tables (blueprints)
-- - 依賴 07 - Module Tables (diaries)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看天氣記錄
-- - 工地負責人可建立/編輯
--
-- 📝 相關 PRD 章節：
-- - 附錄 F.1 資料庫物件清單 - weather_type ENUM
-- - 4.4 施工日誌模組 - 天氣記錄
--
-- ⚠️ 實作注意事項：
-- 1. 考慮整合中央氣象署 API
-- 2. 天氣記錄與日誌關聯
-- 3. 停工天數統計
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
-- 1. 天氣記錄表
CREATE TABLE IF NOT EXISTS weather_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    weather_morning public.weather_type,
    weather_afternoon public.weather_type,
    temperature_high DECIMAL(5,2),
    temperature_low DECIMAL(5,2),
    humidity INTEGER CHECK (humidity >= 0 AND humidity <= 100),
    wind_speed DECIMAL(5,2),
    wind_direction TEXT,
    rainfall DECIMAL(5,2) DEFAULT 0,  -- 降雨量 mm
    is_workable BOOLEAN NOT NULL DEFAULT true,
    non_workable_reason TEXT,
    notes TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'api', 'cwb', 'import')),
    external_data JSONB,  -- 外部 API 原始資料
    created_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_weather_per_day UNIQUE (blueprint_id, record_date)
);

-- 2. 建立索引
CREATE INDEX idx_weather_records_blueprint ON weather_records(blueprint_id);
CREATE INDEX idx_weather_records_date ON weather_records(record_date);
CREATE INDEX idx_weather_records_workable ON weather_records(blueprint_id, is_workable);
CREATE INDEX idx_weather_records_range ON weather_records(blueprint_id, record_date DESC);

-- 3. 啟用 RLS
ALTER TABLE weather_records ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "weather_records_select" ON weather_records
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "weather_records_insert" ON weather_records
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "weather_records_update" ON weather_records
    FOR UPDATE TO authenticated
    USING ((SELECT private.can_write_blueprint(blueprint_id)))
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "weather_records_delete" ON weather_records
    FOR DELETE TO authenticated
    USING ((SELECT private.is_blueprint_owner(blueprint_id)));

-- 4. 觸發器
CREATE TRIGGER update_weather_records_updated_at
    BEFORE UPDATE ON weather_records
    FOR EACH ROW
    EXECUTE FUNCTION private.update_updated_at();

-- 5. 視圖：天氣統計
CREATE OR REPLACE VIEW weather_statistics AS
SELECT 
    blueprint_id,
    DATE_TRUNC('month', record_date)::DATE AS month,
    COUNT(*) AS total_days,
    COUNT(*) FILTER (WHERE is_workable) AS workable_days,
    COUNT(*) FILTER (WHERE NOT is_workable) AS non_workable_days,
    SUM(rainfall) AS total_rainfall,
    AVG(temperature_high)::DECIMAL(5,2) AS avg_high_temp,
    AVG(temperature_low)::DECIMAL(5,2) AS avg_low_temp,
    MODE() WITHIN GROUP (ORDER BY weather_morning) AS most_common_weather
FROM weather_records
GROUP BY blueprint_id, DATE_TRUNC('month', record_date)::DATE;

-- 6. API 函數：取得或建立當日天氣
CREATE OR REPLACE FUNCTION public.get_or_create_weather(
    p_blueprint_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    v_weather_id UUID;
BEGIN
    -- 嘗試取得現有記錄
    SELECT id INTO v_weather_id
    FROM weather_records
    WHERE blueprint_id = p_blueprint_id AND record_date = p_date;
    
    IF v_weather_id IS NULL THEN
        -- 建立新記錄
        INSERT INTO weather_records (blueprint_id, record_date, created_by)
        VALUES (p_blueprint_id, p_date, (SELECT private.get_user_account_id()))
        RETURNING id INTO v_weather_id;
    END IF;
    
    RETURN v_weather_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.get_or_create_weather TO authenticated;
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Weather Management - Placeholder Migration' AS status;

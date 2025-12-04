-- ============================================================================
-- Migration: Labor Management (Placeholder)
-- Category: 17 - Business Extensions
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟢 中 - 施工日誌增強
-- ============================================================================
-- 
-- 📋 功能說明：
-- 人力資源管理與出工記錄
--
-- 🎯 目標：
-- 1. 記錄每日出工人數
-- 2. 分類記錄工種
-- 3. 人力成本統計
--
-- 📦 計劃表結構：
-- labor_records
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - diary_entry_id: UUID FK → diary_entries.id
--   - record_date: DATE NOT NULL
--   - worker_type: TEXT (工種：木工、水電、泥作等)
--   - headcount: INTEGER (人數)
--   - hours_worked: DECIMAL(5,2) (工時)
--   - hourly_rate: DECIMAL(10,2) (時薪)
--   - total_cost: DECIMAL(12,2) (總成本)
--   - contractor_name: TEXT (承包商名稱)
--   - notes: TEXT
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--
-- worker_types (工種定義表)
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK (NULL 表示系統預設)
--   - name: TEXT NOT NULL
--   - category: TEXT (類別：泥作、水電、木工等)
--   - default_hourly_rate: DECIMAL(10,2)
--   - is_active: BOOLEAN
--   - created_at: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 06 - Blueprint Tables (blueprints)
-- - 依賴 07 - Module Tables (diary_entries)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看人力記錄
-- - 工地負責人可建立/編輯
--
-- 📝 相關 PRD 章節：
-- - 4.4 施工日誌模組 - 人力記錄
-- - 10.34 GH-034: 檢視工時報表
--
-- ⚠️ 實作注意事項：
-- 1. 與 diary_entries 整合
-- 2. 工種可自訂或使用預設
-- 3. 成本統計報表
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
-- 1. 工種定義表
CREATE TABLE IF NOT EXISTS worker_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,  -- NULL = 系統預設
    name TEXT NOT NULL,
    category TEXT NOT NULL,  -- 大類：泥作、水電、木工、鷹架、機具等
    description TEXT,
    default_hourly_rate DECIMAL(10,2),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_worker_type UNIQUE (blueprint_id, name)
);

-- 2. 人力記錄表
CREATE TABLE IF NOT EXISTS labor_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    diary_entry_id UUID REFERENCES diary_entries(id) ON DELETE SET NULL,
    record_date DATE NOT NULL,
    worker_type_id UUID REFERENCES worker_types(id) ON DELETE SET NULL,
    worker_type_name TEXT NOT NULL,  -- 冗餘存儲，避免刪除工種後資料遺失
    headcount INTEGER NOT NULL CHECK (headcount >= 0),
    hours_worked DECIMAL(5,2) NOT NULL DEFAULT 8.0 CHECK (hours_worked > 0),
    hourly_rate DECIMAL(10,2),
    total_cost DECIMAL(12,2),  -- 自動計算：headcount * hours_worked * hourly_rate
    contractor_id UUID,  -- 未來關聯承包商表
    contractor_name TEXT,
    notes TEXT,
    created_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 建立索引
CREATE INDEX idx_worker_types_blueprint ON worker_types(blueprint_id);
CREATE INDEX idx_worker_types_category ON worker_types(category);
CREATE INDEX idx_worker_types_active ON worker_types(is_active);

CREATE INDEX idx_labor_records_blueprint ON labor_records(blueprint_id);
CREATE INDEX idx_labor_records_date ON labor_records(record_date);
CREATE INDEX idx_labor_records_diary ON labor_records(diary_entry_id);
CREATE INDEX idx_labor_records_type ON labor_records(worker_type_id);
CREATE INDEX idx_labor_records_range ON labor_records(blueprint_id, record_date DESC);

-- 4. 啟用 RLS
ALTER TABLE worker_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_records ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "worker_types_select" ON worker_types
    FOR SELECT TO authenticated
    USING (
        blueprint_id IS NULL  -- 系統預設可見
        OR (SELECT private.has_blueprint_access(blueprint_id))
    );

CREATE POLICY "worker_types_insert" ON worker_types
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "worker_types_update" ON worker_types
    FOR UPDATE TO authenticated
    USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "labor_records_select" ON labor_records
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "labor_records_insert" ON labor_records
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "labor_records_update" ON labor_records
    FOR UPDATE TO authenticated
    USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "labor_records_delete" ON labor_records
    FOR DELETE TO authenticated
    USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- 5. 觸發器：自動計算成本
CREATE OR REPLACE FUNCTION private.calculate_labor_cost()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hourly_rate IS NOT NULL THEN
        NEW.total_cost := NEW.headcount * NEW.hours_worked * NEW.hourly_rate;
    ELSE
        NEW.total_cost := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_labor_cost_trigger
    BEFORE INSERT OR UPDATE OF headcount, hours_worked, hourly_rate ON labor_records
    FOR EACH ROW
    EXECUTE FUNCTION private.calculate_labor_cost();

CREATE TRIGGER update_labor_records_updated_at
    BEFORE UPDATE ON labor_records
    FOR EACH ROW
    EXECUTE FUNCTION private.update_updated_at();

-- 6. 預設工種資料
INSERT INTO worker_types (blueprint_id, name, category, sort_order) VALUES
    (NULL, '泥作工', '泥作', 10),
    (NULL, '水電工', '水電', 20),
    (NULL, '木工', '木作', 30),
    (NULL, '鐵工', '鋼構', 40),
    (NULL, '油漆工', '油漆', 50),
    (NULL, '鷹架工', '鷹架', 60),
    (NULL, '清潔工', '清潔', 70),
    (NULL, '小工', '雜工', 80),
    (NULL, '機具操作員', '機具', 90),
    (NULL, '安全衛生人員', '安全', 100);

-- 7. 統計視圖
CREATE OR REPLACE VIEW labor_statistics AS
SELECT 
    blueprint_id,
    DATE_TRUNC('month', record_date)::DATE AS month,
    worker_type_name,
    SUM(headcount) AS total_headcount,
    SUM(headcount * hours_worked) AS total_man_hours,
    SUM(total_cost) AS total_cost,
    AVG(hourly_rate)::DECIMAL(10,2) AS avg_hourly_rate
FROM labor_records
GROUP BY blueprint_id, DATE_TRUNC('month', record_date)::DATE, worker_type_name;
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Labor Management - Placeholder Migration' AS status;

-- ============================================================================
-- Migration: Equipment Management (Placeholder)
-- Category: 17 - Business Extensions
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟢 中 - 施工日誌增強
-- ============================================================================
-- 
-- 📋 功能說明：
-- 機具設備管理與使用記錄
--
-- 🎯 目標：
-- 1. 記錄每日機具使用
-- 2. 設備調度管理
-- 3. 機具成本統計
--
-- 📦 計劃表結構：
-- equipment_records
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - diary_entry_id: UUID FK → diary_entries.id
--   - record_date: DATE NOT NULL
--   - equipment_type: TEXT (機具類型)
--   - equipment_name: TEXT (機具名稱)
--   - quantity: INTEGER (數量)
--   - hours_used: DECIMAL(5,2) (使用時數)
--   - hourly_rate: DECIMAL(10,2) (時租費)
--   - total_cost: DECIMAL(12,2) (總成本)
--   - operator: TEXT (操作員)
--   - status: TEXT ('in_use', 'standby', 'maintenance')
--   - notes: TEXT
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--
-- equipment_types (機具類型定義表)
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK (NULL 表示系統預設)
--   - name: TEXT NOT NULL
--   - category: TEXT (類別：吊掛、運輸、混凝土等)
--   - default_hourly_rate: DECIMAL(10,2)
--   - is_active: BOOLEAN
--   - created_at: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 06 - Blueprint Tables (blueprints)
-- - 依賴 07 - Module Tables (diary_entries)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看機具記錄
-- - 工地負責人可建立/編輯
--
-- 📝 相關 PRD 章節：
-- - 4.4 施工日誌模組 - 機具記錄
-- - 10.34 GH-034: 檢視工時報表 (含機具)
--
-- ⚠️ 實作注意事項：
-- 1. 與 diary_entries 整合
-- 2. 機具類型可自訂或使用預設
-- 3. 成本統計報表
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
-- 1. 機具類型定義表
CREATE TABLE IF NOT EXISTS equipment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,  -- NULL = 系統預設
    name TEXT NOT NULL,
    category TEXT NOT NULL,  -- 大類：吊掛、運輸、混凝土、壓實、挖掘等
    description TEXT,
    default_hourly_rate DECIMAL(10,2),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_equipment_type UNIQUE (blueprint_id, name)
);

-- 2. 機具使用記錄表
CREATE TABLE IF NOT EXISTS equipment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    diary_entry_id UUID REFERENCES diary_entries(id) ON DELETE SET NULL,
    record_date DATE NOT NULL,
    equipment_type_id UUID REFERENCES equipment_types(id) ON DELETE SET NULL,
    equipment_type_name TEXT NOT NULL,  -- 冗餘存儲
    equipment_name TEXT,  -- 具體設備名稱/編號
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    hours_used DECIMAL(5,2) NOT NULL DEFAULT 8.0 CHECK (hours_used >= 0),
    hourly_rate DECIMAL(10,2),
    total_cost DECIMAL(12,2),  -- 自動計算
    operator_name TEXT,
    rental_company TEXT,
    status TEXT NOT NULL DEFAULT 'in_use' CHECK (status IN ('in_use', 'standby', 'maintenance', 'breakdown')),
    fuel_consumption DECIMAL(10,2),  -- 油耗 (公升)
    notes TEXT,
    created_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 建立索引
CREATE INDEX idx_equipment_types_blueprint ON equipment_types(blueprint_id);
CREATE INDEX idx_equipment_types_category ON equipment_types(category);

CREATE INDEX idx_equipment_records_blueprint ON equipment_records(blueprint_id);
CREATE INDEX idx_equipment_records_date ON equipment_records(record_date);
CREATE INDEX idx_equipment_records_diary ON equipment_records(diary_entry_id);
CREATE INDEX idx_equipment_records_type ON equipment_records(equipment_type_id);
CREATE INDEX idx_equipment_records_range ON equipment_records(blueprint_id, record_date DESC);

-- 4. 啟用 RLS
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_records ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "equipment_types_select" ON equipment_types
    FOR SELECT TO authenticated
    USING (
        blueprint_id IS NULL
        OR (SELECT private.has_blueprint_access(blueprint_id))
    );

CREATE POLICY "equipment_types_insert" ON equipment_types
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "equipment_records_select" ON equipment_records
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "equipment_records_insert" ON equipment_records
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "equipment_records_update" ON equipment_records
    FOR UPDATE TO authenticated
    USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "equipment_records_delete" ON equipment_records
    FOR DELETE TO authenticated
    USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- 5. 觸發器：自動計算成本
CREATE OR REPLACE FUNCTION private.calculate_equipment_cost()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.hourly_rate IS NOT NULL THEN
        NEW.total_cost := NEW.quantity * NEW.hours_used * NEW.hourly_rate;
    ELSE
        NEW.total_cost := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_equipment_cost_trigger
    BEFORE INSERT OR UPDATE OF quantity, hours_used, hourly_rate ON equipment_records
    FOR EACH ROW
    EXECUTE FUNCTION private.calculate_equipment_cost();

CREATE TRIGGER update_equipment_records_updated_at
    BEFORE UPDATE ON equipment_records
    FOR EACH ROW
    EXECUTE FUNCTION private.update_updated_at();

-- 6. 預設機具類型
INSERT INTO equipment_types (blueprint_id, name, category, sort_order) VALUES
    (NULL, '塔式起重機', '吊掛設備', 10),
    (NULL, '移動式起重機', '吊掛設備', 20),
    (NULL, '混凝土泵車', '混凝土設備', 30),
    (NULL, '混凝土攪拌車', '混凝土設備', 40),
    (NULL, '挖土機', '挖掘設備', 50),
    (NULL, '推土機', '挖掘設備', 60),
    (NULL, '壓路機', '壓實設備', 70),
    (NULL, '發電機', '電力設備', 80),
    (NULL, '空壓機', '氣動設備', 90),
    (NULL, '鑽掘機', '鑽掘設備', 100);

-- 7. 統計視圖
CREATE OR REPLACE VIEW equipment_statistics AS
SELECT 
    blueprint_id,
    DATE_TRUNC('month', record_date)::DATE AS month,
    equipment_type_name,
    SUM(quantity) AS total_units,
    SUM(quantity * hours_used) AS total_machine_hours,
    SUM(total_cost) AS total_cost,
    SUM(fuel_consumption) AS total_fuel
FROM equipment_records
GROUP BY blueprint_id, DATE_TRUNC('month', record_date)::DATE, equipment_type_name;
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Equipment Management - Placeholder Migration' AS status;

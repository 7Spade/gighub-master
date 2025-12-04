-- ============================================================================
-- Migration: Material Management (Placeholder)
-- Category: 17 - Business Extensions
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟢 中 - 施工日誌增強
-- ============================================================================
-- 
-- 📋 功能說明：
-- 材料進出場管理
--
-- 🎯 目標：
-- 1. 記錄材料進場
-- 2. 記錄材料出場/使用
-- 3. 材料庫存追蹤
--
-- 📦 計劃表結構：
-- material_records
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - diary_entry_id: UUID FK → diary_entries.id
--   - record_date: DATE NOT NULL
--   - record_type: TEXT ('in', 'out', 'inventory', 'return')
--   - material_name: TEXT NOT NULL
--   - material_spec: TEXT (規格)
--   - quantity: DECIMAL(15,4)
--   - unit: TEXT (單位：公噸、包、m³ 等)
--   - unit_price: DECIMAL(12,4)
--   - total_amount: DECIMAL(15,2)
--   - supplier: TEXT
--   - delivery_note: TEXT (送貨單號)
--   - notes: TEXT
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--
-- material_inventory (即時庫存表)
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - material_name: TEXT
--   - material_spec: TEXT
--   - current_quantity: DECIMAL(15,4)
--   - unit: TEXT
--   - last_updated: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 06 - Blueprint Tables (blueprints)
-- - 依賴 07 - Module Tables (diary_entries)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看材料記錄
-- - 工地負責人可建立/編輯
--
-- 📝 相關 PRD 章節：
-- - 4.4 施工日誌模組 - 材料進出場記錄
-- - 附錄 F.1 資料庫物件清單
--
-- ⚠️ 實作注意事項：
-- 1. 庫存自動計算
-- 2. 與採購系統整合預留
-- 3. 材料成本統計
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
-- 1. 材料進出記錄表
CREATE TABLE IF NOT EXISTS material_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    diary_entry_id UUID REFERENCES diary_entries(id) ON DELETE SET NULL,
    record_date DATE NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('in', 'out', 'inventory', 'return', 'waste')),
    material_category TEXT,  -- 材料分類：混凝土、鋼筋、模板等
    material_name TEXT NOT NULL,
    material_spec TEXT,  -- 規格
    material_brand TEXT,  -- 品牌
    quantity DECIMAL(15,4) NOT NULL CHECK (quantity >= 0),
    unit TEXT NOT NULL,  -- 單位
    unit_price DECIMAL(12,4),
    total_amount DECIMAL(15,2),  -- 自動計算
    supplier_id UUID,  -- 未來關聯供應商表
    supplier_name TEXT,
    delivery_note TEXT,  -- 送貨單號
    invoice_number TEXT,  -- 發票號碼
    storage_location TEXT,  -- 存放位置
    quality_status TEXT DEFAULT 'pending' CHECK (quality_status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    attachments JSONB DEFAULT '[]',  -- 照片/送貨單掃描
    created_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 材料庫存表
CREATE TABLE IF NOT EXISTS material_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    material_name TEXT NOT NULL,
    material_spec TEXT,
    material_category TEXT,
    current_quantity DECIMAL(15,4) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_quantity DECIMAL(15,4),  -- 最低庫存警戒
    avg_unit_price DECIMAL(12,4),  -- 加權平均單價
    total_value DECIMAL(15,2),  -- 庫存總值
    last_in_date DATE,
    last_out_date DATE,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_material_inventory UNIQUE (blueprint_id, material_name, material_spec)
);

-- 3. 建立索引
CREATE INDEX idx_material_records_blueprint ON material_records(blueprint_id);
CREATE INDEX idx_material_records_date ON material_records(record_date);
CREATE INDEX idx_material_records_diary ON material_records(diary_entry_id);
CREATE INDEX idx_material_records_type ON material_records(record_type);
CREATE INDEX idx_material_records_material ON material_records(material_name);
CREATE INDEX idx_material_records_range ON material_records(blueprint_id, record_date DESC);

CREATE INDEX idx_material_inventory_blueprint ON material_inventory(blueprint_id);
CREATE INDEX idx_material_inventory_material ON material_inventory(material_name);
CREATE INDEX idx_material_inventory_low_stock ON material_inventory(blueprint_id, current_quantity, min_quantity) 
    WHERE min_quantity IS NOT NULL;

-- 4. 啟用 RLS
ALTER TABLE material_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_inventory ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "material_records_select" ON material_records
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "material_records_insert" ON material_records
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "material_records_update" ON material_records
    FOR UPDATE TO authenticated
    USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "material_records_delete" ON material_records
    FOR DELETE TO authenticated
    USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "material_inventory_select" ON material_inventory
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- 5. 觸發器：自動計算金額
CREATE OR REPLACE FUNCTION private.calculate_material_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.unit_price IS NOT NULL THEN
        NEW.total_amount := NEW.quantity * NEW.unit_price;
    ELSE
        NEW.total_amount := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_material_amount_trigger
    BEFORE INSERT OR UPDATE OF quantity, unit_price ON material_records
    FOR EACH ROW
    EXECUTE FUNCTION private.calculate_material_amount();

-- 6. 觸發器：自動更新庫存
CREATE OR REPLACE FUNCTION private.update_material_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_quantity_change DECIMAL(15,4);
    v_inventory_id UUID;
BEGIN
    -- 計算庫存變化量
    CASE NEW.record_type
        WHEN 'in' THEN v_quantity_change := NEW.quantity;
        WHEN 'out', 'waste' THEN v_quantity_change := -NEW.quantity;
        WHEN 'return' THEN v_quantity_change := NEW.quantity;  -- 退回供應商
        WHEN 'inventory' THEN v_quantity_change := 0;  -- 盤點調整另處理
        ELSE v_quantity_change := 0;
    END CASE;
    
    -- 更新或建立庫存記錄
    INSERT INTO material_inventory (
        blueprint_id, material_name, material_spec, 
        material_category, current_quantity, unit
    )
    VALUES (
        NEW.blueprint_id, NEW.material_name, NEW.material_spec,
        NEW.material_category, v_quantity_change, NEW.unit
    )
    ON CONFLICT (blueprint_id, material_name, material_spec) DO UPDATE
    SET 
        current_quantity = material_inventory.current_quantity + v_quantity_change,
        last_in_date = CASE WHEN NEW.record_type = 'in' THEN NEW.record_date ELSE material_inventory.last_in_date END,
        last_out_date = CASE WHEN NEW.record_type = 'out' THEN NEW.record_date ELSE material_inventory.last_out_date END,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_trigger
    AFTER INSERT ON material_records
    FOR EACH ROW
    EXECUTE FUNCTION private.update_material_inventory();

CREATE TRIGGER update_material_records_updated_at
    BEFORE UPDATE ON material_records
    FOR EACH ROW
    EXECUTE FUNCTION private.update_updated_at();

-- 7. 統計視圖
CREATE OR REPLACE VIEW material_statistics AS
SELECT 
    blueprint_id,
    DATE_TRUNC('month', record_date)::DATE AS month,
    material_category,
    record_type,
    COUNT(*) AS record_count,
    SUM(quantity) AS total_quantity,
    SUM(total_amount) AS total_amount
FROM material_records
GROUP BY blueprint_id, DATE_TRUNC('month', record_date)::DATE, material_category, record_type;
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Material Management - Placeholder Migration' AS status;

-- ============================================================================
-- Migration: Task Budget (Placeholder)
-- Category: 07 - Module Tables
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟡 中 - 財務系統前置需求
-- ============================================================================
-- 
-- 📋 功能說明：
-- 任務預算金額管理
--
-- 🎯 目標：
-- 1. 每個任務可設定預算金額
-- 2. 子任務預算不得超過父任務
-- 3. 支援按進度請款
--
-- 📦 計劃表結構：
-- task_budget
--   - id: UUID PRIMARY KEY
--   - task_id: UUID FK → tasks.id (UNIQUE)
--   - estimated_amount: DECIMAL(15,2) (預估金額)
--   - actual_amount: DECIMAL(15,2) (實際金額)
--   - currency: TEXT DEFAULT 'TWD'
--   - unit: TEXT (計量單位，如：式、公噸、坪)
--   - unit_price: DECIMAL(15,2) (單價)
--   - quantity: DECIMAL(15,2) (數量)
--   - notes: TEXT
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 07 - Module Tables (tasks)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看（根據角色權限）
-- - 專案經理可建立/編輯
-- - 財務角色可編輯
--
-- 📝 相關 PRD 章節：
-- - 附錄 F.1 資料庫物件清單 - task_budget
-- - 4.11 財務系統 - 按任務/里程碑完成度請款
--
-- ⚠️ 實作注意事項：
-- 1. 需要觸發器驗證：子任務預算總和 ≤ 父任務預算
-- 2. 金額變更需記錄審計日誌
-- 3. 與 payment_requests 表整合
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
CREATE TABLE IF NOT EXISTS task_budget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    estimated_amount DECIMAL(15,2) DEFAULT 0,
    actual_amount DECIMAL(15,2) DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'TWD',
    unit TEXT,  -- 計量單位
    unit_price DECIMAL(15,2),
    quantity DECIMAL(15,2),
    payment_percentage DECIMAL(5,2) DEFAULT 0,  -- 已請款比例
    notes TEXT,
    created_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_task_budget UNIQUE (task_id),
    CONSTRAINT valid_amounts CHECK (
        estimated_amount >= 0 
        AND actual_amount >= 0 
        AND payment_percentage >= 0 
        AND payment_percentage <= 100
    )
);

-- 建立索引
CREATE INDEX idx_task_budget_task_id ON task_budget(task_id);

-- 啟用 RLS
ALTER TABLE task_budget ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "task_budget_select" ON task_budget
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(
        (SELECT blueprint_id FROM tasks WHERE id = task_id)
    )));

CREATE POLICY "task_budget_insert" ON task_budget
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(
        (SELECT blueprint_id FROM tasks WHERE id = task_id)
    )));

CREATE POLICY "task_budget_update" ON task_budget
    FOR UPDATE TO authenticated
    USING ((SELECT private.can_write_blueprint(
        (SELECT blueprint_id FROM tasks WHERE id = task_id)
    )))
    WITH CHECK ((SELECT private.can_write_blueprint(
        (SELECT blueprint_id FROM tasks WHERE id = task_id)
    )));

CREATE POLICY "task_budget_delete" ON task_budget
    FOR DELETE TO authenticated
    USING ((SELECT private.is_blueprint_owner(
        (SELECT blueprint_id FROM tasks WHERE id = task_id)
    )));

-- 觸發器：驗證子任務預算
CREATE OR REPLACE FUNCTION private.validate_task_budget()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_id UUID;
    v_parent_budget DECIMAL(15,2);
    v_children_sum DECIMAL(15,2);
BEGIN
    -- 獲取任務的父任務 ID
    SELECT parent_id INTO v_parent_id FROM tasks WHERE id = NEW.task_id;
    
    IF v_parent_id IS NOT NULL THEN
        -- 獲取父任務預算
        SELECT estimated_amount INTO v_parent_budget 
        FROM task_budget WHERE task_id = v_parent_id;
        
        IF v_parent_budget IS NOT NULL THEN
            -- 計算所有子任務預算總和
            SELECT COALESCE(SUM(tb.estimated_amount), 0) INTO v_children_sum
            FROM task_budget tb
            JOIN tasks t ON t.id = tb.task_id
            WHERE t.parent_id = v_parent_id
            AND t.id != NEW.task_id;
            
            v_children_sum := v_children_sum + NEW.estimated_amount;
            
            IF v_children_sum > v_parent_budget THEN
                RAISE EXCEPTION 'Children budget sum (%) exceeds parent budget (%)', 
                    v_children_sum, v_parent_budget;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_task_budget_trigger
    BEFORE INSERT OR UPDATE ON task_budget
    FOR EACH ROW
    EXECUTE FUNCTION private.validate_task_budget();

-- 觸發器：更新時間戳
CREATE TRIGGER update_task_budget_updated_at
    BEFORE UPDATE ON task_budget
    FOR EACH ROW
    EXECUTE FUNCTION private.update_updated_at();
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Task Budget - Placeholder Migration' AS status;

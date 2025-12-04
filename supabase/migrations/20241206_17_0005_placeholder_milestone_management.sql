-- ============================================================================
-- Migration: Milestone Management (Placeholder)
-- Category: 17 - Business Extensions
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟡 高 - 財務系統整合需求
-- ============================================================================
-- 
-- 📋 功能說明：
-- 里程碑管理系統，支援按里程碑請款
--
-- 🎯 目標：
-- 1. 定義專案里程碑
-- 2. 追蹤里程碑完成度
-- 3. 按里程碑觸發請款流程
--
-- 📦 計劃表結構：
-- milestones
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - name: TEXT NOT NULL
--   - description: TEXT
--   - target_date: DATE (目標完成日期)
--   - actual_date: DATE (實際完成日期)
--   - status: milestone_status ENUM
--   - progress: INTEGER DEFAULT 0 (0-100)
--   - payment_percentage: DECIMAL(5,2) (該里程碑佔總款項比例)
--   - payment_amount: DECIMAL(15,2) (該里程碑金額)
--   - sequence: INTEGER (排序)
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--
-- milestone_tasks
--   - milestone_id: UUID FK → milestones.id
--   - task_id: UUID FK → tasks.id
--   - PRIMARY KEY (milestone_id, task_id)
--
-- 📐 依賴關係：
-- - 依賴 06 - Blueprint Tables (blueprints)
-- - 依賴 07 - Module Tables (tasks)
-- - 依賴 17 - Business Extensions (contracts, payment_requests)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看里程碑
-- - 專案經理可建立/編輯里程碑
--
-- 📝 相關 PRD 章節：
-- - 4.11 財務系統 - 按里程碑完成度請款
-- - 10.14 GH-014: 定義里程碑
-- - 10.25 GH-025: 檢視請款申請
--
-- ⚠️ 實作注意事項：
-- 1. 里程碑進度應自動根據關聯任務計算
-- 2. 需與 payment_requests 表整合
-- 3. 里程碑完成觸發通知
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
-- 1. 建立里程碑狀態類型
DO $$ BEGIN
    CREATE TYPE public.milestone_status AS ENUM (
        'pending',      -- 待進行
        'in_progress',  -- 進行中
        'completed',    -- 已完成
        'delayed',      -- 延期
        'cancelled'     -- 已取消
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. 里程碑主表
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    actual_date DATE,
    status public.milestone_status NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    payment_percentage DECIMAL(5,2) CHECK (payment_percentage >= 0 AND payment_percentage <= 100),
    payment_amount DECIMAL(15,2) CHECK (payment_amount >= 0),
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    sequence INTEGER NOT NULL DEFAULT 1,
    is_billable BOOLEAN NOT NULL DEFAULT true,
    dependencies UUID[] DEFAULT '{}',  -- 依賴的其他里程碑
    created_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES accounts(id)
);

-- 3. 里程碑任務關聯表
CREATE TABLE IF NOT EXISTS milestone_tasks (
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) DEFAULT 1.0,  -- 任務權重
    PRIMARY KEY (milestone_id, task_id)
);

-- 4. 建立索引
CREATE INDEX idx_milestones_blueprint ON milestones(blueprint_id);
CREATE INDEX idx_milestones_contract ON milestones(contract_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_target_date ON milestones(target_date);
CREATE INDEX idx_milestones_sequence ON milestones(blueprint_id, sequence);

CREATE INDEX idx_milestone_tasks_milestone ON milestone_tasks(milestone_id);
CREATE INDEX idx_milestone_tasks_task ON milestone_tasks(task_id);

-- 5. 啟用 RLS
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_tasks ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "milestones_select" ON milestones
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "milestones_insert" ON milestones
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "milestones_update" ON milestones
    FOR UPDATE TO authenticated
    USING ((SELECT private.can_write_blueprint(blueprint_id)))
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "milestones_delete" ON milestones
    FOR DELETE TO authenticated
    USING ((SELECT private.is_blueprint_owner(blueprint_id)));

CREATE POLICY "milestone_tasks_select" ON milestone_tasks
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(
        (SELECT blueprint_id FROM milestones WHERE id = milestone_id)
    )));

CREATE POLICY "milestone_tasks_insert" ON milestone_tasks
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(
        (SELECT blueprint_id FROM milestones WHERE id = milestone_id)
    )));

CREATE POLICY "milestone_tasks_delete" ON milestone_tasks
    FOR DELETE TO authenticated
    USING ((SELECT private.can_write_blueprint(
        (SELECT blueprint_id FROM milestones WHERE id = milestone_id)
    )));

-- 6. 觸發器：自動計算里程碑進度
CREATE OR REPLACE FUNCTION private.update_milestone_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_milestone_id UUID;
    v_new_progress INTEGER;
BEGIN
    -- 獲取受影響的里程碑 ID
    IF TG_TABLE_NAME = 'tasks' THEN
        SELECT mt.milestone_id INTO v_milestone_id
        FROM milestone_tasks mt
        WHERE mt.task_id = COALESCE(NEW.id, OLD.id);
    ELSE
        v_milestone_id := COALESCE(NEW.milestone_id, OLD.milestone_id);
    END IF;
    
    IF v_milestone_id IS NOT NULL THEN
        -- 計算加權平均進度
        SELECT COALESCE(
            SUM(t.progress * mt.weight) / NULLIF(SUM(mt.weight), 0),
            0
        )::INTEGER INTO v_new_progress
        FROM milestone_tasks mt
        JOIN tasks t ON t.id = mt.task_id
        WHERE mt.milestone_id = v_milestone_id;
        
        -- 更新里程碑進度
        UPDATE milestones
        SET 
            progress = v_new_progress,
            status = CASE 
                WHEN v_new_progress >= 100 THEN 'completed'::public.milestone_status
                WHEN v_new_progress > 0 THEN 'in_progress'::public.milestone_status
                ELSE status
            END,
            completed_at = CASE 
                WHEN v_new_progress >= 100 AND completed_at IS NULL THEN NOW()
                ELSE completed_at
            END,
            updated_at = NOW()
        WHERE id = v_milestone_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 任務進度變更時更新里程碑
CREATE TRIGGER update_milestone_on_task_progress
    AFTER UPDATE OF progress, status ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION private.update_milestone_progress();

-- 里程碑任務關聯變更時更新
CREATE TRIGGER update_milestone_on_task_link
    AFTER INSERT OR DELETE ON milestone_tasks
    FOR EACH ROW
    EXECUTE FUNCTION private.update_milestone_progress();

-- 7. 更新時間戳觸發器
CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW
    EXECUTE FUNCTION private.update_updated_at();
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Milestone Management - Placeholder Migration' AS status;

-- ============================================================================
-- Migration: Task Time Logs (Placeholder)
-- Category: 07 - Module Tables
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟡 高 - 任務系統達標後實現
-- ============================================================================
-- 
-- 📋 功能說明：
-- 任務工時記錄系統
--
-- 🎯 目標：
-- 1. 記錄任務工時
-- 2. 支援多人協作時的個別工時
-- 3. 統計報表資料來源
--
-- 📦 計劃表結構：
-- task_time_logs
--   - id: UUID PRIMARY KEY
--   - task_id: UUID FK → tasks.id
--   - account_id: UUID FK → accounts.id (記錄者)
--   - work_date: DATE NOT NULL (工作日期)
--   - start_time: TIME (開始時間，選填)
--   - end_time: TIME (結束時間，選填)
--   - duration_minutes: INTEGER NOT NULL (工作時長，分鐘)
--   - description: TEXT (工作內容描述)
--   - is_billable: BOOLEAN DEFAULT true (是否計費)
--   - created_at: TIMESTAMPTZ
--   - updated_at: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 07 - Module Tables (tasks)
-- - 依賴 04 - Foundation Tables (accounts)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看任務工時
-- - 成員只能記錄自己的工時
-- - 專案經理可編輯所有工時
--
-- 📝 相關 PRD 章節：
-- - 4.3 任務系統 - 任務時間記錄
-- - 4.10 報表與分析 - 工時報表
-- - 10.34 GH-034: 檢視工時報表
--
-- ⚠️ 實作注意事項：
-- 1. 考慮時區處理
-- 2. 工時統計視圖整合
-- 3. 日誌系統整合（diary_entries）
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
CREATE TABLE IF NOT EXISTS task_time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    work_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
    description TEXT,
    is_billable BOOLEAN NOT NULL DEFAULT true,
    hourly_rate DECIMAL(10,2),  -- 時薪（選填）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (
        start_time IS NULL 
        OR end_time IS NULL 
        OR end_time > start_time
    )
);

-- 建立索引
CREATE INDEX idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX idx_task_time_logs_account ON task_time_logs(account_id);
CREATE INDEX idx_task_time_logs_date ON task_time_logs(work_date);
CREATE INDEX idx_task_time_logs_task_date ON task_time_logs(task_id, work_date);

-- 啟用 RLS
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "task_time_logs_select" ON task_time_logs
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(
        (SELECT blueprint_id FROM tasks WHERE id = task_id)
    )));

CREATE POLICY "task_time_logs_insert" ON task_time_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        account_id = (SELECT private.get_user_account_id())
        AND (SELECT private.has_blueprint_access(
            (SELECT blueprint_id FROM tasks WHERE id = task_id)
        ))
    );

CREATE POLICY "task_time_logs_update" ON task_time_logs
    FOR UPDATE TO authenticated
    USING (
        account_id = (SELECT private.get_user_account_id())
        OR (SELECT private.can_write_blueprint(
            (SELECT blueprint_id FROM tasks WHERE id = task_id)
        ))
    )
    WITH CHECK (
        account_id = (SELECT private.get_user_account_id())
        OR (SELECT private.can_write_blueprint(
            (SELECT blueprint_id FROM tasks WHERE id = task_id)
        ))
    );

CREATE POLICY "task_time_logs_delete" ON task_time_logs
    FOR DELETE TO authenticated
    USING (
        account_id = (SELECT private.get_user_account_id())
        OR (SELECT private.is_blueprint_owner(
            (SELECT blueprint_id FROM tasks WHERE id = task_id)
        ))
    );

-- 觸發器
CREATE TRIGGER update_task_time_logs_updated_at
    BEFORE UPDATE ON task_time_logs
    FOR EACH ROW
    EXECUTE FUNCTION private.update_updated_at();

-- 統計視圖
CREATE OR REPLACE VIEW task_time_summary AS
SELECT 
    t.id AS task_id,
    t.blueprint_id,
    t.name AS task_name,
    COUNT(ttl.id) AS log_count,
    SUM(ttl.duration_minutes) AS total_minutes,
    ROUND(SUM(ttl.duration_minutes) / 60.0, 2) AS total_hours,
    COUNT(DISTINCT ttl.account_id) AS worker_count,
    MIN(ttl.work_date) AS first_log_date,
    MAX(ttl.work_date) AS last_log_date
FROM tasks t
LEFT JOIN task_time_logs ttl ON t.id = ttl.task_id
GROUP BY t.id, t.blueprint_id, t.name;
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Task Time Logs - Placeholder Migration' AS status;

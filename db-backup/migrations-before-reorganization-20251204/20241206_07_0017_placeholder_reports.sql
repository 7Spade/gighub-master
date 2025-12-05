-- ============================================================================
-- Migration: Reports (Placeholder)
-- Category: 07 - Module Tables
-- Status: PLACEHOLDER - 尚未實現
-- Priority: 🟢 中 - 報表與分析模組
-- ============================================================================
-- 
-- 📋 功能說明：
-- 報表生成與管理系統
--
-- 🎯 目標：
-- 1. 進度報表生成
-- 2. 品質報表生成
-- 3. 工時報表生成
-- 4. 報表匯出（PDF/Excel）
-- 5. 報表排程自動生成
--
-- 📦 計劃表結構：
-- reports
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - report_type: TEXT ('progress', 'quality', 'timesheet', 'financial', 'custom')
--   - title: TEXT NOT NULL
--   - description: TEXT
--   - parameters: JSONB (報表參數，如日期範圍、篩選條件)
--   - data: JSONB (報表資料快照)
--   - file_path: TEXT (匯出檔案路徑)
--   - file_format: TEXT ('pdf', 'xlsx', 'csv')
--   - status: TEXT ('generating', 'completed', 'failed')
--   - generated_by: UUID FK → accounts.id
--   - generated_at: TIMESTAMPTZ
--   - created_at: TIMESTAMPTZ
--   - expires_at: TIMESTAMPTZ (報表過期時間)
--
-- report_schedules
--   - id: UUID PRIMARY KEY
--   - blueprint_id: UUID FK → blueprints.id
--   - report_type: TEXT
--   - title: TEXT
--   - parameters: JSONB
--   - cron_expression: TEXT (排程表達式)
--   - recipients: UUID[] (收件者帳號 ID)
--   - is_active: BOOLEAN
--   - last_run_at: TIMESTAMPTZ
--   - next_run_at: TIMESTAMPTZ
--   - created_by: UUID FK → accounts.id
--   - created_at: TIMESTAMPTZ
--
-- 📐 依賴關係：
-- - 依賴 06 - Blueprint Tables (blueprints)
-- - 依賴 04 - Foundation Tables (accounts)
--
-- 🔒 RLS 政策需求：
-- - 藍圖成員可查看報表
-- - 專案經理可建立報表
-- - 報表排程由有權限者建立
--
-- 📝 相關 PRD 章節：
-- - 4.10 報表與分析
-- - 10.32 GH-032: 檢視進度報表
-- - 10.33 GH-033: 檢視品質報表
-- - 10.34 GH-034: 檢視工時報表
--
-- ⚠️ 實作注意事項：
-- 1. 大報表考慮異步生成
-- 2. 報表資料快照避免即時查詢
-- 3. 定期清理過期報表
-- 4. 考慮使用 pg_cron 實現排程
-- ============================================================================

-- TODO: 此遷移尚未實現，以下為預計的 SQL 結構

/*
-- 1. 建立報表類型
DO $$ BEGIN
    CREATE TYPE public.report_type AS ENUM (
        'progress',     -- 進度報表
        'quality',      -- 品質報表
        'timesheet',    -- 工時報表
        'financial',    -- 財務報表
        'custom'        -- 自訂報表
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.report_status AS ENUM (
        'pending',      -- 待生成
        'generating',   -- 生成中
        'completed',    -- 已完成
        'failed',       -- 生成失敗
        'expired'       -- 已過期
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. 報表主表
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    report_type public.report_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}',
    data JSONB,  -- 報表資料快照
    summary JSONB,  -- 報表摘要
    file_path TEXT,  -- Storage 路徑
    file_format TEXT CHECK (file_format IN ('pdf', 'xlsx', 'csv', 'html')),
    file_size_bytes BIGINT,
    status public.report_status NOT NULL DEFAULT 'pending',
    error_message TEXT,  -- 失敗原因
    generated_by UUID REFERENCES accounts(id),
    generated_at TIMESTAMPTZ,
    generation_duration_ms INTEGER,  -- 生成耗時
    view_count INTEGER NOT NULL DEFAULT 0,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ  -- NULL 表示永不過期
);

-- 3. 報表排程表
CREATE TABLE IF NOT EXISTS report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
    report_type public.report_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}',
    cron_expression TEXT NOT NULL,  -- 如 '0 8 * * 1' = 每週一早上 8 點
    timezone TEXT NOT NULL DEFAULT 'Asia/Taipei',
    recipients UUID[] DEFAULT '{}',  -- 收件者帳號 ID
    email_recipients TEXT[] DEFAULT '{}',  -- Email 收件者
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMPTZ,
    last_report_id UUID REFERENCES reports(id),
    next_run_at TIMESTAMPTZ,
    failure_count INTEGER NOT NULL DEFAULT 0,
    max_failures INTEGER NOT NULL DEFAULT 3,  -- 超過後自動停用
    created_by UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 建立索引
CREATE INDEX idx_reports_blueprint ON reports(blueprint_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);
CREATE INDEX idx_reports_expires ON reports(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_report_schedules_blueprint ON report_schedules(blueprint_id);
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run_at) WHERE is_active = true;

-- 5. 啟用 RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

-- RLS 政策
CREATE POLICY "reports_select" ON reports
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "reports_insert" ON reports
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "reports_delete" ON reports
    FOR DELETE TO authenticated
    USING ((SELECT private.is_blueprint_owner(blueprint_id)));

CREATE POLICY "report_schedules_select" ON report_schedules
    FOR SELECT TO authenticated
    USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "report_schedules_insert" ON report_schedules
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "report_schedules_update" ON report_schedules
    FOR UPDATE TO authenticated
    USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "report_schedules_delete" ON report_schedules
    FOR DELETE TO authenticated
    USING ((SELECT private.is_blueprint_owner(blueprint_id)));

-- 6. 過期報表清理函數 (配合 pg_cron)
CREATE OR REPLACE FUNCTION private.cleanup_expired_reports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 刪除過期報表
    WITH deleted AS (
        DELETE FROM reports
        WHERE expires_at < NOW()
        AND status = 'completed'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    -- 更新狀態為過期
    UPDATE reports
    SET status = 'expired'
    WHERE expires_at < NOW()
    AND status != 'expired';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- pg_cron 排程 (需要啟用 pg_cron 擴展)
-- SELECT cron.schedule('cleanup-expired-reports', '0 2 * * *', 'SELECT private.cleanup_expired_reports()');
*/

-- 實作時移除此註解並取消上方 SQL 的註解
SELECT 'Reports - Placeholder Migration' AS status;

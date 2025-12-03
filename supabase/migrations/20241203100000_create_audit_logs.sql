-- Migration: Create Audit Logs Table
-- Description: 審計日誌表 - 企業級不可變審計記錄
-- Features:
--   - Append-only immutable records
--   - Comprehensive operation tracking
--   - Evidence chain preservation
--   - High throughput write operations

-- ============================================================================
-- Enums
-- ============================================================================

-- 審計動作類型
CREATE TYPE audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'view',
  'export',
  'import',
  'approve',
  'reject',
  'assign',
  'unassign',
  'login',
  'logout',
  'password_change',
  'permission_change',
  'role_change',
  'status_change',
  'archive',
  'restore',
  'share',
  'comment',
  'upload',
  'download'
);

-- 審計嚴重程度
CREATE TYPE audit_severity AS ENUM (
  'info',
  'warning',
  'error',
  'critical'
);

-- 審計實體類型
CREATE TYPE audit_entity_type AS ENUM (
  'account',
  'organization',
  'blueprint',
  'task',
  'diary',
  'file',
  'issue',
  'checklist',
  'acceptance',
  'contract',
  'payment',
  'notification',
  'comment',
  'team',
  'role',
  'permission'
);

-- 審計操作者類型
CREATE TYPE audit_actor_type AS ENUM (
  'user',
  'system',
  'bot'
);

-- ============================================================================
-- Table: audit_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 資料隔離
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- 實體資訊
  entity_type audit_entity_type NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  
  -- 操作資訊
  action audit_action NOT NULL,
  actor_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  actor_name TEXT,
  actor_type audit_actor_type DEFAULT 'user',
  severity audit_severity DEFAULT 'info',
  
  -- 變更內容
  old_value JSONB,
  new_value JSONB,
  changes JSONB,
  
  -- 元數據
  metadata JSONB,
  context JSONB,
  
  -- 請求追蹤
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  
  -- 時間戳 (不可變)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes (Optimized for common query patterns)
-- ============================================================================

-- 藍圖查詢
CREATE INDEX idx_audit_logs_blueprint_id ON audit_logs(blueprint_id) WHERE blueprint_id IS NOT NULL;

-- 組織查詢
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id) WHERE organization_id IS NOT NULL;

-- 實體類型和 ID 查詢
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- 動作查詢
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- 操作者查詢
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);

-- 時間範圍查詢
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 複合索引：藍圖 + 時間
CREATE INDEX idx_audit_logs_blueprint_time ON audit_logs(blueprint_id, created_at DESC) WHERE blueprint_id IS NOT NULL;

-- 複合索引：實體 + 時間
CREATE INDEX idx_audit_logs_entity_time ON audit_logs(entity_type, entity_id, created_at DESC);

-- 嚴重程度查詢 (用於警告和錯誤過濾)
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('warning', 'error', 'critical');

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 查看權限：帳戶可以查看所屬組織的審計日誌
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    -- 使用者可以查看自己的操作
    actor_id = (select auth.uid())
    OR
    -- 使用者可以查看所屬組織的審計日誌
    (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members WHERE account_id = (select auth.uid())
      )
    )
    OR
    -- 使用者可以查看所屬藍圖的審計日誌
    (
      blueprint_id IS NOT NULL
      AND blueprint_id IN (
        SELECT blueprint_id FROM blueprint_members WHERE account_id = (select auth.uid())
      )
    )
  );

-- 插入權限：任何認證使用者都可以插入 (記錄操作)
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 不允許更新 (不可變)
-- 不允許刪除 (不可變)

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- 記錄審計日誌函數
CREATE OR REPLACE FUNCTION log_audit(
  p_blueprint_id UUID,
  p_organization_id UUID,
  p_entity_type audit_entity_type,
  p_entity_id UUID,
  p_entity_name TEXT,
  p_action audit_action,
  p_severity audit_severity DEFAULT 'info',
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_context JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_audit_id UUID;
  v_actor_name TEXT;
BEGIN
  -- 取得操作者名稱
  SELECT name INTO v_actor_name FROM public.accounts WHERE id = (select auth.uid());
  
  -- 插入審計日誌
  INSERT INTO public.audit_logs (
    blueprint_id,
    organization_id,
    entity_type,
    entity_id,
    entity_name,
    action,
    actor_id,
    actor_name,
    severity,
    old_value,
    new_value,
    changes,
    metadata,
    context
  ) VALUES (
    p_blueprint_id,
    p_organization_id,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_action,
    (select auth.uid()),
    v_actor_name,
    p_severity,
    p_old_value,
    p_new_value,
    p_changes,
    p_metadata,
    p_context
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE audit_logs IS '審計日誌表 - 記錄所有系統操作的不可變審計追蹤';
COMMENT ON COLUMN audit_logs.id IS '唯一識別碼';
COMMENT ON COLUMN audit_logs.blueprint_id IS '藍圖 ID (資料隔離)';
COMMENT ON COLUMN audit_logs.organization_id IS '組織 ID';
COMMENT ON COLUMN audit_logs.entity_type IS '被操作實體的類型';
COMMENT ON COLUMN audit_logs.entity_id IS '被操作實體的 ID';
COMMENT ON COLUMN audit_logs.entity_name IS '實體名稱快照';
COMMENT ON COLUMN audit_logs.action IS '執行的操作類型';
COMMENT ON COLUMN audit_logs.actor_id IS '操作者的帳戶 ID';
COMMENT ON COLUMN audit_logs.actor_name IS '操作者名稱快照';
COMMENT ON COLUMN audit_logs.actor_type IS '操作者類型 (user/system/bot)';
COMMENT ON COLUMN audit_logs.severity IS '事件嚴重程度';
COMMENT ON COLUMN audit_logs.old_value IS '變更前的狀態快照';
COMMENT ON COLUMN audit_logs.new_value IS '變更後的狀態快照';
COMMENT ON COLUMN audit_logs.changes IS '變更差異列表';
COMMENT ON COLUMN audit_logs.metadata IS '額外的操作元數據';
COMMENT ON COLUMN audit_logs.context IS '執行上下文 (路由、端點等)';
COMMENT ON COLUMN audit_logs.ip_address IS '請求的 IP 地址';
COMMENT ON COLUMN audit_logs.user_agent IS '請求的 User Agent';
COMMENT ON COLUMN audit_logs.request_id IS '請求追蹤 ID';
COMMENT ON COLUMN audit_logs.created_at IS '建立時間';

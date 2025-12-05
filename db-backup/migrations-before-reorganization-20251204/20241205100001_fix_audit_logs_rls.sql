-- ============================================================================
-- Migration: Fix Audit Logs RLS Policies
-- Description: 修復審計日誌 RLS 政策中的 auth.uid() 使用錯誤
-- Created: 2024-12-04
--
-- Problem:
-- 審計日誌 RLS 政策使用 `account_id = (select auth.uid())` 是錯誤的
-- auth.uid() 返回 auth.users.id，不是 accounts.id
-- actor_id 是 references accounts(id)，所以需要使用 private.get_user_account_id()
-- ============================================================================

-- ############################################################################
-- Fix Audit Logs RLS Policy
-- ############################################################################

DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;

CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    -- 使用者可以查看自己的操作
    actor_id = (SELECT private.get_user_account_id())
    OR
    -- 使用者可以查看所屬組織的審計日誌
    (
      organization_id IS NOT NULL
      AND (SELECT private.is_organization_member(organization_id))
    )
    OR
    -- 使用者可以查看所屬藍圖的審計日誌
    (
      blueprint_id IS NOT NULL
      AND (SELECT private.has_blueprint_access(blueprint_id))
    )
  );

-- ============================================================================
-- Fix log_audit Helper Function
-- ============================================================================

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
  v_actor_id UUID;
  v_actor_name TEXT;
BEGIN
  -- 取得操作者 account_id
  v_actor_id := (SELECT private.get_user_account_id());
  
  -- 取得操作者名稱
  SELECT name INTO v_actor_name FROM public.accounts WHERE id = v_actor_id;
  
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
    v_actor_id,
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_audit(UUID, UUID, audit_entity_type, UUID, TEXT, audit_action, audit_severity, JSONB, JSONB, JSONB, JSONB, JSONB) TO authenticated;

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON POLICY audit_logs_select_policy ON audit_logs IS 
  '審計日誌 SELECT 政策 - 使用 private.get_user_account_id() 正確識別用戶';

COMMENT ON FUNCTION log_audit IS 
  '記錄審計日誌函數 - 使用 private.get_user_account_id() 正確獲取 actor_id';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;
-- 恢復原始函數請參考 20241203100000_create_audit_logs.sql

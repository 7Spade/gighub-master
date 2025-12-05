-- ============================================================================
-- Migration: Fix audit_logs actor_id constraint and add log function
-- Description: 修復 audit_logs actor_id 約束並建立 RPC 函數
-- ============================================================================

-- Allow actor_id to be nullable for system-generated audit logs
ALTER TABLE public.audit_logs 
  ALTER COLUMN actor_id DROP NOT NULL;

-- log_audit()
-- 記錄審計日誌，自動將 auth.uid() 轉換為 account_id
CREATE OR REPLACE FUNCTION public.log_audit(
  p_entity_type audit_entity_type,
  p_entity_id UUID,
  p_action audit_action,
  p_entity_name TEXT DEFAULT NULL,
  p_blueprint_id UUID DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_severity audit_severity DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID;
  v_actor_name TEXT;
  v_audit_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- 1. 取得當前認證用戶
  v_auth_user_id := auth.uid();
  
  -- 2. 查找對應的 account_id 和用戶名稱（如果用戶已登入）
  IF v_auth_user_id IS NOT NULL THEN
    SELECT id, name INTO v_actor_id, v_actor_name
    FROM public.accounts
    WHERE auth_user_id = v_auth_user_id
      AND type = 'user'
      AND status != 'deleted'
    LIMIT 1;
  END IF;
  
  -- 3. 插入審計日誌記錄
  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    entity_name,
    action,
    actor_id,
    actor_name,
    actor_type,
    blueprint_id,
    organization_id,
    old_value,
    new_value,
    metadata,
    severity
  )
  VALUES (
    p_entity_type,
    p_entity_id,
    p_entity_name,
    p_action,
    v_actor_id,
    COALESCE(v_actor_name, 'System'),
    'user',
    p_blueprint_id,
    p_organization_id,
    p_old_value,
    p_new_value,
    p_metadata,
    p_severity
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_audit(
  audit_entity_type, UUID, audit_action, TEXT, UUID, UUID, JSONB, JSONB, JSONB, audit_severity
) TO authenticated;

COMMENT ON FUNCTION public.log_audit(
  audit_entity_type, UUID, audit_action, TEXT, UUID, UUID, JSONB, JSONB, JSONB, audit_severity
) IS '記錄審計日誌 (SECURITY DEFINER) - 自動將 auth.uid() 轉換為 account_id';

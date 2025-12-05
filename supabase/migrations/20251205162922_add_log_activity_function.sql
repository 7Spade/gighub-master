-- ============================================================================
-- Migration: Add log_activity function
-- Description: 建立活動記錄 API 函數，自動處理 auth.uid() 到 account_id 的映射
-- ============================================================================

-- log_activity()
-- 記錄活動到 activities 表，自動將 auth.uid() 轉換為 account_id
CREATE OR REPLACE FUNCTION public.log_activity(
  p_blueprint_id UUID,
  p_entity_type entity_type,
  p_entity_id UUID,
  p_activity_type activity_type,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID;
  v_activity_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- 1. 取得當前認證用戶
  v_auth_user_id := auth.uid();
  
  -- 2. 查找對應的 account_id（如果用戶已登入）
  IF v_auth_user_id IS NOT NULL THEN
    SELECT id INTO v_actor_id
    FROM public.accounts
    WHERE auth_user_id = v_auth_user_id
      AND type = 'user'
      AND status != 'deleted'
    LIMIT 1;
  END IF;
  
  -- 3. 插入活動記錄
  INSERT INTO public.activities (
    blueprint_id,
    entity_type,
    entity_id,
    activity_type,
    actor_id,
    metadata,
    old_value,
    new_value
  )
  VALUES (
    p_blueprint_id,
    p_entity_type,
    p_entity_id,
    p_activity_type,
    v_actor_id,
    p_metadata,
    p_old_value,
    p_new_value
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_activity(UUID, entity_type, UUID, activity_type, JSONB, JSONB, JSONB) TO authenticated;

COMMENT ON FUNCTION public.log_activity(UUID, entity_type, UUID, activity_type, JSONB, JSONB, JSONB)
  IS '記錄活動 (SECURITY DEFINER) - 自動將 auth.uid() 轉換為 account_id';

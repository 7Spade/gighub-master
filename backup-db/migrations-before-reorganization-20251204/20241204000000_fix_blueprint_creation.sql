-- ============================================================================
-- Migration: Fix Blueprint Creation
-- Description: 修復藍圖創建問題 - 添加缺失的 RLS 政策並更新 create_blueprint 函數
-- Created: 2024-12-04
-- 
-- Problem Analysis:
-- 1. blueprints 表缺少 INSERT RLS 政策，導致直接插入失敗
-- 2. create_blueprint RPC 函數是 SECURITY DEFINER，應該繞過 RLS
-- 3. 為了防止未來的問題，添加 INSERT 政策作為備選方案
-- ============================================================================

-- ############################################################################
-- PART 1: 添加缺失的 RLS 政策
-- ############################################################################

-- ----------------------------------------------------------------------------
-- blueprints_insert 政策
-- 允許用戶為自己創建藍圖，或為其擁有 owner/admin 權限的組織創建藍圖
-- 
-- 注意：正常流程應該通過 create_blueprint RPC 函數，此政策作為備選
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "blueprints_insert" ON blueprints;

CREATE POLICY "blueprints_insert" ON blueprints 
  FOR INSERT TO authenticated 
  WITH CHECK (
    -- 情況 1: 個人藍圖 - owner_id 是當前用戶的 account_id
    (
      EXISTS (
        SELECT 1 FROM accounts a
        WHERE a.id = owner_id
        AND a.auth_user_id = (SELECT auth.uid())
        AND a.type = 'user'
      )
    )
    OR
    -- 情況 2: 組織藍圖 - 用戶是組織的 owner 或 admin
    (
      EXISTS (
        SELECT 1 FROM organizations o
        JOIN organization_members om ON om.organization_id = o.id
        JOIN accounts a ON a.id = om.account_id
        WHERE o.account_id = owner_id
        AND a.auth_user_id = (SELECT auth.uid())
        AND om.role IN ('owner', 'admin')
      )
    )
  );

-- ----------------------------------------------------------------------------
-- teams_insert 政策 (如果缺失)
-- 允許組織 owner/admin 創建團隊
-- 
-- 注意：正常流程應該通過 create_team RPC 函數，此政策作為備選
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "teams_insert" ON teams;

CREATE POLICY "teams_insert" ON teams 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT private.is_organization_admin(organization_id))
  );

-- ############################################################################
-- PART 2: 修復 create_blueprint 函數
-- ############################################################################

-- ----------------------------------------------------------------------------
-- create_blueprint() - 更新版本
-- 修復以下問題：
-- 1. 狀態檢查改為 != 'deleted' 而非 = 'active'（更寬容）
-- 2. 添加 slug 存在性檢查
-- 3. 確保 blueprint_members 插入包含所有必要欄位
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_blueprint(
  p_owner_id UUID,
  p_name VARCHAR(255),
  p_slug VARCHAR(100) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_cover_url TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT false,
  p_enabled_modules public.module_type[] DEFAULT ARRAY['tasks']::public.module_type[]
)
RETURNS TABLE (out_blueprint_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_account_id UUID;
  v_blueprint_id UUID;
  v_slug VARCHAR(100);
  v_auth_user_id UUID;
  v_owner_type public.account_type;
  v_can_create BOOLEAN := false;
BEGIN
  -- 1. 驗證用戶已登入
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 2. 取得用戶 account_id
  SELECT id INTO v_user_account_id
  FROM public.accounts
  WHERE auth_user_id = v_auth_user_id
    AND type = 'user'
    AND status != 'deleted'
  LIMIT 1;

  IF v_user_account_id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;

  -- 3. 驗證 owner_id 並檢查權限
  -- 使用 != 'deleted' 而非 = 'active' 以支持更多狀態
  SELECT type INTO v_owner_type
  FROM public.accounts
  WHERE id = p_owner_id AND status != 'deleted';

  IF v_owner_type IS NULL THEN
    RAISE EXCEPTION 'Owner account not found or deleted';
  END IF;

  -- 3a. 個人藍圖: owner_id 必須是用戶自己
  IF v_owner_type = 'user' THEN
    IF p_owner_id = v_user_account_id THEN
      v_can_create := true;
    END IF;
  -- 3b. 組織藍圖: 用戶必須是組織 owner/admin
  ELSIF v_owner_type = 'org' THEN
    IF EXISTS (
      SELECT 1 FROM public.organizations o
      JOIN public.organization_members om ON om.organization_id = o.id
      WHERE o.account_id = p_owner_id
      AND om.account_id = v_user_account_id
      AND om.role IN ('owner', 'admin')
    ) THEN
      v_can_create := true;
    END IF;
  END IF;

  IF NOT v_can_create THEN
    RAISE EXCEPTION 'Permission denied: cannot create blueprint for this owner';
  END IF;

  -- 4. 產生 slug
  IF p_slug IS NULL OR p_slug = '' THEN
    v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    -- 確保 slug 唯一性（排除已刪除的藍圖）
    WHILE EXISTS (
      SELECT 1 FROM public.blueprints 
      WHERE owner_id = p_owner_id 
      AND slug = v_slug 
      AND deleted_at IS NULL
    ) LOOP
      v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
    END LOOP;
  ELSE
    v_slug := p_slug;
    -- 檢查 slug 是否已存在
    IF EXISTS (
      SELECT 1 FROM public.blueprints
      WHERE owner_id = p_owner_id
      AND slug = v_slug
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Blueprint slug already exists for this owner';
    END IF;
  END IF;

  -- 5. 建立藍圖
  INSERT INTO public.blueprints (
    owner_id, name, slug, description, cover_url, is_public, status, enabled_modules, created_by
  )
  VALUES (
    p_owner_id, p_name, v_slug, p_description, p_cover_url, p_is_public, 'active', p_enabled_modules, v_user_account_id
  )
  RETURNING id INTO v_blueprint_id;

  -- 6. 將建立者加入藍圖成員 (role=maintainer, business_role=project_manager)
  INSERT INTO public.blueprint_members (blueprint_id, account_id, role, business_role, is_external)
  VALUES (v_blueprint_id, v_user_account_id, 'maintainer', 'project_manager', false)
  ON CONFLICT (blueprint_id, account_id) DO NOTHING;

  RETURN QUERY SELECT v_blueprint_id;
END;
$$;

-- 確保授權
GRANT EXECUTE ON FUNCTION public.create_blueprint(UUID, VARCHAR, VARCHAR, TEXT, TEXT, BOOLEAN, public.module_type[]) TO authenticated;

-- ============================================================================
-- Documentation Comments
-- ============================================================================
COMMENT ON POLICY "blueprints_insert" ON blueprints 
  IS '藍圖 INSERT 政策 - 允許用戶為自己或其管理的組織創建藍圖';
COMMENT ON POLICY "teams_insert" ON teams 
  IS '團隊 INSERT 政策 - 允許組織 owner/admin 創建團隊';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP POLICY IF EXISTS "blueprints_insert" ON blueprints;
-- DROP POLICY IF EXISTS "teams_insert" ON teams;
-- -- 恢復原始 create_blueprint 函數（如果需要）

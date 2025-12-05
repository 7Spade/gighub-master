-- ============================================================================
-- Migration: 12 - API Functions
-- Description: 建立公開 API 函數 (組織/團隊/藍圖建立)
-- Category: 12 - API Functions
-- 
-- 這些函數使用 SECURITY DEFINER 來繞過 RLS，確保原子性操作
-- ============================================================================

-- ############################################################################
-- PART 1: ORGANIZATION API (組織功能)
-- ############################################################################

-- create_organization()
-- 建立組織帳號 + 組織記錄，並自動將建立者加入為 owner
CREATE OR REPLACE FUNCTION public.create_organization(
  p_name VARCHAR(255),
  p_email VARCHAR(255) DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_slug VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  out_account_id UUID,
  out_organization_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_account_id UUID;
  v_org_account_id UUID;
  v_organization_id UUID;
  v_slug VARCHAR(100);
  v_auth_user_id UUID;
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

  -- 3. 產生 slug
  IF p_slug IS NULL OR p_slug = '' THEN
    v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) LOOP
      v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
    END LOOP;
  ELSE
    v_slug := p_slug;
  END IF;

  -- 4. 建立 org account
  INSERT INTO public.accounts (auth_user_id, type, name, email, avatar_url, status)
  VALUES (NULL, 'org', p_name, p_email, p_avatar_url, 'active')
  RETURNING id INTO v_org_account_id;

  -- 5. 建立 organization 記錄
  INSERT INTO public.organizations (account_id, name, slug, description, logo_url, created_by)
  VALUES (v_org_account_id, p_name, v_slug, NULL, p_avatar_url, v_user_account_id)
  RETURNING id INTO v_organization_id;

  -- 6. 將建立者加入 organization_members (role=owner)
  INSERT INTO public.organization_members (organization_id, account_id, role)
  VALUES (v_organization_id, v_user_account_id, 'owner')
  ON CONFLICT (organization_id, account_id) DO NOTHING;

  -- 7. 回傳建立的 ID
  RETURN QUERY SELECT v_org_account_id, v_organization_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_organization(VARCHAR, VARCHAR, TEXT, VARCHAR) TO authenticated;

-- handle_new_organization() - 觸發器
-- 當 organization 建立時，確保建立者被加入為 owner
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    SELECT id INTO v_account_id FROM public.accounts WHERE id = NEW.created_by LIMIT 1;
    IF v_account_id IS NULL THEN
      SELECT id INTO v_account_id FROM public.accounts WHERE auth_user_id = NEW.created_by LIMIT 1;
    END IF;
    IF v_account_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organization_id, account_id, role)
      VALUES (NEW.id, v_account_id, 'owner')
      ON CONFLICT (organization_id, account_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- ############################################################################
-- PART 2: TEAM API (團隊功能)
-- ############################################################################

-- create_team()
-- 在組織中建立團隊，需要 owner/admin 權限
CREATE OR REPLACE FUNCTION public.create_team(
  p_organization_id UUID,
  p_name VARCHAR(255),
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (out_team_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_account_id UUID;
  v_team_id UUID;
  v_auth_user_id UUID;
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

  -- 3. 驗證用戶是組織 owner/admin
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.accounts a ON a.id = om.account_id
    WHERE om.organization_id = p_organization_id
    AND a.auth_user_id = v_auth_user_id
    AND om.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'User is not an admin or owner of the organization';
  END IF;

  -- 4. 檢查團隊名稱是否已存在
  IF EXISTS (
    SELECT 1 FROM public.teams
    WHERE organization_id = p_organization_id
    AND name = p_name
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Team name already exists in this organization';
  END IF;

  -- 5. 建立團隊
  INSERT INTO public.teams (organization_id, name, description, metadata)
  VALUES (p_organization_id, p_name, p_description, p_metadata)
  RETURNING id INTO v_team_id;

  -- 6. 將建立者加入團隊 (role=leader)
  INSERT INTO public.team_members (team_id, account_id, role)
  VALUES (v_team_id, v_user_account_id, 'leader')
  ON CONFLICT (team_id, account_id) DO NOTHING;

  RETURN QUERY SELECT v_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_team(UUID, VARCHAR, TEXT, JSONB) TO authenticated;

-- ############################################################################
-- PART 3: BLUEPRINT API (藍圖功能)
-- ############################################################################

-- create_blueprint()
-- 建立藍圖，支援個人和組織藍圖
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

GRANT EXECUTE ON FUNCTION public.create_blueprint(UUID, VARCHAR, VARCHAR, TEXT, TEXT, BOOLEAN, public.module_type[]) TO authenticated;

-- handle_new_blueprint() - 觸發器
-- 當 blueprint 建立時，確保建立者被加入為成員
CREATE OR REPLACE FUNCTION public.handle_new_blueprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    SELECT id INTO v_account_id FROM public.accounts WHERE id = NEW.created_by LIMIT 1;
    IF v_account_id IS NULL THEN
      SELECT id INTO v_account_id FROM public.accounts WHERE auth_user_id = NEW.created_by LIMIT 1;
    END IF;
    IF v_account_id IS NOT NULL THEN
      INSERT INTO public.blueprint_members (blueprint_id, account_id, role, business_role, is_external)
      VALUES (NEW.id, v_account_id, 'maintainer', 'project_manager', false)
      ON CONFLICT (blueprint_id, account_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_blueprint_created ON public.blueprints;
CREATE TRIGGER on_blueprint_created
  AFTER INSERT ON public.blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_blueprint();

-- ############################################################################
-- Documentation Comments
-- ############################################################################
COMMENT ON FUNCTION public.create_organization(VARCHAR, VARCHAR, TEXT, VARCHAR) 
  IS '建立組織 (SECURITY DEFINER) - 自動建立 org account 並加入建立者為 owner';
COMMENT ON FUNCTION public.handle_new_organization() 
  IS '組織觸發器 - 確保建立者被加入為 owner';
COMMENT ON FUNCTION public.create_team(UUID, VARCHAR, TEXT, JSONB) 
  IS '建立團隊 (SECURITY DEFINER) - 需要組織 owner/admin 權限';
COMMENT ON FUNCTION public.create_blueprint(UUID, VARCHAR, VARCHAR, TEXT, TEXT, BOOLEAN, public.module_type[]) 
  IS '建立藍圖 (SECURITY DEFINER) - 自動加入建立者為 maintainer';
COMMENT ON FUNCTION public.handle_new_blueprint() 
  IS '藍圖觸發器 - 確保建立者被加入為成員';

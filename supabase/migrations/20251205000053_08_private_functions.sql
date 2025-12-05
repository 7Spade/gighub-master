-- ============================================================================
-- Migration: 08 - Private RLS Helper Functions
-- Description: RLS 輔助函數 (SECURITY DEFINER)
-- Category: 08 - Private Functions
-- 
-- 注意：這些函數必須在所有表創建之後
-- ============================================================================

-- private.get_user_account_id()
CREATE OR REPLACE FUNCTION private.get_user_account_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE auth_user_id = auth.uid()
    AND type = 'user'
    AND status != 'deleted'
  LIMIT 1;
  
  RETURN v_account_id;
END;
$$;

-- private.is_account_owner()
CREATE OR REPLACE FUNCTION private.is_account_owner(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = p_account_id
    AND auth_user_id = auth.uid()
  );
END;
$$;

-- private.is_organization_member()
CREATE OR REPLACE FUNCTION private.is_organization_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.accounts a ON a.id = om.account_id
    WHERE om.organization_id = p_org_id
    AND a.auth_user_id = auth.uid()
  );
END;
$$;

-- private.get_organization_role()
CREATE OR REPLACE FUNCTION private.get_organization_role(p_org_id UUID)
RETURNS public.organization_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_role public.organization_role;
BEGIN
  SELECT om.role INTO v_role
  FROM public.organization_members om
  JOIN public.accounts a ON a.id = om.account_id
  WHERE om.organization_id = p_org_id
  AND a.auth_user_id = auth.uid();
  
  RETURN v_role;
END;
$$;

-- private.is_organization_admin()
CREATE OR REPLACE FUNCTION private.is_organization_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.accounts a ON a.id = om.account_id
    WHERE om.organization_id = p_org_id
    AND a.auth_user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  );
END;
$$;

-- private.is_team_member()
CREATE OR REPLACE FUNCTION private.is_team_member(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.accounts a ON a.id = tm.account_id
    WHERE tm.team_id = p_team_id
    AND a.auth_user_id = auth.uid()
  );
END;
$$;

-- private.is_team_leader()
CREATE OR REPLACE FUNCTION private.is_team_leader(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.accounts a ON a.id = tm.account_id
    WHERE tm.team_id = p_team_id
    AND a.auth_user_id = auth.uid()
    AND tm.role = 'leader'
  );
END;
$$;

-- private.is_blueprint_owner()
CREATE OR REPLACE FUNCTION private.is_blueprint_owner(p_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- 情況1: 個人藍圖 (owner 是 user account)
  IF EXISTS (
    SELECT 1 FROM public.blueprints b
    JOIN public.accounts a ON a.id = b.owner_id
    WHERE b.id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
    AND a.type = 'user'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 情況2: 組織藍圖，且用戶是組織 owner
  RETURN EXISTS (
    SELECT 1 FROM public.blueprints b
    JOIN public.organizations o ON o.account_id = b.owner_id
    JOIN public.organization_members om ON om.organization_id = o.id
    JOIN public.accounts a ON a.id = om.account_id
    WHERE b.id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
    AND om.role = 'owner'
  );
END;
$$;

-- private.has_blueprint_access()
CREATE OR REPLACE FUNCTION private.has_blueprint_access(p_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- 公開藍圖
  IF EXISTS (
    SELECT 1 FROM public.blueprints
    WHERE id = p_blueprint_id AND is_public = true
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 藍圖擁有者
  IF (SELECT private.is_blueprint_owner(p_blueprint_id)) THEN
    RETURN TRUE;
  END IF;
  
  -- 藍圖成員
  IF EXISTS (
    SELECT 1 FROM public.blueprint_members bm
    JOIN public.accounts a ON a.id = bm.account_id
    WHERE bm.blueprint_id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 透過團隊授權
  IF EXISTS (
    SELECT 1 FROM public.blueprint_team_roles btr
    JOIN public.team_members tm ON tm.team_id = btr.team_id
    JOIN public.accounts a ON a.id = tm.account_id
    WHERE btr.blueprint_id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 組織成員 (對組織藍圖有基本存取權)
  RETURN EXISTS (
    SELECT 1 FROM public.blueprints b
    JOIN public.organizations o ON o.account_id = b.owner_id
    JOIN public.organization_members om ON om.organization_id = o.id
    JOIN public.accounts a ON a.id = om.account_id
    WHERE b.id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
  );
END;
$$;

-- private.can_write_blueprint()
CREATE OR REPLACE FUNCTION private.can_write_blueprint(p_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- 藍圖擁有者
  IF (SELECT private.is_blueprint_owner(p_blueprint_id)) THEN
    RETURN TRUE;
  END IF;
  
  -- 藍圖成員 (contributor 或 maintainer)
  IF EXISTS (
    SELECT 1 FROM public.blueprint_members bm
    JOIN public.accounts a ON a.id = bm.account_id
    WHERE bm.blueprint_id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
    AND bm.role IN ('contributor', 'maintainer')
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 透過團隊授權 (write 或 admin)
  IF EXISTS (
    SELECT 1 FROM public.blueprint_team_roles btr
    JOIN public.team_members tm ON tm.team_id = btr.team_id
    JOIN public.accounts a ON a.id = tm.account_id
    WHERE btr.blueprint_id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
    AND btr.access_level IN ('write', 'admin')
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 組織 owner/admin (對組織藍圖有寫入權)
  RETURN EXISTS (
    SELECT 1 FROM public.blueprints b
    JOIN public.organizations o ON o.account_id = b.owner_id
    JOIN public.organization_members om ON om.organization_id = o.id
    JOIN public.accounts a ON a.id = om.account_id
    WHERE b.id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  );
END;
$$;

-- private.get_blueprint_business_role()
CREATE OR REPLACE FUNCTION private.get_blueprint_business_role(p_blueprint_id UUID)
RETURNS public.blueprint_business_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_business_role public.blueprint_business_role;
  v_is_owner BOOLEAN;
BEGIN
  -- Check if user is owner (owners are always project_manager)
  v_is_owner := (SELECT private.is_blueprint_owner(p_blueprint_id));
  IF v_is_owner THEN
    RETURN 'project_manager'::public.blueprint_business_role;
  END IF;

  -- Get business_role from blueprint_members
  SELECT bm.business_role INTO v_business_role
  FROM public.blueprint_members bm
  JOIN public.accounts a ON a.id = bm.account_id
  WHERE bm.blueprint_id = p_blueprint_id
  AND a.auth_user_id = auth.uid();
  
  RETURN COALESCE(v_business_role, 'observer'::public.blueprint_business_role);
END;
$$;

-- Grant: RLS 輔助函數執行權限
GRANT EXECUTE ON FUNCTION private.get_user_account_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_account_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_organization_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.get_organization_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_organization_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_team_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_team_leader(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_blueprint_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_blueprint_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_write_blueprint(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.get_blueprint_business_role(UUID) TO authenticated;

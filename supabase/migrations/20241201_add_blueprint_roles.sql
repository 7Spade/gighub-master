-- ============================================================================
-- Migration: Add Blueprint Roles Table for RBAC
-- 遷移：添加藍圖角色表以支持 RBAC
-- ============================================================================
--
-- This migration adds:
-- 1. blueprint_business_role enum - Business roles for construction site management
-- 2. blueprint_roles table - Custom role definitions per blueprint
-- 3. Update blueprint_members to support business roles
-- 4. RLS policies for the new table
--
-- Business Roles:
-- - project_manager: 專案經理 - Full blueprint-level authority
-- - site_director: 工地主任 - On-site management
-- - worker: 施工人員 - Task execution
-- - qa_staff: 品管人員 - Quality assurance
-- - observer: 觀察者 - View only
-- ============================================================================

-- ============================================================================
-- PART 1: ENUMS (列舉類型定義)
-- ============================================================================

-- 藍圖業務角色: project_manager=專案經理, site_director=工地主任, 
--               worker=施工人員, qa_staff=品管人員, observer=觀察者
CREATE TYPE blueprint_business_role AS ENUM (
  'project_manager',
  'site_director', 
  'worker',
  'qa_staff',
  'observer'
);

-- ============================================================================
-- PART 2: BLUEPRINT ROLES TABLE (藍圖角色表)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: blueprint_roles (藍圖角色定義)
-- Custom role definitions per blueprint, allowing future flexibility
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blueprint_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  business_role blueprint_business_role NOT NULL DEFAULT 'observer',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Each blueprint can only have one role with a given name
  CONSTRAINT blueprint_roles_name_unique UNIQUE (blueprint_id, name)
);

CREATE INDEX idx_blueprint_roles_blueprint ON blueprint_roles(blueprint_id);
CREATE INDEX idx_blueprint_roles_business_role ON blueprint_roles(business_role);

-- Trigger for updated_at
CREATE TRIGGER update_blueprint_roles_updated_at 
  BEFORE UPDATE ON blueprint_roles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- PART 3: UPDATE BLUEPRINT_MEMBERS (更新藍圖成員表)
-- ============================================================================

-- Add business_role column to blueprint_members
ALTER TABLE blueprint_members 
  ADD COLUMN IF NOT EXISTS business_role blueprint_business_role;

-- Add custom_role_id for linking to blueprint_roles
ALTER TABLE blueprint_members 
  ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES blueprint_roles(id) ON DELETE SET NULL;

-- Create index for the new columns
CREATE INDEX IF NOT EXISTS idx_blueprint_members_business_role ON blueprint_members(business_role);
CREATE INDEX IF NOT EXISTS idx_blueprint_members_custom_role ON blueprint_members(custom_role_id);

-- ============================================================================
-- PART 4: RLS POLICIES (資料列安全政策)
-- ============================================================================

-- Enable RLS
ALTER TABLE blueprint_roles ENABLE ROW LEVEL SECURITY;

-- blueprint_roles: read access for blueprint members
CREATE POLICY "blueprint_roles_select" ON blueprint_roles 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- blueprint_roles: only blueprint owner/maintainer can manage
CREATE POLICY "blueprint_roles_insert" ON blueprint_roles 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT private.is_blueprint_owner(blueprint_id)) OR 
    EXISTS (
      SELECT 1 FROM blueprint_members bm
      JOIN accounts a ON a.id = bm.account_id
      WHERE bm.blueprint_id = blueprint_roles.blueprint_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND bm.role = 'maintainer'
    )
  );

CREATE POLICY "blueprint_roles_update" ON blueprint_roles 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT private.is_blueprint_owner(blueprint_id)) OR 
    EXISTS (
      SELECT 1 FROM blueprint_members bm
      JOIN accounts a ON a.id = bm.account_id
      WHERE bm.blueprint_id = blueprint_roles.blueprint_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND bm.role = 'maintainer'
    )
  );

CREATE POLICY "blueprint_roles_delete" ON blueprint_roles 
  FOR DELETE TO authenticated 
  USING (
    (SELECT private.is_blueprint_owner(blueprint_id)) OR 
    EXISTS (
      SELECT 1 FROM blueprint_members bm
      JOIN accounts a ON a.id = bm.account_id
      WHERE bm.blueprint_id = blueprint_roles.blueprint_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND bm.role = 'maintainer'
    )
  );

-- ============================================================================
-- PART 5: HELPER FUNCTIONS (輔助函數)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- private.get_blueprint_business_role()
-- Get user's business role in a blueprint
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.get_blueprint_business_role(p_blueprint_id UUID)
RETURNS blueprint_business_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_business_role blueprint_business_role;
  v_is_owner BOOLEAN;
BEGIN
  -- Check if user is owner (owners are always project_manager)
  v_is_owner := (SELECT private.is_blueprint_owner(p_blueprint_id));
  IF v_is_owner THEN
    RETURN 'project_manager';
  END IF;

  -- Get business_role from blueprint_members
  SELECT bm.business_role INTO v_business_role
  FROM public.blueprint_members bm
  JOIN public.accounts a ON a.id = bm.account_id
  WHERE bm.blueprint_id = p_blueprint_id
  AND a.auth_user_id = auth.uid();
  
  RETURN COALESCE(v_business_role, 'observer');
END;
$$;

GRANT EXECUTE ON FUNCTION private.get_blueprint_business_role(UUID) TO authenticated;

-- ============================================================================
-- PART 6: DEFAULT ROLES (預設角色)
-- ============================================================================

-- Function to create default roles for a blueprint
CREATE OR REPLACE FUNCTION public.create_default_blueprint_roles(p_blueprint_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Project Manager
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'project_manager', 
    '專案經理', 
    '最高藍圖級權限，可管理所有設定和成員',
    'project_manager',
    true,
    1
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Site Director
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'site_director', 
    '工地主任', 
    '現場管理權限，可管理任務和日誌',
    'site_director',
    true,
    2
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Worker
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'worker', 
    '施工人員', 
    '任務執行權限，可創建和更新任務',
    'worker',
    true,
    3
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- QA Staff
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'qa_staff', 
    '品管人員', 
    '品質驗收權限，可執行品質檢查和驗收',
    'qa_staff',
    true,
    4
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Observer
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'observer', 
    '觀察者', 
    '僅檢視權限，只能查看內容',
    'observer',
    true,
    5
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_default_blueprint_roles(UUID) TO authenticated;

-- Trigger to auto-create default roles when a blueprint is created
CREATE OR REPLACE FUNCTION public.handle_new_blueprint_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.create_default_blueprint_roles(NEW.id);
  RETURN NEW;
END;
$$;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_blueprint_created_roles'
  ) THEN
    CREATE TRIGGER on_blueprint_created_roles
      AFTER INSERT ON blueprints
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_blueprint_roles();
  END IF;
END;
$$;

-- ============================================================================
-- PART 7: DOCUMENTATION (文件註解)
-- ============================================================================

COMMENT ON TABLE blueprint_roles IS '藍圖角色定義 - Custom role definitions per blueprint for RBAC';
COMMENT ON COLUMN blueprint_roles.name IS '角色名稱（唯一鍵）- Role name (unique per blueprint)';
COMMENT ON COLUMN blueprint_roles.display_name IS '顯示名稱 - Display name for UI';
COMMENT ON COLUMN blueprint_roles.business_role IS '業務角色 - Maps to permission set';
COMMENT ON COLUMN blueprint_roles.permissions IS '自訂權限 JSON - Custom permissions override';
COMMENT ON COLUMN blueprint_roles.is_default IS '是否為預設角色 - Cannot be deleted';

COMMENT ON COLUMN blueprint_members.business_role IS '業務角色 - Business role for permission checking';
COMMENT ON COLUMN blueprint_members.custom_role_id IS '自訂角色 ID - Reference to custom role definition';

COMMENT ON FUNCTION private.get_blueprint_business_role(UUID) IS '取得用戶在藍圖中的業務角色 - Get user business role in blueprint';
COMMENT ON FUNCTION public.create_default_blueprint_roles(UUID) IS '建立預設藍圖角色 - Create default roles for blueprint';

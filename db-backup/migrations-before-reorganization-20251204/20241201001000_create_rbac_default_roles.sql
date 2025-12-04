-- ============================================================================
-- Migration: Create RBAC Default Roles API
-- Description: PART 14 - RBAC 預設角色 API (建立預設角色)
-- Created: 2024-12-01
-- ============================================================================

-- ----------------------------------------------------------------------------
-- create_default_blueprint_roles()
-- 建立藍圖預設角色 (包含8種角色)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_default_blueprint_roles(p_blueprint_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Project Manager (專案經理)
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

  -- Site Director (工地主任)
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

  -- Site Supervisor (現場監督)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'site_supervisor', 
    '現場監督', 
    '現場監督權限，可監督任務執行和審核日誌',
    'site_supervisor',
    true,
    3
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Worker (施工人員)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'worker', 
    '施工人員', 
    '任務執行權限，可創建和更新任務',
    'worker',
    true,
    4
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- QA Staff (品管人員)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'qa_staff', 
    '品管人員', 
    '品質驗收權限，可執行品質檢查和驗收',
    'qa_staff',
    true,
    5
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Safety & Health (公共安全衛生)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'safety_health', 
    '公共安全衛生', 
    '安全衛生管理權限，可管理安全相關事項和檢查',
    'safety_health',
    true,
    6
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Finance (財務)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'finance', 
    '財務', 
    '財務管理權限，可查看和管理財務相關資料',
    'finance',
    true,
    7
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Observer (觀察者)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'observer', 
    '觀察者', 
    '僅檢視權限，只能查看內容',
    'observer',
    true,
    8
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_default_blueprint_roles(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- handle_new_blueprint_roles()
-- 藍圖建立時自動建立預設角色
-- ----------------------------------------------------------------------------
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

-- Trigger to auto-create default roles when a blueprint is created
CREATE TRIGGER on_blueprint_created_roles
  AFTER INSERT ON blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_blueprint_roles();

-- RBAC 函數註解
COMMENT ON FUNCTION public.create_default_blueprint_roles(UUID) IS '建立預設藍圖角色 - Create default roles for blueprint';
COMMENT ON FUNCTION public.handle_new_blueprint_roles() IS '藍圖觸發器 - 自動建立預設角色';

-- ============================================================================
-- Migration: 070_rbac_default_roles
-- Layer: 07_seeds
-- Description: RBAC 預設角色種子資料
-- Dependencies: 02_workspace/021_blueprint_roles
-- ============================================================================

-- ############################################################################
-- 預設藍圖角色定義
-- 這些角色會在創建藍圖時自動初始化
-- ############################################################################

-- 此文件定義了 RBAC 預設角色的結構
-- 實際角色會在 Blueprint 創建時透過觸發器或應用程式邏輯初始化

-- 業務角色對應說明：
-- project_manager: 專案經理 - 最高權限，可管理整個專案
-- site_director: 工地主任 - 現場最高管理者
-- site_supervisor: 現場監督 - 負責監督施工品質和進度
-- worker: 施工人員 - 一般施工人員，可提交日報
-- qa_staff: 品管人員 - 負責品質檢驗
-- safety_health: 公共安全衛生 - 負責安全和衛生管理
-- finance: 財務 - 財務相關操作
-- observer: 觀察者 - 只讀權限

-- ============================================================================
-- 角色權限矩陣 (用於參考)
-- ============================================================================
-- 
-- | 角色              | 藍圖管理 | 成員管理 | 任務管理 | 日誌管理 | 品管 | 驗收 | 問題管理 | 財務 |
-- |-------------------|----------|----------|----------|----------|------|------|----------|------|
-- | project_manager   | ✓        | ✓        | ✓        | ✓        | ✓    | ✓    | ✓        | ✓    |
-- | site_director     | -        | ✓        | ✓        | ✓        | ✓    | ✓    | ✓        | -    |
-- | site_supervisor   | -        | -        | ✓        | ✓        | ✓    | -    | ✓        | -    |
-- | worker            | -        | -        | 查看     | 提交     | -    | -    | 提交     | -    |
-- | qa_staff          | -        | -        | 查看     | 查看     | ✓    | ✓    | ✓        | -    |
-- | safety_health     | -        | -        | 查看     | 查看     | 查看 | -    | ✓        | -    |
-- | finance           | -        | -        | 查看     | 查看     | -    | -    | -        | ✓    |
-- | observer          | -        | -        | 查看     | 查看     | 查看 | 查看 | 查看     | -    |
-- 

-- ============================================================================
-- 自動初始化藍圖角色的函數
-- ============================================================================

CREATE OR REPLACE FUNCTION public.initialize_blueprint_roles(p_blueprint_id UUID, p_created_by UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_definitions JSONB := '[
    {"name": "project_manager", "display_name": "專案經理", "business_role": "project_manager", "permissions": ["all"], "sort_order": 0},
    {"name": "site_director", "display_name": "工地主任", "business_role": "site_director", "permissions": ["tasks", "diary", "qc", "acceptance", "problems", "members"], "sort_order": 1},
    {"name": "site_supervisor", "display_name": "現場監督", "business_role": "site_supervisor", "permissions": ["tasks", "diary", "qc", "problems"], "sort_order": 2},
    {"name": "worker", "display_name": "施工人員", "business_role": "worker", "permissions": ["tasks:view", "diary:submit", "problems:submit"], "sort_order": 3},
    {"name": "qa_staff", "display_name": "品管人員", "business_role": "qa_staff", "permissions": ["tasks:view", "diary:view", "qc", "acceptance", "problems"], "sort_order": 4},
    {"name": "safety_health", "display_name": "公共安全衛生", "business_role": "safety_health", "permissions": ["tasks:view", "diary:view", "qc:view", "problems"], "sort_order": 5},
    {"name": "finance", "display_name": "財務", "business_role": "finance", "permissions": ["tasks:view", "diary:view", "financial"], "sort_order": 6},
    {"name": "observer", "display_name": "觀察者", "business_role": "observer", "permissions": ["view"], "sort_order": 7, "is_default": true}
  ]';
  role_def JSONB;
BEGIN
  FOR role_def IN SELECT * FROM jsonb_array_elements(role_definitions)
  LOOP
    INSERT INTO blueprint_roles (
      blueprint_id,
      name,
      display_name,
      business_role,
      permissions,
      is_default,
      sort_order,
      created_by
    ) VALUES (
      p_blueprint_id,
      role_def->>'name',
      role_def->>'display_name',
      (role_def->>'business_role')::blueprint_business_role,
      role_def->'permissions',
      COALESCE((role_def->>'is_default')::boolean, false),
      COALESCE((role_def->>'sort_order')::integer, 99),
      p_created_by
    )
    ON CONFLICT (blueprint_id, name) DO NOTHING;
  END LOOP;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.initialize_blueprint_roles(UUID, UUID) TO authenticated;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP FUNCTION IF EXISTS public.initialize_blueprint_roles(UUID, UUID);

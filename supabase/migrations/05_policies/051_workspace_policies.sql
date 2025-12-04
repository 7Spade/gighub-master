-- ============================================================================
-- Migration: 051_workspace_policies
-- Layer: 05_policies
-- Description: 工作區 RLS 政策 (blueprints, blueprint_members, blueprint_roles, blueprint_team_roles)
-- Dependencies: 04_functions/040_private_helpers
-- ============================================================================

-- ############################################################################
-- BLUEPRINTS POLICIES
-- ############################################################################

-- 用戶可以查看有權限的藍圖
CREATE POLICY "blueprints_select" ON blueprints
  FOR SELECT TO authenticated
  USING ((SELECT private.has_blueprint_access(id)));

-- 用戶可以創建藍圖 (擁有者是自己或自己所屬的組織)
CREATE POLICY "blueprints_insert" ON blueprints
  FOR INSERT TO authenticated
  WITH CHECK (
    -- 個人藍圖
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = blueprints.owner_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND a.type = 'user'
    )
    OR
    -- 組織藍圖 (用戶是組織 admin)
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON om.organization_id = o.id
      JOIN accounts a ON a.id = om.account_id
      WHERE o.account_id = blueprints.owner_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );

-- 藍圖擁有者或 maintainer 可以更新
CREATE POLICY "blueprints_update" ON blueprints
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.is_blueprint_owner(id))
    OR EXISTS (
      SELECT 1 FROM blueprint_members bm
      JOIN accounts a ON a.id = bm.account_id
      WHERE bm.blueprint_id = blueprints.id
            AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer')
  );

-- 只有藍圖擁有者可以刪除
CREATE POLICY "blueprints_delete" ON blueprints
  FOR DELETE TO authenticated
  USING ((SELECT private.is_blueprint_owner(id)));

-- ############################################################################
-- BLUEPRINT_ROLES POLICIES
-- ############################################################################

-- 藍圖成員可以查看角色定義
CREATE POLICY "blueprint_roles_select" ON blueprint_roles
  FOR SELECT TO authenticated
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- 藍圖 maintainer 可以創建角色
CREATE POLICY "blueprint_roles_insert" ON blueprint_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.is_blueprint_owner(blueprint_id))
    OR EXISTS (
      SELECT 1 FROM blueprint_members bm
      JOIN accounts a ON a.id = bm.account_id
      WHERE bm.blueprint_id = blueprint_roles.blueprint_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND bm.role = 'maintainer'
    )
  );

-- 藍圖 maintainer 可以更新角色
CREATE POLICY "blueprint_roles_update" ON blueprint_roles
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.is_blueprint_owner(blueprint_id))
    OR EXISTS (
      SELECT 1 FROM blueprint_members bm
      JOIN accounts a ON a.id = bm.account_id
      WHERE bm.blueprint_id = blueprint_roles.blueprint_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND bm.role = 'maintainer'
    )
  );

-- 藍圖 maintainer 可以刪除角色
CREATE POLICY "blueprint_roles_delete" ON blueprint_roles
  FOR DELETE TO authenticated
  USING (
    (SELECT private.is_blueprint_owner(blueprint_id))
    OR EXISTS (
      SELECT 1 FROM blueprint_members bm
      JOIN accounts a ON a.id = bm.account_id
      WHERE bm.blueprint_id = blueprint_roles.blueprint_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND bm.role = 'maintainer'
    )
  );

-- ############################################################################
-- BLUEPRINT_MEMBERS POLICIES
-- ############################################################################

-- 藍圖成員可以查看成員列表
CREATE POLICY "blueprint_members_select" ON blueprint_members
  FOR SELECT TO authenticated
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- 藍圖 maintainer 可以添加成員
CREATE POLICY "blueprint_members_insert" ON blueprint_members
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

-- 藍圖 maintainer 可以更新成員
CREATE POLICY "blueprint_members_update" ON blueprint_members
  FOR UPDATE TO authenticated
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- 藍圖 maintainer 可以刪除成員，或成員自己退出
CREATE POLICY "blueprint_members_delete" ON blueprint_members
  FOR DELETE TO authenticated
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
    OR account_id = (SELECT private.get_user_account_id())
  );

-- ############################################################################
-- BLUEPRINT_TEAM_ROLES POLICIES
-- ############################################################################

-- 藍圖成員可以查看團隊授權
CREATE POLICY "blueprint_team_roles_select" ON blueprint_team_roles
  FOR SELECT TO authenticated
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- 藍圖 maintainer 可以添加團隊授權
CREATE POLICY "blueprint_team_roles_insert" ON blueprint_team_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.is_blueprint_owner(blueprint_id))
    OR EXISTS (
      SELECT 1 FROM blueprint_members bm
      JOIN accounts a ON a.id = bm.account_id
      WHERE bm.blueprint_id = blueprint_team_roles.blueprint_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND bm.role = 'maintainer'
    )
  );

-- 藍圖 maintainer 可以更新團隊授權
CREATE POLICY "blueprint_team_roles_update" ON blueprint_team_roles
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.is_blueprint_owner(blueprint_id))
    OR EXISTS (
      SELECT 1 FROM blueprint_members bm
      JOIN accounts a ON a.id = bm.account_id
      WHERE bm.blueprint_id = blueprint_team_roles.blueprint_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND bm.role = 'maintainer'
    )
  );

-- 藍圖 maintainer 可以刪除團隊授權
CREATE POLICY "blueprint_team_roles_delete" ON blueprint_team_roles
  FOR DELETE TO authenticated
  USING (
    (SELECT private.is_blueprint_owner(blueprint_id))
    OR EXISTS (
      SELECT 1 FROM blueprint_members bm
      JOIN accounts a ON a.id = bm.account_id
      WHERE bm.blueprint_id = blueprint_team_roles.blueprint_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND bm.role = 'maintainer'
    )
  );

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- Blueprints
-- DROP POLICY IF EXISTS blueprints_select ON blueprints;
-- DROP POLICY IF EXISTS blueprints_insert ON blueprints;
-- DROP POLICY IF EXISTS blueprints_update ON blueprints;
-- DROP POLICY IF EXISTS blueprints_delete ON blueprints;
-- Blueprint Roles
-- DROP POLICY IF EXISTS blueprint_roles_select ON blueprint_roles;
-- DROP POLICY IF EXISTS blueprint_roles_insert ON blueprint_roles;
-- DROP POLICY IF EXISTS blueprint_roles_update ON blueprint_roles;
-- DROP POLICY IF EXISTS blueprint_roles_delete ON blueprint_roles;
-- Blueprint Members
-- DROP POLICY IF EXISTS blueprint_members_select ON blueprint_members;
-- DROP POLICY IF EXISTS blueprint_members_insert ON blueprint_members;
-- DROP POLICY IF EXISTS blueprint_members_update ON blueprint_members;
-- DROP POLICY IF EXISTS blueprint_members_delete ON blueprint_members;
-- Blueprint Team Roles
-- DROP POLICY IF EXISTS blueprint_team_roles_select ON blueprint_team_roles;
-- DROP POLICY IF EXISTS blueprint_team_roles_insert ON blueprint_team_roles;
-- DROP POLICY IF EXISTS blueprint_team_roles_update ON blueprint_team_roles;
-- DROP POLICY IF EXISTS blueprint_team_roles_delete ON blueprint_team_roles;

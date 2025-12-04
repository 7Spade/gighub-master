-- ============================================================================
-- Migration: 050_core_policies
-- Layer: 05_policies
-- Description: 核心表 RLS 政策 (accounts, organizations, teams)
-- Dependencies: 04_functions/040_private_helpers
-- ============================================================================

-- ############################################################################
-- ACCOUNTS POLICIES
-- ############################################################################

-- 用戶可以查看自己的帳號
CREATE POLICY "accounts_select_own" ON accounts
  FOR SELECT TO authenticated
  USING (auth_user_id = (SELECT auth.uid()));

-- 用戶只能創建自己的帳號
CREATE POLICY "accounts_insert_own" ON accounts
  FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = (SELECT auth.uid()) AND type = 'user');

-- 用戶只能更新自己的帳號
CREATE POLICY "accounts_update_own" ON accounts
  FOR UPDATE TO authenticated
  USING (auth_user_id = (SELECT auth.uid())) 
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- ############################################################################
-- ORGANIZATIONS POLICIES
-- ############################################################################

-- 組織成員可以查看組織
CREATE POLICY "organizations_select_member" ON organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN accounts a ON a.id = om.account_id
      WHERE om.organization_id = organizations.id
      AND a.auth_user_id = (SELECT auth.uid())
    )
  );

-- 認證用戶可以創建組織
CREATE POLICY "organizations_insert_authenticated" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts a
      WHERE a.id = organizations.created_by
      AND a.auth_user_id = (SELECT auth.uid())
    )
  );

-- 組織 owner/admin 可以更新組織
CREATE POLICY "organizations_update_admin" ON organizations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN accounts a ON a.id = om.account_id
      WHERE om.organization_id = organizations.id
            AND a.auth_user_id = (SELECT auth.uid()) AND om.role = 'maintainer')
  );

-- 只有組織 owner 可以刪除組織
CREATE POLICY "organizations_delete_owner" ON organizations
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN accounts a ON a.id = om.account_id
      WHERE om.organization_id = organizations.id
            AND a.auth_user_id = (SELECT auth.uid()) AND om.role = 'maintainer')
  );

-- ############################################################################
-- ORGANIZATION_MEMBERS POLICIES
-- ############################################################################

-- 組織成員可以查看成員列表
CREATE POLICY "organization_members_select" ON organization_members
  FOR SELECT TO authenticated
  USING ((SELECT private.is_organization_member(organization_id)));

-- 組織 admin 可以添加成員
CREATE POLICY "organization_members_insert" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_organization_admin(organization_id)));

-- 組織 admin 可以更新成員
CREATE POLICY "organization_members_update" ON organization_members
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_organization_admin(organization_id)));

-- 組織 admin 可以刪除成員
CREATE POLICY "organization_members_delete" ON organization_members
  FOR DELETE TO authenticated
  USING ((SELECT private.is_organization_admin(organization_id)));

-- ############################################################################
-- TEAMS POLICIES
-- ############################################################################

-- 組織成員可以查看團隊
CREATE POLICY "teams_select" ON teams
  FOR SELECT TO authenticated
  USING ((SELECT private.is_organization_member(organization_id)));

-- 組織 admin 可以創建團隊
CREATE POLICY "teams_insert" ON teams
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_organization_admin(organization_id)));

-- 組織 admin 可以更新團隊
CREATE POLICY "teams_update" ON teams
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_organization_admin(organization_id)));

-- 組織 admin 可以刪除團隊
CREATE POLICY "teams_delete" ON teams
  FOR DELETE TO authenticated
  USING ((SELECT private.is_organization_admin(organization_id)));

-- ############################################################################
-- TEAM_MEMBERS POLICIES
-- ############################################################################

-- 團隊成員可以查看成員列表
CREATE POLICY "team_members_select" ON team_members
  FOR SELECT TO authenticated
  USING ((SELECT private.is_team_member(team_id)));

-- 團隊 leader 可以添加成員
CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_team_leader(team_id)));

-- 團隊 leader 可以更新成員
CREATE POLICY "team_members_update" ON team_members
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_team_leader(team_id)));

-- 團隊 leader 可以刪除成員
CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE TO authenticated
  USING ((SELECT private.is_team_leader(team_id)));

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- Core Accounts
-- DROP POLICY IF EXISTS accounts_select_own ON accounts;
-- DROP POLICY IF EXISTS accounts_insert_own ON accounts;
-- DROP POLICY IF EXISTS accounts_update_own ON accounts;
-- Organizations
-- DROP POLICY IF EXISTS organizations_select_member ON organizations;
-- DROP POLICY IF EXISTS organizations_insert_authenticated ON organizations;
-- DROP POLICY IF EXISTS organizations_update_admin ON organizations;
-- DROP POLICY IF EXISTS organizations_delete_owner ON organizations;
-- Organization Members
-- DROP POLICY IF EXISTS organization_members_select ON organization_members;
-- DROP POLICY IF EXISTS organization_members_insert ON organization_members;
-- DROP POLICY IF EXISTS organization_members_update ON organization_members;
-- DROP POLICY IF EXISTS organization_members_delete ON organization_members;
-- Teams
-- DROP POLICY IF EXISTS teams_select ON teams;
-- DROP POLICY IF EXISTS teams_insert ON teams;
-- DROP POLICY IF EXISTS teams_update ON teams;
-- DROP POLICY IF EXISTS teams_delete ON teams;
-- Team Members
-- DROP POLICY IF EXISTS team_members_select ON team_members;
-- DROP POLICY IF EXISTS team_members_insert ON team_members;
-- DROP POLICY IF EXISTS team_members_update ON team_members;
-- DROP POLICY IF EXISTS team_members_delete ON team_members;

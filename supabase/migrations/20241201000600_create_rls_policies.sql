-- ============================================================================
-- Migration: Create RLS Policies
-- Description: 建立資料列安全政策 (Row Level Security Policies)
-- Created: 2024-12-01
-- ============================================================================

-- ############################################################################
-- PART 8: ROW LEVEL SECURITY (資料列安全政策)
-- ############################################################################

-- ============================================================================
-- RLS Policies: accounts
-- ============================================================================
-- 用戶可以讀取、新增、更新自己的 account
CREATE POLICY "accounts_select_own" ON accounts 
  FOR SELECT TO authenticated 
  USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "accounts_insert_own" ON accounts 
  FOR INSERT TO authenticated 
  WITH CHECK (auth_user_id = (SELECT auth.uid()) AND type = 'user');

CREATE POLICY "accounts_update_own" ON accounts 
  FOR UPDATE TO authenticated 
  USING (auth_user_id = (SELECT auth.uid())) 
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- ============================================================================
-- RLS Policies: organizations
-- ============================================================================
CREATE POLICY "organizations_select_member" ON organizations 
  FOR SELECT TO authenticated 
  USING ((SELECT private.is_organization_member(id)));

CREATE POLICY "organizations_insert" ON organizations 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "organizations_update_admin" ON organizations 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.is_organization_admin(id))) 
  WITH CHECK ((SELECT private.is_organization_admin(id)));

CREATE POLICY "organizations_delete_owner" ON organizations 
  FOR DELETE TO authenticated 
  USING ((SELECT private.get_organization_role(id)) = 'owner');

-- ============================================================================
-- RLS Policies: organization_members
-- ============================================================================
CREATE POLICY "organization_members_select" ON organization_members 
  FOR SELECT TO authenticated 
  USING ((SELECT private.is_organization_member(organization_id)));

CREATE POLICY "organization_members_insert" ON organization_members 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.is_organization_admin(organization_id)));

CREATE POLICY "organization_members_update" ON organization_members 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.is_organization_admin(organization_id))) 
  WITH CHECK ((SELECT private.is_organization_admin(organization_id)) AND (role != 'owner' OR (SELECT private.get_organization_role(organization_id)) = 'owner'));

CREATE POLICY "organization_members_delete" ON organization_members 
  FOR DELETE TO authenticated 
  USING ((SELECT private.is_organization_admin(organization_id)) AND role != 'owner');

-- ============================================================================
-- RLS Policies: teams
-- ============================================================================
CREATE POLICY "teams_select" ON teams 
  FOR SELECT TO authenticated 
  USING ((SELECT private.is_organization_member(organization_id)));

CREATE POLICY "teams_update" ON teams 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.is_organization_admin(organization_id)) OR (SELECT private.is_team_leader(id))) 
  WITH CHECK ((SELECT private.is_organization_admin(organization_id)) OR (SELECT private.is_team_leader(id)));

CREATE POLICY "teams_delete" ON teams 
  FOR DELETE TO authenticated 
  USING ((SELECT private.is_organization_admin(organization_id)));

-- 組織 owner/admin 可以建立團隊
CREATE POLICY "teams_insert" ON teams 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.is_organization_admin(organization_id)));

-- ============================================================================
-- RLS Policies: team_members
-- ============================================================================
CREATE POLICY "team_members_select" ON team_members 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND (SELECT private.is_organization_member(t.organization_id))));

CREATE POLICY "team_members_insert" ON team_members 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND ((SELECT private.is_organization_admin(t.organization_id)) OR (SELECT private.is_team_leader(team_members.team_id)))));

CREATE POLICY "team_members_update" ON team_members 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND ((SELECT private.is_organization_admin(t.organization_id)) OR (SELECT private.is_team_leader(team_members.team_id)))));

CREATE POLICY "team_members_delete" ON team_members 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND ((SELECT private.is_organization_admin(t.organization_id)) OR (SELECT private.is_team_leader(team_members.team_id)))));

-- ============================================================================
-- RLS Policies: blueprints
-- ============================================================================
CREATE POLICY "blueprints_select" ON blueprints 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(id)));

CREATE POLICY "blueprints_select_public" ON blueprints 
  FOR SELECT TO anon 
  USING (is_public = true AND status = 'active');

CREATE POLICY "blueprints_update" ON blueprints 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.is_blueprint_owner(id))) 
  WITH CHECK ((SELECT private.is_blueprint_owner(id)));

CREATE POLICY "blueprints_delete" ON blueprints 
  FOR DELETE TO authenticated 
  USING ((SELECT private.is_blueprint_owner(id)));

-- 用戶可以建立個人藍圖 (owner_id = 自己的 account_id)，或組織 owner/admin 可以建立組織藍圖
CREATE POLICY "blueprints_insert" ON blueprints 
  FOR INSERT TO authenticated 
  WITH CHECK (
    -- 個人藍圖: owner_id 是用戶自己的 account
    EXISTS (
      SELECT 1 FROM accounts a 
      WHERE a.id = blueprints.owner_id 
      AND a.auth_user_id = (SELECT auth.uid()) 
      AND a.type = 'user'
    )
    OR
    -- 組織藍圖: 用戶是組織的 owner 或 admin
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON om.organization_id = o.id
      JOIN accounts a ON a.id = om.account_id
      WHERE o.account_id = blueprints.owner_id
      AND a.auth_user_id = (SELECT auth.uid())
      AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS Policies: blueprint_members
-- ============================================================================
CREATE POLICY "blueprint_members_select" ON blueprint_members 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "blueprint_members_insert" ON blueprint_members 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT private.is_blueprint_owner(blueprint_id)) OR 
    EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id 
            WHERE bm.blueprint_id = blueprint_members.blueprint_id 
            AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer')
  );

CREATE POLICY "blueprint_members_update" ON blueprint_members 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT private.is_blueprint_owner(blueprint_id)) OR 
    EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id 
            WHERE bm.blueprint_id = blueprint_members.blueprint_id 
            AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer')
  );

CREATE POLICY "blueprint_members_delete" ON blueprint_members 
  FOR DELETE TO authenticated 
  USING (
    (SELECT private.is_blueprint_owner(blueprint_id)) OR 
    EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id 
            WHERE bm.blueprint_id = blueprint_members.blueprint_id 
            AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer')
  );

-- ============================================================================
-- RLS Policies: blueprint_team_roles
-- ============================================================================
CREATE POLICY "blueprint_team_roles_select" ON blueprint_team_roles 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "blueprint_team_roles_insert" ON blueprint_team_roles 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.is_blueprint_owner(blueprint_id)));

CREATE POLICY "blueprint_team_roles_update" ON blueprint_team_roles 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.is_blueprint_owner(blueprint_id)));

CREATE POLICY "blueprint_team_roles_delete" ON blueprint_team_roles 
  FOR DELETE TO authenticated 
  USING ((SELECT private.is_blueprint_owner(blueprint_id)));

-- ============================================================================
-- RLS Policies: blueprint_roles
-- ============================================================================
CREATE POLICY "blueprint_roles_select" ON blueprint_roles 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "blueprint_roles_insert" ON blueprint_roles 
  FOR INSERT TO authenticated 
  WITH CHECK (
    (SELECT private.is_blueprint_owner(blueprint_id)) OR 
    EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id 
            WHERE bm.blueprint_id = blueprint_roles.blueprint_id 
            AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer')
  );

CREATE POLICY "blueprint_roles_update" ON blueprint_roles 
  FOR UPDATE TO authenticated 
  USING (
    (SELECT private.is_blueprint_owner(blueprint_id)) OR 
    EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id 
            WHERE bm.blueprint_id = blueprint_roles.blueprint_id 
            AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer')
  );

CREATE POLICY "blueprint_roles_delete" ON blueprint_roles 
  FOR DELETE TO authenticated 
  USING (
    (SELECT private.is_blueprint_owner(blueprint_id)) OR 
    EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id 
            WHERE bm.blueprint_id = blueprint_roles.blueprint_id 
            AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer')
  );

-- ============================================================================
-- RLS Policies: tasks
-- ============================================================================
CREATE POLICY "tasks_select" ON tasks 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "tasks_insert" ON tasks 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "tasks_update" ON tasks 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "tasks_delete" ON tasks 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- RLS Policies: task_attachments
-- ============================================================================
CREATE POLICY "task_attachments_select" ON task_attachments 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_attachments.task_id AND (SELECT private.has_blueprint_access(t.blueprint_id))));

CREATE POLICY "task_attachments_insert" ON task_attachments 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_attachments.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));

CREATE POLICY "task_attachments_delete" ON task_attachments 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_attachments.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));

-- ============================================================================
-- RLS Policies: diaries
-- ============================================================================
CREATE POLICY "diaries_select" ON diaries 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "diaries_insert" ON diaries 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "diaries_update" ON diaries 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "diaries_delete" ON diaries 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- RLS Policies: diary_attachments
-- ============================================================================
CREATE POLICY "diary_attachments_select" ON diary_attachments 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_attachments.diary_id AND (SELECT private.has_blueprint_access(d.blueprint_id))));

CREATE POLICY "diary_attachments_insert" ON diary_attachments 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_attachments.diary_id AND (SELECT private.can_write_blueprint(d.blueprint_id))));

CREATE POLICY "diary_attachments_delete" ON diary_attachments 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_attachments.diary_id AND (SELECT private.can_write_blueprint(d.blueprint_id))));

-- ============================================================================
-- RLS Policies: checklists
-- ============================================================================
CREATE POLICY "checklists_select" ON checklists 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "checklists_insert" ON checklists 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "checklists_update" ON checklists 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "checklists_delete" ON checklists 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- RLS Policies: checklist_items
-- ============================================================================
CREATE POLICY "checklist_items_select" ON checklist_items 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND (SELECT private.has_blueprint_access(c.blueprint_id))));

CREATE POLICY "checklist_items_insert" ON checklist_items 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND (SELECT private.can_write_blueprint(c.blueprint_id))));

CREATE POLICY "checklist_items_update" ON checklist_items 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND (SELECT private.can_write_blueprint(c.blueprint_id))));

CREATE POLICY "checklist_items_delete" ON checklist_items 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND (SELECT private.can_write_blueprint(c.blueprint_id))));

-- ============================================================================
-- RLS Policies: task_acceptances
-- ============================================================================
CREATE POLICY "task_acceptances_select" ON task_acceptances 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_acceptances.task_id AND (SELECT private.has_blueprint_access(t.blueprint_id))));

CREATE POLICY "task_acceptances_insert" ON task_acceptances 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_acceptances.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));

CREATE POLICY "task_acceptances_update" ON task_acceptances 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_acceptances.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));

-- ============================================================================
-- RLS Policies: todos
-- ============================================================================
CREATE POLICY "todos_select" ON todos 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)) AND account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "todos_insert" ON todos 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)) AND account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "todos_update" ON todos 
  FOR UPDATE TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "todos_delete" ON todos 
  FOR DELETE TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

-- ============================================================================
-- RLS Policies: issues
-- ============================================================================
CREATE POLICY "issues_select" ON issues 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "issues_insert" ON issues 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "issues_update" ON issues 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "issues_delete" ON issues 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- RLS Policies: issue_comments
-- ============================================================================
CREATE POLICY "issue_comments_select" ON issue_comments 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM issues i WHERE i.id = issue_comments.issue_id AND (SELECT private.has_blueprint_access(i.blueprint_id))));

CREATE POLICY "issue_comments_insert" ON issue_comments 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM issues i WHERE i.id = issue_comments.issue_id AND (SELECT private.has_blueprint_access(i.blueprint_id))) AND author_id = (SELECT private.get_user_account_id()));

CREATE POLICY "issue_comments_update" ON issue_comments 
  FOR UPDATE TO authenticated 
  USING (author_id = (SELECT private.get_user_account_id()));

CREATE POLICY "issue_comments_delete" ON issue_comments 
  FOR DELETE TO authenticated 
  USING (author_id = (SELECT private.get_user_account_id()));

-- ============================================================================
-- RLS Policies: notifications
-- ============================================================================
CREATE POLICY "notifications_select" ON notifications 
  FOR SELECT TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "notifications_insert" ON notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

CREATE POLICY "notifications_update" ON notifications 
  FOR UPDATE TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "notifications_delete" ON notifications 
  FOR DELETE TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- All policies should be dropped with their tables
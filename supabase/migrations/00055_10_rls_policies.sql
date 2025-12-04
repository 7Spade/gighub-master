-- ============================================================================
-- Migration: 10 - RLS Policies
-- Description: 建立資料列安全政策 (Row Level Security Policies)
-- Category: 10 - RLS Policies
-- 
-- 注意：這些政策必須在所有表和 Private Functions 創建之後
-- ============================================================================

-- ============================================================================
-- RLS Policies: accounts
-- ============================================================================
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
  WITH CHECK ((SELECT private.is_organization_admin(organization_id)));

CREATE POLICY "organization_members_delete" ON organization_members 
  FOR DELETE TO authenticated 
  USING ((SELECT private.is_organization_admin(organization_id)) AND role != 'owner');

-- ============================================================================
-- RLS Policies: teams
-- ============================================================================
CREATE POLICY "teams_select" ON teams 
  FOR SELECT TO authenticated 
  USING ((SELECT private.is_organization_member(organization_id)));

CREATE POLICY "teams_insert" ON teams 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.is_organization_admin(organization_id)));

CREATE POLICY "teams_update" ON teams 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.is_organization_admin(organization_id)) OR (SELECT private.is_team_leader(id)));

CREATE POLICY "teams_delete" ON teams 
  FOR DELETE TO authenticated 
  USING ((SELECT private.is_organization_admin(organization_id)));

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

CREATE POLICY "blueprints_insert" ON blueprints 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM accounts a WHERE a.id = blueprints.owner_id AND a.auth_user_id = (SELECT auth.uid()) AND a.type = 'user')
    OR
    EXISTS (SELECT 1 FROM organizations o JOIN organization_members om ON om.organization_id = o.id JOIN accounts a ON a.id = om.account_id WHERE o.account_id = blueprints.owner_id AND a.auth_user_id = (SELECT auth.uid()) AND om.role IN ('owner', 'admin'))
  );

CREATE POLICY "blueprints_update" ON blueprints 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.is_blueprint_owner(id)));

CREATE POLICY "blueprints_delete" ON blueprints 
  FOR DELETE TO authenticated 
  USING ((SELECT private.is_blueprint_owner(id)));

-- ============================================================================
-- RLS Policies: blueprint_members
-- ============================================================================
CREATE POLICY "blueprint_members_select" ON blueprint_members 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "blueprint_members_insert" ON blueprint_members 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.is_blueprint_owner(blueprint_id)) OR EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id WHERE bm.blueprint_id = blueprint_members.blueprint_id AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer'));

CREATE POLICY "blueprint_members_update" ON blueprint_members 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.is_blueprint_owner(blueprint_id)) OR EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id WHERE bm.blueprint_id = blueprint_members.blueprint_id AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer'));

CREATE POLICY "blueprint_members_delete" ON blueprint_members 
  FOR DELETE TO authenticated 
  USING ((SELECT private.is_blueprint_owner(blueprint_id)) OR EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id WHERE bm.blueprint_id = blueprint_members.blueprint_id AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer'));

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
  WITH CHECK ((SELECT private.is_blueprint_owner(blueprint_id)) OR EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id WHERE bm.blueprint_id = blueprint_roles.blueprint_id AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer'));

CREATE POLICY "blueprint_roles_update" ON blueprint_roles 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.is_blueprint_owner(blueprint_id)) OR EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id WHERE bm.blueprint_id = blueprint_roles.blueprint_id AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer'));

CREATE POLICY "blueprint_roles_delete" ON blueprint_roles 
  FOR DELETE TO authenticated 
  USING ((SELECT private.is_blueprint_owner(blueprint_id)) OR EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id WHERE bm.blueprint_id = blueprint_roles.blueprint_id AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer'));

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
-- RLS Policies: diary_entries
-- ============================================================================
CREATE POLICY "diary_entries_select" ON diary_entries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_entries.diary_id AND (SELECT private.has_blueprint_access(d.blueprint_id))));

CREATE POLICY "diary_entries_insert" ON diary_entries
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_entries.diary_id AND (SELECT private.can_write_blueprint(d.blueprint_id))));

CREATE POLICY "diary_entries_update" ON diary_entries
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_entries.diary_id AND (SELECT private.can_write_blueprint(d.blueprint_id))));

CREATE POLICY "diary_entries_delete" ON diary_entries
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_entries.diary_id AND (SELECT private.can_write_blueprint(d.blueprint_id))));

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
-- RLS Policies: Container Infrastructure Tables
-- ============================================================================
CREATE POLICY "blueprint_configs_select" ON blueprint_configs 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "blueprint_configs_insert" ON blueprint_configs 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "blueprint_configs_update" ON blueprint_configs 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "blueprint_configs_delete" ON blueprint_configs 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)) AND is_system = false);

CREATE POLICY "activities_select" ON activities 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "activities_insert" ON activities 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "events_select" ON events 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "events_insert" ON events 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "event_subscriptions_select" ON event_subscriptions 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)) AND account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "event_subscriptions_insert" ON event_subscriptions 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)) AND account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "event_subscriptions_update" ON event_subscriptions 
  FOR UPDATE TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "event_subscriptions_delete" ON event_subscriptions 
  FOR DELETE TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "entity_references_select" ON entity_references 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "entity_references_insert" ON entity_references 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "entity_references_delete" ON entity_references 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "custom_field_definitions_select" ON custom_field_definitions 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "custom_field_definitions_insert" ON custom_field_definitions 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "custom_field_definitions_update" ON custom_field_definitions 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "custom_field_definitions_delete" ON custom_field_definitions 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "custom_field_values_select" ON custom_field_values 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM custom_field_definitions cfd WHERE cfd.id = custom_field_values.definition_id AND (SELECT private.has_blueprint_access(cfd.blueprint_id))));

CREATE POLICY "custom_field_values_insert" ON custom_field_values 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM custom_field_definitions cfd WHERE cfd.id = custom_field_values.definition_id AND (SELECT private.can_write_blueprint(cfd.blueprint_id))));

CREATE POLICY "custom_field_values_update" ON custom_field_values 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM custom_field_definitions cfd WHERE cfd.id = custom_field_values.definition_id AND (SELECT private.can_write_blueprint(cfd.blueprint_id))));

CREATE POLICY "custom_field_values_delete" ON custom_field_values 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM custom_field_definitions cfd WHERE cfd.id = custom_field_values.definition_id AND (SELECT private.can_write_blueprint(cfd.blueprint_id))));

CREATE POLICY "lifecycle_transitions_select" ON lifecycle_transitions 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "lifecycle_transitions_insert" ON lifecycle_transitions 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "search_index_select" ON search_index 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "search_index_insert" ON search_index 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "search_index_update" ON search_index 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "search_index_delete" ON search_index 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "files_select" ON files 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "files_insert" ON files 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "files_update" ON files 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "files_delete" ON files 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "file_shares_select" ON file_shares 
  FOR SELECT TO authenticated 
  USING (shared_with = (SELECT private.get_user_account_id()) OR EXISTS (SELECT 1 FROM files f WHERE f.id = file_shares.file_id AND (SELECT private.can_write_blueprint(f.blueprint_id))));

CREATE POLICY "file_shares_insert" ON file_shares 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM files f WHERE f.id = file_shares.file_id AND (SELECT private.can_write_blueprint(f.blueprint_id))));

CREATE POLICY "file_shares_delete" ON file_shares 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM files f WHERE f.id = file_shares.file_id AND (SELECT private.can_write_blueprint(f.blueprint_id))));

CREATE POLICY "notification_preferences_select" ON notification_preferences 
  FOR SELECT TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "notification_preferences_insert" ON notification_preferences 
  FOR INSERT TO authenticated 
  WITH CHECK (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "notification_preferences_update" ON notification_preferences 
  FOR UPDATE TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

CREATE POLICY "notification_preferences_delete" ON notification_preferences 
  FOR DELETE TO authenticated 
  USING (account_id = (SELECT private.get_user_account_id()));

-- ============================================================================
-- RLS Policies: Financial Tables
-- ============================================================================
CREATE POLICY "contracts_select" ON contracts 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "contracts_insert" ON contracts 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "contracts_update" ON contracts 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "contracts_delete" ON contracts 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "expenses_select" ON expenses 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "expenses_insert" ON expenses 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "expenses_update" ON expenses 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "expenses_delete" ON expenses 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payment_requests_select" ON payment_requests 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "payment_requests_insert" ON payment_requests 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payment_requests_update" ON payment_requests 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payment_requests_delete" ON payment_requests 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payments_select" ON payments 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "payments_insert" ON payments 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payments_update" ON payments 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "payments_delete" ON payments 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- RLS Policies: QC/Acceptance/Problem Tables
-- ============================================================================
CREATE POLICY "qc_inspections_select" ON qc_inspections 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "qc_inspections_insert" ON qc_inspections 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "qc_inspections_update" ON qc_inspections 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "qc_inspections_delete" ON qc_inspections 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "qc_inspection_items_select" ON qc_inspection_items 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM qc_inspections qi WHERE qi.id = qc_inspection_items.inspection_id AND (SELECT private.has_blueprint_access(qi.blueprint_id))));

CREATE POLICY "qc_inspection_items_insert" ON qc_inspection_items 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM qc_inspections qi WHERE qi.id = qc_inspection_items.inspection_id AND (SELECT private.can_write_blueprint(qi.blueprint_id))));

CREATE POLICY "qc_inspection_items_update" ON qc_inspection_items 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM qc_inspections qi WHERE qi.id = qc_inspection_items.inspection_id AND (SELECT private.can_write_blueprint(qi.blueprint_id))));

CREATE POLICY "qc_inspection_items_delete" ON qc_inspection_items 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM qc_inspections qi WHERE qi.id = qc_inspection_items.inspection_id AND (SELECT private.can_write_blueprint(qi.blueprint_id))));

CREATE POLICY "qc_inspection_attachments_select" ON qc_inspection_attachments 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM qc_inspections qi WHERE qi.id = qc_inspection_attachments.inspection_id AND (SELECT private.has_blueprint_access(qi.blueprint_id))));

CREATE POLICY "qc_inspection_attachments_insert" ON qc_inspection_attachments 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM qc_inspections qi WHERE qi.id = qc_inspection_attachments.inspection_id AND (SELECT private.can_write_blueprint(qi.blueprint_id))));

CREATE POLICY "qc_inspection_attachments_delete" ON qc_inspection_attachments 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM qc_inspections qi WHERE qi.id = qc_inspection_attachments.inspection_id AND (SELECT private.can_write_blueprint(qi.blueprint_id))));

CREATE POLICY "acceptances_select" ON acceptances 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "acceptances_insert" ON acceptances 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "acceptances_update" ON acceptances 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "acceptances_delete" ON acceptances 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "acceptance_approvals_select" ON acceptance_approvals 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM acceptances a WHERE a.id = acceptance_approvals.acceptance_id AND (SELECT private.has_blueprint_access(a.blueprint_id))));

CREATE POLICY "acceptance_approvals_insert" ON acceptance_approvals 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM acceptances a WHERE a.id = acceptance_approvals.acceptance_id AND (SELECT private.can_write_blueprint(a.blueprint_id))));

CREATE POLICY "acceptance_approvals_update" ON acceptance_approvals 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM acceptances a WHERE a.id = acceptance_approvals.acceptance_id AND (SELECT private.can_write_blueprint(a.blueprint_id))));

CREATE POLICY "acceptance_attachments_select" ON acceptance_attachments 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM acceptances a WHERE a.id = acceptance_attachments.acceptance_id AND (SELECT private.has_blueprint_access(a.blueprint_id))));

CREATE POLICY "acceptance_attachments_insert" ON acceptance_attachments 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM acceptances a WHERE a.id = acceptance_attachments.acceptance_id AND (SELECT private.can_write_blueprint(a.blueprint_id))));

CREATE POLICY "acceptance_attachments_delete" ON acceptance_attachments 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM acceptances a WHERE a.id = acceptance_attachments.acceptance_id AND (SELECT private.can_write_blueprint(a.blueprint_id))));

CREATE POLICY "problems_select" ON problems 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "problems_insert" ON problems 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "problems_update" ON problems 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "problems_delete" ON problems 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "problem_actions_select" ON problem_actions 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_actions.problem_id AND (SELECT private.has_blueprint_access(p.blueprint_id))));

CREATE POLICY "problem_actions_insert" ON problem_actions 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_actions.problem_id AND (SELECT private.can_write_blueprint(p.blueprint_id))));

CREATE POLICY "problem_actions_update" ON problem_actions 
  FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_actions.problem_id AND (SELECT private.can_write_blueprint(p.blueprint_id))));

CREATE POLICY "problem_comments_select" ON problem_comments 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_comments.problem_id AND (SELECT private.has_blueprint_access(p.blueprint_id))));

CREATE POLICY "problem_comments_insert" ON problem_comments 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_comments.problem_id AND (SELECT private.has_blueprint_access(p.blueprint_id))) AND author_id = (SELECT private.get_user_account_id()));

CREATE POLICY "problem_comments_update" ON problem_comments 
  FOR UPDATE TO authenticated 
  USING (author_id = (SELECT private.get_user_account_id()));

CREATE POLICY "problem_comments_delete" ON problem_comments 
  FOR DELETE TO authenticated 
  USING (author_id = (SELECT private.get_user_account_id()));

CREATE POLICY "problem_attachments_select" ON problem_attachments 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_attachments.problem_id AND (SELECT private.has_blueprint_access(p.blueprint_id))));

CREATE POLICY "problem_attachments_insert" ON problem_attachments 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_attachments.problem_id AND (SELECT private.can_write_blueprint(p.blueprint_id))));

CREATE POLICY "problem_attachments_delete" ON problem_attachments 
  FOR DELETE TO authenticated 
  USING (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_attachments.problem_id AND (SELECT private.can_write_blueprint(p.blueprint_id))));

-- ============================================================================
-- RLS Policies: Audit Logs (Append-only)
-- ============================================================================
CREATE POLICY "audit_logs_select" ON audit_logs 
  FOR SELECT TO authenticated 
  USING (
    (blueprint_id IS NOT NULL AND (SELECT private.has_blueprint_access(blueprint_id)))
    OR (organization_id IS NOT NULL AND (SELECT private.is_organization_member(organization_id)))
    OR actor_id = (SELECT private.get_user_account_id())
  );

CREATE POLICY "audit_logs_insert" ON audit_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- ============================================================================
-- RLS Policies: Search History
-- ============================================================================
CREATE POLICY "search_history_select" ON search_history
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "search_history_insert" ON search_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "search_history_update" ON search_history
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "search_history_delete" ON search_history
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

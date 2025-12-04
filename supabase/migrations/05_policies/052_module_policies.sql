-- ============================================================================
-- Migration: 052_module_policies
-- Layer: 05_policies
-- Description: 業務模組 RLS 政策 (tasks, diary, checklists, issues, qc, acceptance, problems)
-- Dependencies: 04_functions/040_private_helpers
-- ============================================================================

-- ############################################################################
-- TASKS POLICIES
-- ############################################################################

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
  USING (
    created_by = (SELECT private.get_user_account_id())
    OR (SELECT private.can_write_blueprint(blueprint_id))
  );

-- Task Attachments
CREATE POLICY "task_attachments_select" ON task_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_attachments.task_id AND (SELECT private.has_blueprint_access(t.blueprint_id))));

CREATE POLICY "task_attachments_insert" ON task_attachments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_attachments.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));

CREATE POLICY "task_attachments_delete" ON task_attachments
  FOR DELETE TO authenticated
  USING (uploaded_by = (SELECT private.get_user_account_id()));

-- Task Acceptances
CREATE POLICY "task_acceptances_select" ON task_acceptances
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_acceptances.task_id AND (SELECT private.has_blueprint_access(t.blueprint_id))));

CREATE POLICY "task_acceptances_insert" ON task_acceptances
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_acceptances.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));

CREATE POLICY "task_acceptances_update" ON task_acceptances
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_acceptances.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));

-- Todos
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

-- ############################################################################
-- DIARY POLICIES
-- ############################################################################

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
  USING (created_by = (SELECT private.get_user_account_id()) OR (SELECT private.can_write_blueprint(blueprint_id)));

-- Diary Attachments
CREATE POLICY "diary_attachments_select" ON diary_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_attachments.diary_id AND (SELECT private.has_blueprint_access(d.blueprint_id))));

CREATE POLICY "diary_attachments_insert" ON diary_attachments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_attachments.diary_id AND (SELECT private.can_write_blueprint(d.blueprint_id))));

CREATE POLICY "diary_attachments_delete" ON diary_attachments
  FOR DELETE TO authenticated
  USING (uploaded_by = (SELECT private.get_user_account_id()));

-- Diary Entries
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

-- ############################################################################
-- CHECKLISTS POLICIES
-- ############################################################################

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
  USING (created_by = (SELECT private.get_user_account_id()) OR (SELECT private.can_write_blueprint(blueprint_id)));

-- Checklist Items
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

-- ############################################################################
-- ISSUES POLICIES
-- ############################################################################

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
  USING (reported_by = (SELECT private.get_user_account_id()) OR (SELECT private.can_write_blueprint(blueprint_id)));

-- Issue Comments
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

-- ############################################################################
-- QC INSPECTIONS POLICIES
-- ############################################################################

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
  USING (created_by = (SELECT private.get_user_account_id()) OR (SELECT private.can_write_blueprint(blueprint_id)));

-- QC Inspection Items
CREATE POLICY "qc_inspection_items_select" ON qc_inspection_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM qc_inspections i WHERE i.id = qc_inspection_items.inspection_id AND (SELECT private.has_blueprint_access(i.blueprint_id))));

CREATE POLICY "qc_inspection_items_insert" ON qc_inspection_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM qc_inspections i WHERE i.id = qc_inspection_items.inspection_id AND (SELECT private.can_write_blueprint(i.blueprint_id))));

CREATE POLICY "qc_inspection_items_update" ON qc_inspection_items
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM qc_inspections i WHERE i.id = qc_inspection_items.inspection_id AND (SELECT private.can_write_blueprint(i.blueprint_id))));

CREATE POLICY "qc_inspection_items_delete" ON qc_inspection_items
  FOR DELETE TO authenticated
  USING (
    checked_by = (SELECT private.get_user_account_id())
    OR EXISTS (SELECT 1 FROM qc_inspections i WHERE i.id = qc_inspection_items.inspection_id AND (SELECT private.can_write_blueprint(i.blueprint_id)))
  );

-- QC Inspection Attachments
CREATE POLICY "qc_inspection_attachments_select" ON qc_inspection_attachments
  FOR SELECT TO authenticated
  USING (
    (inspection_id IS NOT NULL AND EXISTS (SELECT 1 FROM qc_inspections i WHERE i.id = qc_inspection_attachments.inspection_id AND (SELECT private.has_blueprint_access(i.blueprint_id))))
    OR
    (item_id IS NOT NULL AND EXISTS (SELECT 1 FROM qc_inspection_items it JOIN qc_inspections i ON it.inspection_id = i.id WHERE it.id = qc_inspection_attachments.item_id AND (SELECT private.has_blueprint_access(i.blueprint_id))))
  );

CREATE POLICY "qc_inspection_attachments_insert" ON qc_inspection_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    (inspection_id IS NOT NULL AND EXISTS (SELECT 1 FROM qc_inspections i WHERE i.id = qc_inspection_attachments.inspection_id AND (SELECT private.can_write_blueprint(i.blueprint_id))))
    OR
    (item_id IS NOT NULL AND EXISTS (SELECT 1 FROM qc_inspection_items it JOIN qc_inspections i ON it.inspection_id = i.id WHERE it.id = qc_inspection_attachments.item_id AND (SELECT private.can_write_blueprint(i.blueprint_id))))
  );

CREATE POLICY "qc_inspection_attachments_delete" ON qc_inspection_attachments
  FOR DELETE TO authenticated
  USING (uploaded_by = (SELECT private.get_user_account_id()));

-- ############################################################################
-- ACCEPTANCES POLICIES
-- ############################################################################

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
  USING (created_by = (SELECT private.get_user_account_id()) OR (SELECT private.can_write_blueprint(blueprint_id)));

-- Acceptance Approvals
CREATE POLICY "acceptance_approvals_select" ON acceptance_approvals
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM acceptances a WHERE a.id = acceptance_approvals.acceptance_id AND (SELECT private.has_blueprint_access(a.blueprint_id))));

CREATE POLICY "acceptance_approvals_insert" ON acceptance_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    approver_id = (SELECT private.get_user_account_id())
    AND EXISTS (SELECT 1 FROM acceptances a WHERE a.id = acceptance_approvals.acceptance_id AND (SELECT private.has_blueprint_access(a.blueprint_id)))
  );

-- Acceptance Attachments
CREATE POLICY "acceptance_attachments_select" ON acceptance_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM acceptances a WHERE a.id = acceptance_attachments.acceptance_id AND (SELECT private.has_blueprint_access(a.blueprint_id))));

CREATE POLICY "acceptance_attachments_insert" ON acceptance_attachments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM acceptances a WHERE a.id = acceptance_attachments.acceptance_id AND (SELECT private.can_write_blueprint(a.blueprint_id))));

CREATE POLICY "acceptance_attachments_delete" ON acceptance_attachments
  FOR DELETE TO authenticated
  USING (uploaded_by = (SELECT private.get_user_account_id()));

-- ############################################################################
-- PROBLEMS POLICIES
-- ############################################################################

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
  USING (created_by = (SELECT private.get_user_account_id()) OR (SELECT private.can_write_blueprint(blueprint_id)));

-- Problem Actions
CREATE POLICY "problem_actions_select" ON problem_actions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_actions.problem_id AND (SELECT private.has_blueprint_access(p.blueprint_id))));

CREATE POLICY "problem_actions_insert" ON problem_actions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_actions.problem_id AND (SELECT private.can_write_blueprint(p.blueprint_id))));

-- Problem Comments
CREATE POLICY "problem_comments_select" ON problem_comments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_comments.problem_id AND (SELECT private.has_blueprint_access(p.blueprint_id))));

CREATE POLICY "problem_comments_insert" ON problem_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT private.get_user_account_id())
    AND EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_comments.problem_id AND (SELECT private.has_blueprint_access(p.blueprint_id)))
  );

CREATE POLICY "problem_comments_update" ON problem_comments
  FOR UPDATE TO authenticated
  USING (author_id = (SELECT private.get_user_account_id()));

CREATE POLICY "problem_comments_delete" ON problem_comments
  FOR DELETE TO authenticated
  USING (author_id = (SELECT private.get_user_account_id()));

-- Problem Attachments
CREATE POLICY "problem_attachments_select" ON problem_attachments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_attachments.problem_id AND (SELECT private.has_blueprint_access(p.blueprint_id))));

CREATE POLICY "problem_attachments_insert" ON problem_attachments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM problems p WHERE p.id = problem_attachments.problem_id AND (SELECT private.can_write_blueprint(p.blueprint_id))));

CREATE POLICY "problem_attachments_delete" ON problem_attachments
  FOR DELETE TO authenticated
  USING (uploaded_by = (SELECT private.get_user_account_id()));

-- ============================================================================
-- Policy Comments
-- ============================================================================
COMMENT ON POLICY "qc_inspections_select" ON qc_inspections IS '品管檢查 SELECT 政策 - 有藍圖存取權的用戶可以查看';
COMMENT ON POLICY "acceptances_select" ON acceptances IS '驗收記錄 SELECT 政策 - 有藍圖存取權的用戶可以查看';
COMMENT ON POLICY "problems_select" ON problems IS '問題記錄 SELECT 政策 - 有藍圖存取權的用戶可以查看';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- Tasks
-- DROP POLICY IF EXISTS tasks_select ON tasks;
-- ... (更多 rollback 語句)

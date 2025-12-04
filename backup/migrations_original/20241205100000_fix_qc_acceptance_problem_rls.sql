-- ============================================================================
-- Migration: Fix QC, Acceptance, and Problem RLS Policies
-- Description: 修復品管、驗收、問題管理模組的 RLS 政策
-- Created: 2024-12-05
-- 
-- Problem Analysis:
-- 原始的 20241203100002_create_qc_acceptance_problem.sql 中的 RLS 政策
-- 錯誤地使用 `account_id = (SELECT auth.uid())` 模式。
-- 
-- auth.uid() 返回的是 auth.users.id (認證用戶 UUID)
-- 但 blueprint_members.account_id 引用的是 accounts.id
-- 這兩個是不同的值，導致 RLS 政策無法正常工作。
-- 
-- Solution:
-- 使用 private.has_blueprint_access() 和 private.get_user_account_id() 
-- 等已定義的 RLS 輔助函數來替換錯誤的政策。
-- ============================================================================

-- ############################################################################
-- PART 1: 刪除錯誤的 RLS 政策
-- ############################################################################

-- QC Inspections
DROP POLICY IF EXISTS qc_inspections_select_policy ON qc_inspections;
DROP POLICY IF EXISTS qc_inspections_insert_policy ON qc_inspections;
DROP POLICY IF EXISTS qc_inspections_update_policy ON qc_inspections;
DROP POLICY IF EXISTS qc_inspections_delete_policy ON qc_inspections;

-- QC Inspection Items
DROP POLICY IF EXISTS qc_inspection_items_select_policy ON qc_inspection_items;
DROP POLICY IF EXISTS qc_inspection_items_insert_policy ON qc_inspection_items;
DROP POLICY IF EXISTS qc_inspection_items_update_policy ON qc_inspection_items;
DROP POLICY IF EXISTS qc_inspection_items_delete_policy ON qc_inspection_items;

-- QC Inspection Attachments
DROP POLICY IF EXISTS qc_inspection_attachments_select_policy ON qc_inspection_attachments;
DROP POLICY IF EXISTS qc_inspection_attachments_insert_policy ON qc_inspection_attachments;
DROP POLICY IF EXISTS qc_inspection_attachments_delete_policy ON qc_inspection_attachments;

-- Acceptances
DROP POLICY IF EXISTS acceptances_select_policy ON acceptances;
DROP POLICY IF EXISTS acceptances_insert_policy ON acceptances;
DROP POLICY IF EXISTS acceptances_update_policy ON acceptances;
DROP POLICY IF EXISTS acceptances_delete_policy ON acceptances;

-- Acceptance Approvals
DROP POLICY IF EXISTS acceptance_approvals_select_policy ON acceptance_approvals;
DROP POLICY IF EXISTS acceptance_approvals_insert_policy ON acceptance_approvals;

-- Acceptance Attachments
DROP POLICY IF EXISTS acceptance_attachments_select_policy ON acceptance_attachments;
DROP POLICY IF EXISTS acceptance_attachments_insert_policy ON acceptance_attachments;
DROP POLICY IF EXISTS acceptance_attachments_delete_policy ON acceptance_attachments;

-- Problems
DROP POLICY IF EXISTS problems_select_policy ON problems;
DROP POLICY IF EXISTS problems_insert_policy ON problems;
DROP POLICY IF EXISTS problems_update_policy ON problems;
DROP POLICY IF EXISTS problems_delete_policy ON problems;

-- Problem Actions
DROP POLICY IF EXISTS problem_actions_select_policy ON problem_actions;
DROP POLICY IF EXISTS problem_actions_insert_policy ON problem_actions;

-- Problem Comments
DROP POLICY IF EXISTS problem_comments_select_policy ON problem_comments;
DROP POLICY IF EXISTS problem_comments_insert_policy ON problem_comments;
DROP POLICY IF EXISTS problem_comments_update_policy ON problem_comments;
DROP POLICY IF EXISTS problem_comments_delete_policy ON problem_comments;

-- Problem Attachments
DROP POLICY IF EXISTS problem_attachments_select_policy ON problem_attachments;
DROP POLICY IF EXISTS problem_attachments_insert_policy ON problem_attachments;
DROP POLICY IF EXISTS problem_attachments_delete_policy ON problem_attachments;

-- ############################################################################
-- PART 2: 創建正確的 RLS 政策
-- ############################################################################

-- ============================================================================
-- QC Inspections Policies (使用 private.has_blueprint_access)
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
  USING (
    created_by = (SELECT private.get_user_account_id())
    OR (SELECT private.can_write_blueprint(blueprint_id))
  );

-- ============================================================================
-- QC Inspection Items Policies
-- ============================================================================
CREATE POLICY "qc_inspection_items_select" ON qc_inspection_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM qc_inspections i
      WHERE i.id = qc_inspection_items.inspection_id
      AND (SELECT private.has_blueprint_access(i.blueprint_id))
    )
  );

CREATE POLICY "qc_inspection_items_insert" ON qc_inspection_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM qc_inspections i
      WHERE i.id = qc_inspection_items.inspection_id
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
    )
  );

CREATE POLICY "qc_inspection_items_update" ON qc_inspection_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM qc_inspections i
      WHERE i.id = qc_inspection_items.inspection_id
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
    )
  );

CREATE POLICY "qc_inspection_items_delete" ON qc_inspection_items
  FOR DELETE TO authenticated
  USING (
    checked_by = (SELECT private.get_user_account_id())
    OR EXISTS (
      SELECT 1 FROM qc_inspections i
      WHERE i.id = qc_inspection_items.inspection_id
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
    )
  );

-- ============================================================================
-- QC Inspection Attachments Policies
-- ============================================================================
CREATE POLICY "qc_inspection_attachments_select" ON qc_inspection_attachments
  FOR SELECT TO authenticated
  USING (
    (inspection_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM qc_inspections i
      WHERE i.id = qc_inspection_attachments.inspection_id
      AND (SELECT private.has_blueprint_access(i.blueprint_id))
    ))
    OR
    (item_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM qc_inspection_items it
      JOIN qc_inspections i ON it.inspection_id = i.id
      WHERE it.id = qc_inspection_attachments.item_id
      AND (SELECT private.has_blueprint_access(i.blueprint_id))
    ))
  );

CREATE POLICY "qc_inspection_attachments_insert" ON qc_inspection_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    (inspection_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM qc_inspections i
      WHERE i.id = qc_inspection_attachments.inspection_id
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
    ))
    OR
    (item_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM qc_inspection_items it
      JOIN qc_inspections i ON it.inspection_id = i.id
      WHERE it.id = qc_inspection_attachments.item_id
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
    ))
  );

CREATE POLICY "qc_inspection_attachments_delete" ON qc_inspection_attachments
  FOR DELETE TO authenticated
  USING (uploaded_by = (SELECT private.get_user_account_id()));

-- ============================================================================
-- Acceptances Policies
-- ============================================================================
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
  USING (
    created_by = (SELECT private.get_user_account_id())
    OR (SELECT private.can_write_blueprint(blueprint_id))
  );

-- ============================================================================
-- Acceptance Approvals Policies
-- ============================================================================
CREATE POLICY "acceptance_approvals_select" ON acceptance_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM acceptances a
      WHERE a.id = acceptance_approvals.acceptance_id
      AND (SELECT private.has_blueprint_access(a.blueprint_id))
    )
  );

CREATE POLICY "acceptance_approvals_insert" ON acceptance_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    approver_id = (SELECT private.get_user_account_id())
    AND EXISTS (
      SELECT 1 FROM acceptances a
      WHERE a.id = acceptance_approvals.acceptance_id
      AND (SELECT private.has_blueprint_access(a.blueprint_id))
    )
  );

-- ============================================================================
-- Acceptance Attachments Policies
-- ============================================================================
CREATE POLICY "acceptance_attachments_select" ON acceptance_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM acceptances a
      WHERE a.id = acceptance_attachments.acceptance_id
      AND (SELECT private.has_blueprint_access(a.blueprint_id))
    )
  );

CREATE POLICY "acceptance_attachments_insert" ON acceptance_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM acceptances a
      WHERE a.id = acceptance_attachments.acceptance_id
      AND (SELECT private.can_write_blueprint(a.blueprint_id))
    )
  );

CREATE POLICY "acceptance_attachments_delete" ON acceptance_attachments
  FOR DELETE TO authenticated
  USING (uploaded_by = (SELECT private.get_user_account_id()));

-- ============================================================================
-- Problems Policies
-- ============================================================================
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
  USING (
    created_by = (SELECT private.get_user_account_id())
    OR (SELECT private.can_write_blueprint(blueprint_id))
  );

-- ============================================================================
-- Problem Actions Policies
-- ============================================================================
CREATE POLICY "problem_actions_select" ON problem_actions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_actions.problem_id
      AND (SELECT private.has_blueprint_access(p.blueprint_id))
    )
  );

CREATE POLICY "problem_actions_insert" ON problem_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_actions.problem_id
      AND (SELECT private.can_write_blueprint(p.blueprint_id))
    )
  );

-- ============================================================================
-- Problem Comments Policies
-- ============================================================================
CREATE POLICY "problem_comments_select" ON problem_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_comments.problem_id
      AND (SELECT private.has_blueprint_access(p.blueprint_id))
    )
  );

CREATE POLICY "problem_comments_insert" ON problem_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT private.get_user_account_id())
    AND EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_comments.problem_id
      AND (SELECT private.has_blueprint_access(p.blueprint_id))
    )
  );

CREATE POLICY "problem_comments_update" ON problem_comments
  FOR UPDATE TO authenticated
  USING (author_id = (SELECT private.get_user_account_id()));

CREATE POLICY "problem_comments_delete" ON problem_comments
  FOR DELETE TO authenticated
  USING (author_id = (SELECT private.get_user_account_id()));

-- ============================================================================
-- Problem Attachments Policies
-- ============================================================================
CREATE POLICY "problem_attachments_select" ON problem_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_attachments.problem_id
      AND (SELECT private.has_blueprint_access(p.blueprint_id))
    )
  );

CREATE POLICY "problem_attachments_insert" ON problem_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_attachments.problem_id
      AND (SELECT private.can_write_blueprint(p.blueprint_id))
    )
  );

CREATE POLICY "problem_attachments_delete" ON problem_attachments
  FOR DELETE TO authenticated
  USING (uploaded_by = (SELECT private.get_user_account_id()));

-- ============================================================================
-- Documentation Comments
-- ============================================================================
COMMENT ON POLICY "qc_inspections_select" ON qc_inspections 
  IS '品管檢查 SELECT 政策 - 有藍圖存取權的用戶可以查看';
COMMENT ON POLICY "qc_inspections_insert" ON qc_inspections 
  IS '品管檢查 INSERT 政策 - 有藍圖寫入權的用戶可以創建';
COMMENT ON POLICY "qc_inspections_update" ON qc_inspections 
  IS '品管檢查 UPDATE 政策 - 有藍圖寫入權的用戶可以更新';
COMMENT ON POLICY "qc_inspections_delete" ON qc_inspections 
  IS '品管檢查 DELETE 政策 - 創建者或有藍圖寫入權的用戶可以刪除';

COMMENT ON POLICY "acceptances_select" ON acceptances 
  IS '驗收記錄 SELECT 政策 - 有藍圖存取權的用戶可以查看';
COMMENT ON POLICY "problems_select" ON problems 
  IS '問題記錄 SELECT 政策 - 有藍圖存取權的用戶可以查看';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- 回滾時需要重新創建原始政策，但這會有相同的 bug
-- 建議不要回滾此修復

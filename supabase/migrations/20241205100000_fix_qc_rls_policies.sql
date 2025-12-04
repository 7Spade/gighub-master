-- ============================================================================
-- Migration: Fix QC/Acceptance/Problem RLS Policies
-- Description: 修復 RLS 政策中的 auth.uid() 使用錯誤
-- Created: 2024-12-04
--
-- Problem:
-- RLS 政策使用 `account_id = (SELECT auth.uid())` 是錯誤的
-- auth.uid() 返回 auth.users.id，不是 accounts.id
-- 
-- Solution:
-- 改用 private.get_user_account_id() 或
-- 使用 accounts.auth_user_id = (SELECT auth.uid()) 連接
-- ============================================================================

-- ############################################################################
-- Part 1: QC Inspections RLS Policies Fix
-- ############################################################################

DROP POLICY IF EXISTS qc_inspections_select_policy ON qc_inspections;
DROP POLICY IF EXISTS qc_inspections_insert_policy ON qc_inspections;
DROP POLICY IF EXISTS qc_inspections_update_policy ON qc_inspections;
DROP POLICY IF EXISTS qc_inspections_delete_policy ON qc_inspections;

CREATE POLICY qc_inspections_select_policy ON qc_inspections
  FOR SELECT TO authenticated
  USING (
    (SELECT private.has_blueprint_access(blueprint_id))
  );

CREATE POLICY qc_inspections_insert_policy ON qc_inspections
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.can_write_blueprint(blueprint_id))
  );

CREATE POLICY qc_inspections_update_policy ON qc_inspections
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
  );

CREATE POLICY qc_inspections_delete_policy ON qc_inspections
  FOR DELETE TO authenticated
  USING (
    created_by = (SELECT private.get_user_account_id())
    OR (SELECT private.can_write_blueprint(blueprint_id))
  );

-- ############################################################################
-- Part 2: QC Inspection Items RLS Policies Fix
-- ############################################################################

DROP POLICY IF EXISTS qc_inspection_items_select_policy ON qc_inspection_items;
DROP POLICY IF EXISTS qc_inspection_items_insert_policy ON qc_inspection_items;
DROP POLICY IF EXISTS qc_inspection_items_update_policy ON qc_inspection_items;
DROP POLICY IF EXISTS qc_inspection_items_delete_policy ON qc_inspection_items;

CREATE POLICY qc_inspection_items_select_policy ON qc_inspection_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM qc_inspections i
      WHERE i.id = qc_inspection_items.inspection_id
      AND (SELECT private.has_blueprint_access(i.blueprint_id))
    )
  );

CREATE POLICY qc_inspection_items_insert_policy ON qc_inspection_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM qc_inspections i
      WHERE i.id = qc_inspection_items.inspection_id
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
    )
  );

CREATE POLICY qc_inspection_items_update_policy ON qc_inspection_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM qc_inspections i
      WHERE i.id = qc_inspection_items.inspection_id
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
    )
  );

CREATE POLICY qc_inspection_items_delete_policy ON qc_inspection_items
  FOR DELETE TO authenticated
  USING (
    checked_by = (SELECT private.get_user_account_id())
    OR EXISTS (
      SELECT 1 FROM qc_inspections i
      WHERE i.id = qc_inspection_items.inspection_id
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
    )
  );

-- ############################################################################
-- Part 3: QC Inspection Attachments RLS Policies Fix
-- ############################################################################

DROP POLICY IF EXISTS qc_inspection_attachments_select_policy ON qc_inspection_attachments;
DROP POLICY IF EXISTS qc_inspection_attachments_insert_policy ON qc_inspection_attachments;
DROP POLICY IF EXISTS qc_inspection_attachments_delete_policy ON qc_inspection_attachments;

CREATE POLICY qc_inspection_attachments_select_policy ON qc_inspection_attachments
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
      JOIN qc_inspections i ON i.id = it.inspection_id
      WHERE it.id = qc_inspection_attachments.item_id
      AND (SELECT private.has_blueprint_access(i.blueprint_id))
    ))
  );

CREATE POLICY qc_inspection_attachments_insert_policy ON qc_inspection_attachments
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
      JOIN qc_inspections i ON i.id = it.inspection_id
      WHERE it.id = qc_inspection_attachments.item_id
      AND (SELECT private.can_write_blueprint(i.blueprint_id))
    ))
  );

CREATE POLICY qc_inspection_attachments_delete_policy ON qc_inspection_attachments
  FOR DELETE TO authenticated
  USING (
    uploaded_by = (SELECT private.get_user_account_id())
  );

-- ############################################################################
-- Part 4: Acceptances RLS Policies Fix
-- ############################################################################

DROP POLICY IF EXISTS acceptances_select_policy ON acceptances;
DROP POLICY IF EXISTS acceptances_insert_policy ON acceptances;
DROP POLICY IF EXISTS acceptances_update_policy ON acceptances;
DROP POLICY IF EXISTS acceptances_delete_policy ON acceptances;

CREATE POLICY acceptances_select_policy ON acceptances
  FOR SELECT TO authenticated
  USING (
    (SELECT private.has_blueprint_access(blueprint_id))
  );

CREATE POLICY acceptances_insert_policy ON acceptances
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.can_write_blueprint(blueprint_id))
  );

CREATE POLICY acceptances_update_policy ON acceptances
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
  );

CREATE POLICY acceptances_delete_policy ON acceptances
  FOR DELETE TO authenticated
  USING (
    created_by = (SELECT private.get_user_account_id())
    OR (SELECT private.can_write_blueprint(blueprint_id))
  );

-- ############################################################################
-- Part 5: Acceptance Approvals RLS Policies Fix
-- ############################################################################

DROP POLICY IF EXISTS acceptance_approvals_select_policy ON acceptance_approvals;
DROP POLICY IF EXISTS acceptance_approvals_insert_policy ON acceptance_approvals;

CREATE POLICY acceptance_approvals_select_policy ON acceptance_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM acceptances a
      WHERE a.id = acceptance_approvals.acceptance_id
      AND (SELECT private.has_blueprint_access(a.blueprint_id))
    )
  );

CREATE POLICY acceptance_approvals_insert_policy ON acceptance_approvals
  FOR INSERT TO authenticated
  WITH CHECK (
    approver_id = (SELECT private.get_user_account_id())
    AND EXISTS (
      SELECT 1 FROM acceptances a
      WHERE a.id = acceptance_approvals.acceptance_id
      AND (SELECT private.can_write_blueprint(a.blueprint_id))
    )
  );

-- ############################################################################
-- Part 6: Acceptance Attachments RLS Policies Fix
-- ############################################################################

DROP POLICY IF EXISTS acceptance_attachments_select_policy ON acceptance_attachments;
DROP POLICY IF EXISTS acceptance_attachments_insert_policy ON acceptance_attachments;
DROP POLICY IF EXISTS acceptance_attachments_delete_policy ON acceptance_attachments;

CREATE POLICY acceptance_attachments_select_policy ON acceptance_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM acceptances a
      WHERE a.id = acceptance_attachments.acceptance_id
      AND (SELECT private.has_blueprint_access(a.blueprint_id))
    )
  );

CREATE POLICY acceptance_attachments_insert_policy ON acceptance_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM acceptances a
      WHERE a.id = acceptance_attachments.acceptance_id
      AND (SELECT private.can_write_blueprint(a.blueprint_id))
    )
  );

CREATE POLICY acceptance_attachments_delete_policy ON acceptance_attachments
  FOR DELETE TO authenticated
  USING (
    uploaded_by = (SELECT private.get_user_account_id())
  );

-- ############################################################################
-- Part 7: Problems RLS Policies Fix
-- ############################################################################

DROP POLICY IF EXISTS problems_select_policy ON problems;
DROP POLICY IF EXISTS problems_insert_policy ON problems;
DROP POLICY IF EXISTS problems_update_policy ON problems;
DROP POLICY IF EXISTS problems_delete_policy ON problems;

CREATE POLICY problems_select_policy ON problems
  FOR SELECT TO authenticated
  USING (
    (SELECT private.has_blueprint_access(blueprint_id))
  );

CREATE POLICY problems_insert_policy ON problems
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.can_write_blueprint(blueprint_id))
  );

CREATE POLICY problems_update_policy ON problems
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
  );

CREATE POLICY problems_delete_policy ON problems
  FOR DELETE TO authenticated
  USING (
    created_by = (SELECT private.get_user_account_id())
    OR (SELECT private.can_write_blueprint(blueprint_id))
  );

-- ############################################################################
-- Part 8: Problem Actions RLS Policies Fix
-- ############################################################################

DROP POLICY IF EXISTS problem_actions_select_policy ON problem_actions;
DROP POLICY IF EXISTS problem_actions_insert_policy ON problem_actions;

CREATE POLICY problem_actions_select_policy ON problem_actions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_actions.problem_id
      AND (SELECT private.has_blueprint_access(p.blueprint_id))
    )
  );

CREATE POLICY problem_actions_insert_policy ON problem_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_actions.problem_id
      AND (SELECT private.can_write_blueprint(p.blueprint_id))
    )
  );

-- ############################################################################
-- Part 9: Problem Comments RLS Policies Fix
-- ############################################################################

DROP POLICY IF EXISTS problem_comments_select_policy ON problem_comments;
DROP POLICY IF EXISTS problem_comments_insert_policy ON problem_comments;
DROP POLICY IF EXISTS problem_comments_update_policy ON problem_comments;
DROP POLICY IF EXISTS problem_comments_delete_policy ON problem_comments;

CREATE POLICY problem_comments_select_policy ON problem_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_comments.problem_id
      AND (SELECT private.has_blueprint_access(p.blueprint_id))
    )
  );

CREATE POLICY problem_comments_insert_policy ON problem_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT private.get_user_account_id())
    AND EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_comments.problem_id
      AND (SELECT private.has_blueprint_access(p.blueprint_id))
    )
  );

CREATE POLICY problem_comments_update_policy ON problem_comments
  FOR UPDATE TO authenticated
  USING (
    author_id = (SELECT private.get_user_account_id())
  );

CREATE POLICY problem_comments_delete_policy ON problem_comments
  FOR DELETE TO authenticated
  USING (
    author_id = (SELECT private.get_user_account_id())
  );

-- ############################################################################
-- Part 10: Problem Attachments RLS Policies Fix
-- ############################################################################

DROP POLICY IF EXISTS problem_attachments_select_policy ON problem_attachments;
DROP POLICY IF EXISTS problem_attachments_insert_policy ON problem_attachments;
DROP POLICY IF EXISTS problem_attachments_delete_policy ON problem_attachments;

CREATE POLICY problem_attachments_select_policy ON problem_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_attachments.problem_id
      AND (SELECT private.has_blueprint_access(p.blueprint_id))
    )
  );

CREATE POLICY problem_attachments_insert_policy ON problem_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM problems p
      WHERE p.id = problem_attachments.problem_id
      AND (SELECT private.can_write_blueprint(p.blueprint_id))
    )
  );

CREATE POLICY problem_attachments_delete_policy ON problem_attachments
  FOR DELETE TO authenticated
  USING (
    uploaded_by = (SELECT private.get_user_account_id())
  );

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON POLICY qc_inspections_select_policy ON qc_inspections IS 
  'QC 檢查 SELECT 政策 - 使用 private.has_blueprint_access() 檢查藍圖存取權限';
COMMENT ON POLICY qc_inspections_insert_policy ON qc_inspections IS 
  'QC 檢查 INSERT 政策 - 使用 private.can_write_blueprint() 檢查藍圖寫入權限';
COMMENT ON POLICY qc_inspections_update_policy ON qc_inspections IS 
  'QC 檢查 UPDATE 政策 - 使用 private.can_write_blueprint() 檢查藍圖寫入權限';
COMMENT ON POLICY qc_inspections_delete_policy ON qc_inspections IS 
  'QC 檢查 DELETE 政策 - 創建者或藍圖寫入權限者可刪除';

COMMENT ON POLICY acceptances_select_policy ON acceptances IS 
  '驗收 SELECT 政策 - 使用 private.has_blueprint_access() 檢查藍圖存取權限';
COMMENT ON POLICY acceptances_insert_policy ON acceptances IS 
  '驗收 INSERT 政策 - 使用 private.can_write_blueprint() 檢查藍圖寫入權限';
COMMENT ON POLICY acceptances_update_policy ON acceptances IS 
  '驗收 UPDATE 政策 - 使用 private.can_write_blueprint() 檢查藍圖寫入權限';
COMMENT ON POLICY acceptances_delete_policy ON acceptances IS 
  '驗收 DELETE 政策 - 創建者或藍圖寫入權限者可刪除';

COMMENT ON POLICY problems_select_policy ON problems IS 
  '問題 SELECT 政策 - 使用 private.has_blueprint_access() 檢查藍圖存取權限';
COMMENT ON POLICY problems_insert_policy ON problems IS 
  '問題 INSERT 政策 - 使用 private.can_write_blueprint() 檢查藍圖寫入權限';
COMMENT ON POLICY problems_update_policy ON problems IS 
  '問題 UPDATE 政策 - 使用 private.can_write_blueprint() 檢查藍圖寫入權限';
COMMENT ON POLICY problems_delete_policy ON problems IS 
  '問題 DELETE 政策 - 創建者或藍圖寫入權限者可刪除';

-- ============================================================================
-- DOWN (Rollback) - 恢復原始政策
-- ============================================================================
-- 如需回滾，請運行原始 20241203100002_create_qc_acceptance_problem.sql 中的政策部分

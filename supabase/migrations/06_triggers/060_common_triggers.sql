-- ============================================================================
-- Migration: 060_common_triggers
-- Layer: 06_triggers
-- Description: 通用觸發器 (updated_at, 審計等)
-- Dependencies: 所有表
-- ============================================================================

-- ############################################################################
-- UPDATED_AT TRIGGER FUNCTION
-- ############################################################################

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ############################################################################
-- APPLY UPDATED_AT TRIGGERS TO ALL TABLES
-- ############################################################################

-- Core Tables
CREATE TRIGGER set_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Workspace Tables
CREATE TRIGGER set_blueprints_updated_at
  BEFORE UPDATE ON blueprints
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_blueprint_roles_updated_at
  BEFORE UPDATE ON blueprint_roles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_blueprint_members_updated_at
  BEFORE UPDATE ON blueprint_members
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_blueprint_team_roles_updated_at
  BEFORE UPDATE ON blueprint_team_roles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Module Tables
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_task_acceptances_updated_at
  BEFORE UPDATE ON task_acceptances
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_diaries_updated_at
  BEFORE UPDATE ON diaries
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_checklists_updated_at
  BEFORE UPDATE ON checklists
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_issue_comments_updated_at
  BEFORE UPDATE ON issue_comments
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_qc_inspections_updated_at
  BEFORE UPDATE ON qc_inspections
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_qc_inspection_items_updated_at
  BEFORE UPDATE ON qc_inspection_items
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_acceptances_updated_at
  BEFORE UPDATE ON acceptances
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

CREATE TRIGGER set_problem_comments_updated_at
  BEFORE UPDATE ON problem_comments
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TRIGGER IF EXISTS set_accounts_updated_at ON accounts;
-- ... (更多 rollback 語句)
-- DROP FUNCTION IF EXISTS private.set_updated_at();

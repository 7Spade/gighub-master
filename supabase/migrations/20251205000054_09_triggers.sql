-- ============================================================================
-- Migration: 09 - Utility Triggers
-- Description: 建立通用觸發器 (updated_at 自動更新)
-- Category: 09 - Triggers
-- ============================================================================

-- 更新 updated_at 欄位的觸發器函數
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 授權執行權限
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO authenticated;

-- 為所有需要的表建立觸發器

-- Accounts
CREATE TRIGGER update_accounts_updated_at 
  BEFORE UPDATE ON accounts 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Organizations
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Organization Members
CREATE TRIGGER update_organization_members_updated_at 
  BEFORE UPDATE ON organization_members 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Teams
CREATE TRIGGER update_teams_updated_at 
  BEFORE UPDATE ON teams 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Team Members
CREATE TRIGGER update_team_members_updated_at 
  BEFORE UPDATE ON team_members 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Blueprints
CREATE TRIGGER update_blueprints_updated_at 
  BEFORE UPDATE ON blueprints 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Blueprint Members
CREATE TRIGGER update_blueprint_members_updated_at 
  BEFORE UPDATE ON blueprint_members 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Blueprint Team Roles
CREATE TRIGGER update_blueprint_team_roles_updated_at 
  BEFORE UPDATE ON blueprint_team_roles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Blueprint Roles
CREATE TRIGGER update_blueprint_roles_updated_at 
  BEFORE UPDATE ON blueprint_roles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Tasks
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Diaries
CREATE TRIGGER update_diaries_updated_at 
  BEFORE UPDATE ON diaries 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Checklists
CREATE TRIGGER update_checklists_updated_at 
  BEFORE UPDATE ON checklists 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Checklist Items
CREATE TRIGGER update_checklist_items_updated_at 
  BEFORE UPDATE ON checklist_items 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Task Acceptances
CREATE TRIGGER update_task_acceptances_updated_at 
  BEFORE UPDATE ON task_acceptances 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Todos
CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON todos 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Issues
CREATE TRIGGER update_issues_updated_at 
  BEFORE UPDATE ON issues 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Issue Comments
CREATE TRIGGER update_issue_comments_updated_at 
  BEFORE UPDATE ON issue_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Diary Entries
CREATE TRIGGER update_diary_entries_updated_at 
  BEFORE UPDATE ON diary_entries 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Notifications (no updated_at, skip)

-- Container Infrastructure Tables
CREATE TRIGGER update_blueprint_configs_updated_at 
  BEFORE UPDATE ON blueprint_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_event_subscriptions_updated_at 
  BEFORE UPDATE ON event_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_custom_field_definitions_updated_at 
  BEFORE UPDATE ON custom_field_definitions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_custom_field_values_updated_at 
  BEFORE UPDATE ON custom_field_values 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_search_index_updated_at 
  BEFORE UPDATE ON search_index 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_files_updated_at 
  BEFORE UPDATE ON files 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- Financial Tables
CREATE TRIGGER update_contracts_updated_at 
  BEFORE UPDATE ON contracts 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON expenses 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payment_requests_updated_at 
  BEFORE UPDATE ON payment_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- QC/Acceptance/Problem Tables
CREATE TRIGGER update_qc_inspections_updated_at 
  BEFORE UPDATE ON qc_inspections 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_qc_inspection_items_updated_at 
  BEFORE UPDATE ON qc_inspection_items 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_acceptances_updated_at 
  BEFORE UPDATE ON acceptances 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_acceptance_approvals_updated_at 
  BEFORE UPDATE ON acceptance_approvals 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_problems_updated_at 
  BEFORE UPDATE ON problems 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_problem_actions_updated_at 
  BEFORE UPDATE ON problem_actions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_problem_comments_updated_at 
  BEFORE UPDATE ON problem_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

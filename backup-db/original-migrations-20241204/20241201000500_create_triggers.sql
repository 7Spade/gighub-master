-- ============================================================================
-- Migration: Create Utility Triggers
-- Description: 建立通用觸發器 (updated_at 自動更新)
-- Created: 2024-12-01
-- ============================================================================

-- ############################################################################
-- PART 7: UTILITY TRIGGERS (通用觸發器)
-- ############################################################################

-- ----------------------------------------------------------------------------
-- 更新 updated_at 欄位的觸發器函數
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 授權執行權限
GRANT EXECUTE ON FUNCTION public.update_updated_at() TO authenticated;

-- ----------------------------------------------------------------------------
-- 為所有需要的表建立觸發器
-- ----------------------------------------------------------------------------

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

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
-- DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
-- DROP TRIGGER IF EXISTS update_organization_members_updated_at ON organization_members;
-- DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
-- DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
-- DROP TRIGGER IF EXISTS update_blueprints_updated_at ON blueprints;
-- DROP TRIGGER IF EXISTS update_blueprint_members_updated_at ON blueprint_members;
-- DROP TRIGGER IF EXISTS update_blueprint_team_roles_updated_at ON blueprint_team_roles;
-- DROP TRIGGER IF EXISTS update_blueprint_roles_updated_at ON blueprint_roles;
-- DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
-- DROP TRIGGER IF EXISTS update_diaries_updated_at ON diaries;
-- DROP TRIGGER IF EXISTS update_diary_entries_updated_at ON diary_entries;
-- DROP TRIGGER IF EXISTS update_checklists_updated_at ON checklists;
-- DROP TRIGGER IF EXISTS update_checklist_items_updated_at ON checklist_items;
-- DROP TRIGGER IF EXISTS update_task_acceptances_updated_at ON task_acceptances;
-- DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
-- DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
-- DROP TRIGGER IF EXISTS update_issue_comments_updated_at ON issue_comments;
-- DROP FUNCTION IF EXISTS public.update_updated_at();

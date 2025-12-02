-- ============================================================================
-- GigHub Database Schema
-- Multi-Tenant SaaS with Role-Based Access Control (RBAC)
-- ============================================================================
--
-- 📋 目錄 TABLE OF CONTENTS
-- ============================================================================
-- PART 1:  ENUMS             列舉類型定義
--          - account_type        帳號類型 (user=個人用戶, org=組織, bot=自動化帳號)
--          - account_status      帳號狀態 (active=啟用, inactive=未啟用, suspended=停權, deleted=刪除)
--          - organization_role   組織角色 (owner=擁有者, admin=管理員, member=成員)
--          - team_role           團隊角色 (leader=領導, member=成員)
--          - blueprint_role      藍圖成員角色 (viewer=檢視, contributor=貢獻, maintainer=維護)
--          - blueprint_team_access 藍圖團隊存取 (read=讀取, write=寫入, admin=管理)
--          - module_type         啟用模組 (tasks=任務, diary=日誌, dashboard=儀表板, files=檔案, ...)
--          - task_status         任務狀態 (pending=待處理, in_progress=進行中, completed=完成, ...)
--          - task_priority       任務優先級 (lowest=最低, low=低, medium=中, high=高, highest=最高)
--          - issue_severity      問題嚴重度 (low=輕微, medium=中等, high=嚴重, critical=緊急)
--          - issue_status        問題狀態 (new=新建, assigned=已指派, resolved=已解決, closed=關閉, ...)
--          - acceptance_result   驗收結果 (pending=待驗收, passed=通過, failed=不通過, conditional=條件通過)
--          - weather_type        天氣類型 (sunny=晴, cloudy=多雲, rainy=雨, stormy=暴風雨, ...)
--          - blueprint_business_role 業務角色 (project_manager=專案經理, site_director=工地主任, ...)
-- PART 2:  PRIVATE SCHEMA    私有 Schema (RLS 輔助用)
-- PART 3:  CORE TABLES       核心資料表 (帳號/組織/團隊)
-- PART 4:  BLUEPRINT TABLES  藍圖/工作區資料表 (含 blueprint_roles)
-- PART 5:  MODULE TABLES     業務模組資料表 (任務/日誌/驗收等)
-- PART 6:  RLS HELPERS       RLS 輔助函數 (SECURITY DEFINER)
-- PART 7:  UTILITY TRIGGERS  通用觸發器 (updated_at)
-- PART 8:  ROW LEVEL SECURITY 資料列安全政策 (RLS Policies)
-- PART 9:  AUTH INTEGRATION  認證整合 (Auth → Account 自動建立)
-- PART 10: ORGANIZATION API  組織 API (建立組織 + 自動加入成員)
-- PART 11: TEAM API          團隊 API (建立團隊)
-- PART 12: BLUEPRINT API     藍圖 API (建立藍圖 + 自動加入成員)
-- PART 13: DOCUMENTATION     資料表與函數文件註解
-- PART 14: RBAC API          RBAC 預設角色 API (建立預設角色)
-- PART 15: CONTAINER INFRASTRUCTURE 容器層核心基礎設施 (12 項)
--          - 15.1 Blueprint Configs      藍圖配置中心
--          - 15.2 Activity Timeline      時間軸服務
--          - 15.3 Event Bus             事件總線
--          - 15.4 Entity References     關聯管理
--          - 15.5 Metadata System       元數據系統
--          - 15.6 Lifecycle Management  生命週期管理
--          - 15.7 Search Infrastructure 搜尋引擎基礎設施
--          - 15.8 Files Management      檔案管理
--          - 15.9 Permission Views      權限系統視圖
--          - 15.10 API Gateway          API 閘道函數
--          - 15.11 Notification Enhancement 通知中心增強
-- PART 16: DOCUMENTATION FOR NEW INFRASTRUCTURE 新基礎設施文件註解
-- PART 17: STORAGE CONFIGURATION 儲存配置 (Storage Buckets & Policies)
-- PART 18: REALTIME CONFIGURATION 即時配置 (Realtime Channels)
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS (列舉類型定義)
-- ############################################################################

-- 帳號類型: user=個人用戶, org=組織, bot=自動化帳號/系統機器人
CREATE TYPE account_type AS ENUM ('user', 'org', 'bot');

-- 帳號狀態: active=啟用中, inactive=未啟用, suspended=已停權, deleted=已刪除
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');

-- 組織角色: owner=最高權限/擁有者, admin=管理員, member=一般成員
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');

-- 團隊角色: leader=團隊領導/可管理成員, member=一般成員
CREATE TYPE team_role AS ENUM ('leader', 'member');

-- 藍圖成員角色: viewer=僅檢視, contributor=可編輯內容, maintainer=可管理成員與設定
CREATE TYPE blueprint_role AS ENUM ('viewer', 'contributor', 'maintainer');

-- 藍圖團隊存取等級: read=唯讀, write=可寫入, admin=完整管理權限
CREATE TYPE blueprint_team_access AS ENUM ('read', 'write', 'admin');

-- 啟用模組類型: tasks=任務管理, diary=施工日誌, dashboard=儀表板, bot_workflow=自動化流程,
--               files=檔案管理, todos=待辦事項, checklists=檢查清單, issues=問題追蹤
CREATE TYPE module_type AS ENUM ('tasks', 'diary', 'dashboard', 'bot_workflow', 'files', 'todos', 'checklists', 'issues');

-- 任務狀態: pending=待處理, in_progress=進行中, in_review=審核中, completed=已完成, cancelled=已取消, blocked=已阻擋
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked');

-- 任務優先級: lowest=最低, low=低, medium=中, high=高, highest=最高
CREATE TYPE task_priority AS ENUM ('lowest', 'low', 'medium', 'high', 'highest');

-- 問題嚴重度: low=輕微, medium=中等, high=嚴重, critical=緊急
CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- 問題狀態: new=新建立, assigned=已指派, in_progress=處理中, pending_confirm=待確認, resolved=已解決, closed=已關閉, reopened=重新開啟
CREATE TYPE issue_status AS ENUM ('new', 'assigned', 'in_progress', 'pending_confirm', 'resolved', 'closed', 'reopened');

-- 驗收結果: pending=待驗收, passed=通過, failed=不通過, conditional=有條件通過
CREATE TYPE acceptance_result AS ENUM ('pending', 'passed', 'failed', 'conditional');

-- 天氣類型: sunny=晴天, cloudy=多雲, rainy=雨天, stormy=暴風雨, snowy=下雪, foggy=霧天
CREATE TYPE weather_type AS ENUM ('sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy');

-- 藍圖業務角色: project_manager=專案經理, site_director=工地主任, site_supervisor=現場監督,
--               worker=施工人員, qa_staff=品管人員, safety_health=公共安全衛生, finance=財務, observer=觀察者
CREATE TYPE blueprint_business_role AS ENUM (
  'project_manager',
  'site_director',
  'site_supervisor',
  'worker',
  'qa_staff',
  'safety_health',
  'finance',
  'observer'
);

-- ############################################################################
-- PART 2: PRIVATE SCHEMA (私有 Schema)
-- ############################################################################
-- 用於存放 RLS 輔助函數，避免公開暴露

CREATE SCHEMA IF NOT EXISTS private;

-- ############################################################################
-- PART 3: CORE TABLES (核心資料表)
-- ############################################################################
-- 基礎層：帳號、組織、團隊

-- ----------------------------------------------------------------------------
-- Table: accounts (帳號)
-- 統一的身分識別表，type 區分 user/org/bot
-- ----------------------------------------------------------------------------
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID,                              -- 連結 auth.users (僅 user 類型需要)
  type account_type NOT NULL DEFAULT 'user',
  status account_status NOT NULL DEFAULT 'active',
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  avatar TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT accounts_email_unique UNIQUE (email)
);

CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_auth_user_id ON accounts(auth_user_id);

-- user 類型的 auth_user_id 必須唯一
CREATE UNIQUE INDEX accounts_auth_user_id_unique_user_only 
ON accounts (auth_user_id) 
WHERE type = 'user' AND auth_user_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Table: organizations (組織)
-- 組織實體，擁有獨立的 account (type='org')
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),        -- 建立者的 account_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT organizations_account_id_unique UNIQUE (account_id)
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ----------------------------------------------------------------------------
-- Table: organization_members (組織成員)
-- 用戶與組織的多對多關聯
-- ----------------------------------------------------------------------------
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT organization_members_unique UNIQUE (organization_id, account_id)
);

CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_organization_members_account ON organization_members(account_id);

-- ----------------------------------------------------------------------------
-- Table: teams (團隊)
-- 組織內的群組，用於批量授權 (非資產擁有者)
-- ----------------------------------------------------------------------------
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT teams_name_unique UNIQUE (organization_id, name)
);

CREATE INDEX idx_teams_organization ON teams(organization_id);

-- ----------------------------------------------------------------------------
-- Table: team_members (團隊成員)
-- 用戶與團隊的多對多關聯
-- ----------------------------------------------------------------------------
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT team_members_unique UNIQUE (team_id, account_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_account ON team_members(account_id);

-- ############################################################################
-- PART 4: BLUEPRINT TABLES (藍圖/工作區資料表)
-- ############################################################################
-- 容器層：藍圖是所有業務模組的容器

-- ----------------------------------------------------------------------------
-- Table: blueprints (藍圖/工作區)
-- 資產容器，Owner = User account 或 Organization account
-- ----------------------------------------------------------------------------
CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,  -- 可以是 user 或 org 的 account
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  status account_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  enabled_modules module_type[] DEFAULT ARRAY['tasks']::module_type[],
  created_by UUID REFERENCES accounts(id),        -- 建立者的 account_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT blueprints_slug_unique UNIQUE (owner_id, slug)
);

CREATE INDEX idx_blueprints_owner ON blueprints(owner_id);
CREATE INDEX idx_blueprints_status ON blueprints(status);

-- ----------------------------------------------------------------------------
-- Table: blueprint_members (藍圖成員)
-- 藍圖層級的存取控制
-- ----------------------------------------------------------------------------
CREATE TABLE blueprint_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  role blueprint_role NOT NULL DEFAULT 'viewer',
  business_role blueprint_business_role,           -- 業務角色 (RBAC)
  custom_role_id UUID,                             -- 自訂角色參考 (延遲外鍵)
  is_external BOOLEAN NOT NULL DEFAULT false,     -- 外部協作者標記
  invited_by UUID REFERENCES accounts(id),
  invited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT blueprint_members_unique UNIQUE (blueprint_id, account_id)
);

CREATE INDEX idx_blueprint_members_blueprint ON blueprint_members(blueprint_id);
CREATE INDEX idx_blueprint_members_account ON blueprint_members(account_id);
CREATE INDEX idx_blueprint_members_role ON blueprint_members(role);
CREATE INDEX idx_blueprint_members_business_role ON blueprint_members(business_role);

-- ----------------------------------------------------------------------------
-- Table: blueprint_team_roles (藍圖團隊授權)
-- 透過團隊批量授權藍圖存取 (非擁有權)
-- ----------------------------------------------------------------------------
CREATE TABLE blueprint_team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  access_level blueprint_team_access NOT NULL DEFAULT 'read',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT blueprint_team_roles_unique UNIQUE (blueprint_id, team_id)
);

CREATE INDEX idx_blueprint_team_roles_blueprint ON blueprint_team_roles(blueprint_id);
CREATE INDEX idx_blueprint_team_roles_team ON blueprint_team_roles(team_id);

-- ----------------------------------------------------------------------------
-- Table: blueprint_roles (藍圖角色定義)
-- Custom role definitions per blueprint, allowing future flexibility
-- ----------------------------------------------------------------------------
CREATE TABLE blueprint_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  business_role blueprint_business_role NOT NULL DEFAULT 'observer',
  permissions JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Each blueprint can only have one role with a given name
  CONSTRAINT blueprint_roles_name_unique UNIQUE (blueprint_id, name)
);

CREATE INDEX idx_blueprint_roles_blueprint ON blueprint_roles(blueprint_id);
CREATE INDEX idx_blueprint_roles_business_role ON blueprint_roles(business_role);

-- Add foreign key from blueprint_members to blueprint_roles (after blueprint_roles is created)
ALTER TABLE blueprint_members 
  ADD CONSTRAINT blueprint_members_custom_role_fk 
  FOREIGN KEY (custom_role_id) REFERENCES blueprint_roles(id) ON DELETE SET NULL;

CREATE INDEX idx_blueprint_members_custom_role ON blueprint_members(custom_role_id);

-- ############################################################################
-- PART 5: MODULE TABLES (業務模組資料表)
-- ############################################################################
-- 業務層：任務、日誌、驗收、問題追蹤等

-- ----------------------------------------------------------------------------
-- Table: tasks (任務)
-- ----------------------------------------------------------------------------
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  due_date DATE,
  start_date DATE,
  completion_rate INTEGER DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_blueprint ON tasks(blueprint_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ----------------------------------------------------------------------------
-- Table: task_attachments (任務附件)
-- ----------------------------------------------------------------------------
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_attachments_task ON task_attachments(task_id);

-- ----------------------------------------------------------------------------
-- Table: diaries (施工日誌)
-- ----------------------------------------------------------------------------
CREATE TABLE diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  weather weather_type,
  temperature_min INTEGER,
  temperature_max INTEGER,
  work_hours DECIMAL(4,2),
  worker_count INTEGER,
  summary TEXT,
  notes TEXT,
  status account_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES accounts(id),
  approved_by UUID REFERENCES accounts(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT diaries_unique UNIQUE (blueprint_id, work_date)
);

CREATE INDEX idx_diaries_blueprint ON diaries(blueprint_id);
CREATE INDEX idx_diaries_work_date ON diaries(work_date);

-- ----------------------------------------------------------------------------
-- Table: diary_attachments (日誌附件/施工照片)
-- ----------------------------------------------------------------------------
CREATE TABLE diary_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES diaries(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  caption TEXT,
  uploaded_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diary_attachments_diary ON diary_attachments(diary_id);

-- ----------------------------------------------------------------------------
-- Table: checklists (檢查清單)
-- ----------------------------------------------------------------------------
CREATE TABLE checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_checklists_blueprint ON checklists(blueprint_id);

-- ----------------------------------------------------------------------------
-- Table: checklist_items (檢查項目)
-- ----------------------------------------------------------------------------
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);

-- ----------------------------------------------------------------------------
-- Table: task_acceptances (品質驗收記錄)
-- ----------------------------------------------------------------------------
CREATE TABLE task_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES checklists(id) ON DELETE SET NULL,
  result acceptance_result NOT NULL DEFAULT 'pending',
  notes TEXT,
  accepted_by UUID REFERENCES accounts(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_acceptances_task ON task_acceptances(task_id);
CREATE INDEX idx_task_acceptances_result ON task_acceptances(result);

-- ----------------------------------------------------------------------------
-- Table: todos (待辦事項)
-- 個人待辦清單
-- ----------------------------------------------------------------------------
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_todos_blueprint ON todos(blueprint_id);
CREATE INDEX idx_todos_account ON todos(account_id);
CREATE INDEX idx_todos_completed ON todos(is_completed);

-- ----------------------------------------------------------------------------
-- Table: issues (問題追蹤)
-- ----------------------------------------------------------------------------
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity issue_severity NOT NULL DEFAULT 'medium',
  status issue_status NOT NULL DEFAULT 'new',
  reported_by UUID REFERENCES accounts(id),
  assigned_to UUID REFERENCES accounts(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_issues_blueprint ON issues(blueprint_id);
CREATE INDEX idx_issues_task ON issues(task_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_severity ON issues(severity);

-- ----------------------------------------------------------------------------
-- Table: issue_comments (問題評論)
-- ----------------------------------------------------------------------------
CREATE TABLE issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_comments_issue ON issue_comments(issue_id);

-- ----------------------------------------------------------------------------
-- Table: notifications (通知)
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_account ON notifications(account_id);
CREATE INDEX idx_notifications_blueprint ON notifications(blueprint_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);


-- ############################################################################
-- PART 6: RLS HELPER FUNCTIONS (RLS 輔助函數)
-- ############################################################################
-- 使用 SECURITY DEFINER 避免 RLS 遞迴問題

-- ----------------------------------------------------------------------------
-- private.get_user_account_id()
-- 取得當前登入用戶的 account_id
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.get_user_account_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE auth_user_id = auth.uid()
    AND type = 'user'
    AND status != 'deleted'
  LIMIT 1;
  
  RETURN v_account_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- private.is_account_owner()
-- 檢查用戶是否擁有該帳號
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_account_owner(p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = p_account_id
    AND auth_user_id = auth.uid()
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- private.is_organization_member()
-- 檢查用戶是否為組織成員
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_organization_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.accounts a ON a.id = om.account_id
    WHERE om.organization_id = p_org_id
    AND a.auth_user_id = auth.uid()
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- private.get_organization_role()
-- 取得用戶在組織中的角色
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.get_organization_role(p_org_id UUID)
RETURNS public.organization_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_role public.organization_role;
BEGIN
  SELECT om.role INTO v_role
  FROM public.organization_members om
  JOIN public.accounts a ON a.id = om.account_id
  WHERE om.organization_id = p_org_id
  AND a.auth_user_id = auth.uid();
  
  RETURN v_role;
END;
$$;

-- ----------------------------------------------------------------------------
-- private.is_organization_admin()
-- 檢查用戶是否為組織 owner 或 admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_organization_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.accounts a ON a.id = om.account_id
    WHERE om.organization_id = p_org_id
    AND a.auth_user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- private.is_team_member()
-- 檢查用戶是否為團隊成員
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_team_member(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.accounts a ON a.id = tm.account_id
    WHERE tm.team_id = p_team_id
    AND a.auth_user_id = auth.uid()
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- private.is_team_leader()
-- 檢查用戶是否為團隊 leader
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_team_leader(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.accounts a ON a.id = tm.account_id
    WHERE tm.team_id = p_team_id
    AND a.auth_user_id = auth.uid()
    AND tm.role = 'leader'
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- private.is_blueprint_owner()
-- 檢查用戶是否為藍圖擁有者 (直接擁有或透過組織 owner)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.is_blueprint_owner(p_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- 情況1: 個人藍圖 (owner 是 user account)
  IF EXISTS (
    SELECT 1 FROM public.blueprints b
    JOIN public.accounts a ON a.id = b.owner_id
    WHERE b.id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
    AND a.type = 'user'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 情況2: 組織藍圖，且用戶是組織 owner
  RETURN EXISTS (
    SELECT 1 FROM public.blueprints b
    JOIN public.organizations o ON o.account_id = b.owner_id
    JOIN public.organization_members om ON om.organization_id = o.id
    JOIN public.accounts a ON a.id = om.account_id
    WHERE b.id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
    AND om.role = 'owner'
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- private.has_blueprint_access()
-- 檢查用戶是否有藍圖存取權限 (任何等級)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.has_blueprint_access(p_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- 公開藍圖
  IF EXISTS (
    SELECT 1 FROM public.blueprints
    WHERE id = p_blueprint_id AND is_public = true
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 藍圖擁有者
  IF (SELECT private.is_blueprint_owner(p_blueprint_id)) THEN
    RETURN TRUE;
  END IF;
  
  -- 藍圖成員
  IF EXISTS (
    SELECT 1 FROM public.blueprint_members bm
    JOIN public.accounts a ON a.id = bm.account_id
    WHERE bm.blueprint_id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 透過團隊授權
  IF EXISTS (
    SELECT 1 FROM public.blueprint_team_roles btr
    JOIN public.team_members tm ON tm.team_id = btr.team_id
    JOIN public.accounts a ON a.id = tm.account_id
    WHERE btr.blueprint_id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 組織成員 (對組織藍圖有基本存取權)
  RETURN EXISTS (
    SELECT 1 FROM public.blueprints b
    JOIN public.organizations o ON o.account_id = b.owner_id
    JOIN public.organization_members om ON om.organization_id = o.id
    JOIN public.accounts a ON a.id = om.account_id
    WHERE b.id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- private.can_write_blueprint()
-- 檢查用戶是否有藍圖寫入權限
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.can_write_blueprint(p_blueprint_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- 藍圖擁有者
  IF (SELECT private.is_blueprint_owner(p_blueprint_id)) THEN
    RETURN TRUE;
  END IF;
  
  -- 藍圖成員 (contributor 或 maintainer)
  IF EXISTS (
    SELECT 1 FROM public.blueprint_members bm
    JOIN public.accounts a ON a.id = bm.account_id
    WHERE bm.blueprint_id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
    AND bm.role IN ('contributor', 'maintainer')
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 透過團隊授權 (write 或 admin)
  IF EXISTS (
    SELECT 1 FROM public.blueprint_team_roles btr
    JOIN public.team_members tm ON tm.team_id = btr.team_id
    JOIN public.accounts a ON a.id = tm.account_id
    WHERE btr.blueprint_id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
    AND btr.access_level IN ('write', 'admin')
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 組織 owner/admin (對組織藍圖有寫入權)
  RETURN EXISTS (
    SELECT 1 FROM public.blueprints b
    JOIN public.organizations o ON o.account_id = b.owner_id
    JOIN public.organization_members om ON om.organization_id = o.id
    JOIN public.accounts a ON a.id = om.account_id
    WHERE b.id = p_blueprint_id
    AND a.auth_user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- private.get_blueprint_business_role()
-- 取得用戶在藍圖中的業務角色
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.get_blueprint_business_role(p_blueprint_id UUID)
RETURNS public.blueprint_business_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_business_role public.blueprint_business_role;
  v_is_owner BOOLEAN;
BEGIN
  -- Check if user is owner (owners are always project_manager)
  v_is_owner := (SELECT private.is_blueprint_owner(p_blueprint_id));
  IF v_is_owner THEN
    RETURN 'project_manager'::public.blueprint_business_role;
  END IF;

  -- Get business_role from blueprint_members
  SELECT bm.business_role INTO v_business_role
  FROM public.blueprint_members bm
  JOIN public.accounts a ON a.id = bm.account_id
  WHERE bm.blueprint_id = p_blueprint_id
  AND a.auth_user_id = auth.uid();
  
  RETURN COALESCE(v_business_role, 'observer'::public.blueprint_business_role);
END;
$$;

-- Grant: RLS 輔助函數執行權限
GRANT EXECUTE ON FUNCTION private.get_user_account_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_account_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_organization_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.get_organization_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_organization_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_team_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_team_leader(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_blueprint_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_blueprint_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_write_blueprint(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.get_blueprint_business_role(UUID) TO authenticated;


-- ############################################################################
-- PART 7: UTILITY TRIGGERS (通用觸發器)
-- ############################################################################

-- ----------------------------------------------------------------------------
-- update_updated_at()
-- 自動更新 updated_at 欄位
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 為所有需要的資料表建立 updated_at 觸發器
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_blueprints_updated_at BEFORE UPDATE ON blueprints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_blueprint_members_updated_at BEFORE UPDATE ON blueprint_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_blueprint_team_roles_updated_at BEFORE UPDATE ON blueprint_team_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_blueprint_roles_updated_at BEFORE UPDATE ON blueprint_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_diaries_updated_at BEFORE UPDATE ON diaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_task_acceptances_updated_at BEFORE UPDATE ON task_acceptances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_issue_comments_updated_at BEFORE UPDATE ON issue_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ############################################################################
-- PART 8: ROW LEVEL SECURITY (資料列安全政策)
-- ############################################################################

-- 啟用 RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprint_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies: accounts
-- ============================================================================
-- 用戶只能讀取自己的帳號
CREATE POLICY "accounts_select_own" ON accounts FOR SELECT TO authenticated USING (auth_user_id = (SELECT auth.uid()));
-- 用戶只能新增自己的帳號 (type='user')
CREATE POLICY "accounts_insert_own" ON accounts FOR INSERT TO authenticated WITH CHECK (auth_user_id = (SELECT auth.uid()) AND type = 'user');
-- 用戶只能更新自己的帳號
CREATE POLICY "accounts_update_own" ON accounts FOR UPDATE TO authenticated USING (auth_user_id = (SELECT auth.uid())) WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- 組織帳號 (type='org') 的存取策略：
-- 長期方案：建議透過 SECURITY DEFINER 函數處理組織帳號的讀取
-- 目前方案：組織成員可以讀取其所屬組織的帳號
-- CREATE POLICY "accounts_select_related" ON accounts FOR SELECT TO authenticated USING (type IN ('org', 'bot') AND id IN (SELECT DISTINCT a.id FROM accounts a LEFT JOIN organizations o ON o.account_id = a.id LEFT JOIN organization_members om ON om.organization_id = o.id LEFT JOIN accounts member_account ON member_account.id = om.account_id WHERE member_account.auth_user_id = (SELECT auth.uid())));

-- ============================================================================
-- RLS Policies: organizations
-- ============================================================================
-- 組織成員可以讀取組織
CREATE POLICY "organizations_select_member" ON organizations FOR SELECT TO authenticated USING ((SELECT private.is_organization_member(id)));
-- 任何認證用戶都可以建立組織 (透過 SECURITY DEFINER 函數)
CREATE POLICY "organizations_insert" ON organizations FOR INSERT TO authenticated WITH CHECK (true);
-- 組織 admin 可以更新組織
CREATE POLICY "organizations_update_admin" ON organizations FOR UPDATE TO authenticated USING ((SELECT private.is_organization_admin(id))) WITH CHECK ((SELECT private.is_organization_admin(id)));
-- 只有組織 owner 可以刪除組織
CREATE POLICY "organizations_delete_owner" ON organizations FOR DELETE TO authenticated USING ((SELECT private.get_organization_role(id)) = 'owner');

-- ============================================================================
-- RLS Policies: organization_members
-- ============================================================================
-- 組織成員可以讀取成員列表
CREATE POLICY "organization_members_select" ON organization_members FOR SELECT TO authenticated USING ((SELECT private.is_organization_member(organization_id)));
-- 組織 admin 可以新增成員 (需透過 SECURITY DEFINER 處理初始 owner)
CREATE POLICY "organization_members_insert" ON organization_members FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_organization_admin(organization_id)));
-- 組織 admin 可以更新成員角色 (owner 角色變更需要是 owner)
CREATE POLICY "organization_members_update" ON organization_members FOR UPDATE TO authenticated USING ((SELECT private.is_organization_admin(organization_id))) WITH CHECK ((SELECT private.is_organization_admin(organization_id)) AND (role != 'owner' OR (SELECT private.get_organization_role(organization_id)) = 'owner'));
-- 組織 admin 可以刪除成員 (不可刪除 owner)
CREATE POLICY "organization_members_delete" ON organization_members FOR DELETE TO authenticated USING ((SELECT private.is_organization_admin(organization_id)) AND role != 'owner');

-- ============================================================================
-- RLS Policies: teams
-- ============================================================================
-- 組織成員可以讀取團隊
CREATE POLICY "teams_select" ON teams FOR SELECT TO authenticated USING ((SELECT private.is_organization_member(organization_id)));
-- 團隊透過 SECURITY DEFINER 函數建立
-- CREATE POLICY "teams_insert" ON teams FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_organization_admin(organization_id)));
-- 組織 admin 或 team leader 可以更新團隊
CREATE POLICY "teams_update" ON teams FOR UPDATE TO authenticated USING ((SELECT private.is_organization_admin(organization_id)) OR (SELECT private.is_team_leader(id))) WITH CHECK ((SELECT private.is_organization_admin(organization_id)) OR (SELECT private.is_team_leader(id)));
-- 組織 admin 可以刪除團隊
CREATE POLICY "teams_delete" ON teams FOR DELETE TO authenticated USING ((SELECT private.is_organization_admin(organization_id)));

-- ============================================================================
-- RLS Policies: team_members
-- ============================================================================
-- 組織成員可以讀取團隊成員
CREATE POLICY "team_members_select" ON team_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND (SELECT private.is_organization_member(t.organization_id))));
-- 組織 admin 或 team leader 可以新增/更新/刪除團隊成員
CREATE POLICY "team_members_insert" ON team_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND ((SELECT private.is_organization_admin(t.organization_id)) OR (SELECT private.is_team_leader(team_members.team_id)))));
CREATE POLICY "team_members_update" ON team_members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND ((SELECT private.is_organization_admin(t.organization_id)) OR (SELECT private.is_team_leader(team_members.team_id)))));
CREATE POLICY "team_members_delete" ON team_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND ((SELECT private.is_organization_admin(t.organization_id)) OR (SELECT private.is_team_leader(team_members.team_id)))));

-- ============================================================================
-- RLS Policies: blueprints
-- ============================================================================
-- 有藍圖存取權的用戶可以讀取
CREATE POLICY "blueprints_select" ON blueprints FOR SELECT TO authenticated USING ((SELECT private.has_blueprint_access(id)));
-- 匿名用戶可以讀取公開藍圖
CREATE POLICY "blueprints_select_public" ON blueprints FOR SELECT TO anon USING (is_public = true AND status = 'active');
-- 藍圖透過 SECURITY DEFINER 函數建立
-- CREATE POLICY "blueprints_insert" ON blueprints FOR INSERT TO authenticated WITH CHECK (...);
-- 藍圖擁有者可以更新/刪除
CREATE POLICY "blueprints_update" ON blueprints FOR UPDATE TO authenticated USING ((SELECT private.is_blueprint_owner(id))) WITH CHECK ((SELECT private.is_blueprint_owner(id)));
CREATE POLICY "blueprints_delete" ON blueprints FOR DELETE TO authenticated USING ((SELECT private.is_blueprint_owner(id)));

-- ============================================================================
-- RLS Policies: blueprint_members
-- ============================================================================
-- 有藍圖存取權的用戶可以讀取成員
CREATE POLICY "blueprint_members_select" ON blueprint_members FOR SELECT TO authenticated USING ((SELECT private.has_blueprint_access(blueprint_id)));
-- 藍圖擁有者或 maintainer 可以新增/更新/刪除成員
CREATE POLICY "blueprint_members_insert" ON blueprint_members FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_blueprint_owner(blueprint_id)) OR EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id WHERE bm.blueprint_id = blueprint_members.blueprint_id AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer'));
CREATE POLICY "blueprint_members_update" ON blueprint_members FOR UPDATE TO authenticated USING ((SELECT private.is_blueprint_owner(blueprint_id)) OR EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id WHERE bm.blueprint_id = blueprint_members.blueprint_id AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer'));
CREATE POLICY "blueprint_members_delete" ON blueprint_members FOR DELETE TO authenticated USING ((SELECT private.is_blueprint_owner(blueprint_id)) OR EXISTS (SELECT 1 FROM blueprint_members bm JOIN accounts a ON a.id = bm.account_id WHERE bm.blueprint_id = blueprint_members.blueprint_id AND a.auth_user_id = (SELECT auth.uid()) AND bm.role = 'maintainer'));

-- ============================================================================
-- RLS Policies: blueprint_team_roles
-- ============================================================================
-- 有藍圖存取權的用戶可以讀取團隊授權
CREATE POLICY "blueprint_team_roles_select" ON blueprint_team_roles FOR SELECT TO authenticated USING ((SELECT private.has_blueprint_access(blueprint_id)));
-- 藍圖擁有者可以新增/更新/刪除團隊授權
CREATE POLICY "blueprint_team_roles_insert" ON blueprint_team_roles FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_blueprint_owner(blueprint_id)));
CREATE POLICY "blueprint_team_roles_update" ON blueprint_team_roles FOR UPDATE TO authenticated USING ((SELECT private.is_blueprint_owner(blueprint_id)));
CREATE POLICY "blueprint_team_roles_delete" ON blueprint_team_roles FOR DELETE TO authenticated USING ((SELECT private.is_blueprint_owner(blueprint_id)));

-- ============================================================================
-- RLS Policies: blueprint_roles
-- ============================================================================
-- 有藍圖存取權的用戶可以讀取角色定義
CREATE POLICY "blueprint_roles_select" ON blueprint_roles FOR SELECT TO authenticated USING ((SELECT private.has_blueprint_access(blueprint_id)));
-- 藍圖擁有者或 maintainer 可以管理角色定義
CREATE POLICY "blueprint_roles_insert" ON blueprint_roles FOR INSERT TO authenticated WITH CHECK (
  (SELECT private.is_blueprint_owner(blueprint_id)) OR 
  EXISTS (
    SELECT 1 FROM blueprint_members bm
    JOIN accounts a ON a.id = bm.account_id
    WHERE bm.blueprint_id = blueprint_roles.blueprint_id
    AND a.auth_user_id = (SELECT auth.uid())
    AND bm.role = 'maintainer'
  )
);
CREATE POLICY "blueprint_roles_update" ON blueprint_roles FOR UPDATE TO authenticated USING (
  (SELECT private.is_blueprint_owner(blueprint_id)) OR 
  EXISTS (
    SELECT 1 FROM blueprint_members bm
    JOIN accounts a ON a.id = bm.account_id
    WHERE bm.blueprint_id = blueprint_roles.blueprint_id
    AND a.auth_user_id = (SELECT auth.uid())
    AND bm.role = 'maintainer'
  )
);
CREATE POLICY "blueprint_roles_delete" ON blueprint_roles FOR DELETE TO authenticated USING (
  (SELECT private.is_blueprint_owner(blueprint_id)) OR 
  EXISTS (
    SELECT 1 FROM blueprint_members bm
    JOIN accounts a ON a.id = bm.account_id
    WHERE bm.blueprint_id = blueprint_roles.blueprint_id
    AND a.auth_user_id = (SELECT auth.uid())
    AND bm.role = 'maintainer'
  )
);

-- ============================================================================
-- RLS Policies: tasks
-- ============================================================================
CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING ((SELECT private.has_blueprint_access(blueprint_id)));
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING ((SELECT private.can_write_blueprint(blueprint_id)));
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- RLS Policies: task_attachments
-- ============================================================================
CREATE POLICY "task_attachments_select" ON task_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_attachments.task_id AND (SELECT private.has_blueprint_access(t.blueprint_id))));
CREATE POLICY "task_attachments_insert" ON task_attachments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_attachments.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));
CREATE POLICY "task_attachments_delete" ON task_attachments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_attachments.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));

-- ============================================================================
-- RLS Policies: diaries
-- ============================================================================
CREATE POLICY "diaries_select" ON diaries FOR SELECT TO authenticated USING ((SELECT private.has_blueprint_access(blueprint_id)));
CREATE POLICY "diaries_insert" ON diaries FOR INSERT TO authenticated WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));
CREATE POLICY "diaries_update" ON diaries FOR UPDATE TO authenticated USING ((SELECT private.can_write_blueprint(blueprint_id)));
CREATE POLICY "diaries_delete" ON diaries FOR DELETE TO authenticated USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- RLS Policies: diary_attachments
-- ============================================================================
CREATE POLICY "diary_attachments_select" ON diary_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_attachments.diary_id AND (SELECT private.has_blueprint_access(d.blueprint_id))));
CREATE POLICY "diary_attachments_insert" ON diary_attachments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_attachments.diary_id AND (SELECT private.can_write_blueprint(d.blueprint_id))));
CREATE POLICY "diary_attachments_delete" ON diary_attachments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM diaries d WHERE d.id = diary_attachments.diary_id AND (SELECT private.can_write_blueprint(d.blueprint_id))));

-- ============================================================================
-- RLS Policies: checklists
-- ============================================================================
CREATE POLICY "checklists_select" ON checklists FOR SELECT TO authenticated USING ((SELECT private.has_blueprint_access(blueprint_id)));
CREATE POLICY "checklists_insert" ON checklists FOR INSERT TO authenticated WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));
CREATE POLICY "checklists_update" ON checklists FOR UPDATE TO authenticated USING ((SELECT private.can_write_blueprint(blueprint_id)));
CREATE POLICY "checklists_delete" ON checklists FOR DELETE TO authenticated USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- RLS Policies: checklist_items
-- ============================================================================
CREATE POLICY "checklist_items_select" ON checklist_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND (SELECT private.has_blueprint_access(c.blueprint_id))));
CREATE POLICY "checklist_items_insert" ON checklist_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND (SELECT private.can_write_blueprint(c.blueprint_id))));
CREATE POLICY "checklist_items_update" ON checklist_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND (SELECT private.can_write_blueprint(c.blueprint_id))));
CREATE POLICY "checklist_items_delete" ON checklist_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM checklists c WHERE c.id = checklist_items.checklist_id AND (SELECT private.can_write_blueprint(c.blueprint_id))));

-- ============================================================================
-- RLS Policies: task_acceptances
-- ============================================================================
CREATE POLICY "task_acceptances_select" ON task_acceptances FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_acceptances.task_id AND (SELECT private.has_blueprint_access(t.blueprint_id))));
CREATE POLICY "task_acceptances_insert" ON task_acceptances FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_acceptances.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));
CREATE POLICY "task_acceptances_update" ON task_acceptances FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_acceptances.task_id AND (SELECT private.can_write_blueprint(t.blueprint_id))));

-- ============================================================================
-- RLS Policies: todos
-- ============================================================================
-- 用戶只能存取自己在藍圖中的待辦事項
CREATE POLICY "todos_select" ON todos FOR SELECT TO authenticated USING ((SELECT private.has_blueprint_access(blueprint_id)) AND account_id = (SELECT private.get_user_account_id()));
CREATE POLICY "todos_insert" ON todos FOR INSERT TO authenticated WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)) AND account_id = (SELECT private.get_user_account_id()));
CREATE POLICY "todos_update" ON todos FOR UPDATE TO authenticated USING (account_id = (SELECT private.get_user_account_id()));
CREATE POLICY "todos_delete" ON todos FOR DELETE TO authenticated USING (account_id = (SELECT private.get_user_account_id()));

-- ============================================================================
-- RLS Policies: issues
-- ============================================================================
CREATE POLICY "issues_select" ON issues FOR SELECT TO authenticated USING ((SELECT private.has_blueprint_access(blueprint_id)));
CREATE POLICY "issues_insert" ON issues FOR INSERT TO authenticated WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));
CREATE POLICY "issues_update" ON issues FOR UPDATE TO authenticated USING ((SELECT private.can_write_blueprint(blueprint_id)));
CREATE POLICY "issues_delete" ON issues FOR DELETE TO authenticated USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- RLS Policies: issue_comments
-- ============================================================================
-- 有藍圖存取權的用戶可以讀取評論，只能編輯自己的評論
CREATE POLICY "issue_comments_select" ON issue_comments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM issues i WHERE i.id = issue_comments.issue_id AND (SELECT private.has_blueprint_access(i.blueprint_id))));
CREATE POLICY "issue_comments_insert" ON issue_comments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM issues i WHERE i.id = issue_comments.issue_id AND (SELECT private.has_blueprint_access(i.blueprint_id))) AND account_id = (SELECT private.get_user_account_id()));
CREATE POLICY "issue_comments_update" ON issue_comments FOR UPDATE TO authenticated USING (account_id = (SELECT private.get_user_account_id()));
CREATE POLICY "issue_comments_delete" ON issue_comments FOR DELETE TO authenticated USING (account_id = (SELECT private.get_user_account_id()));

-- ============================================================================
-- RLS Policies: notifications
-- ============================================================================
-- 用戶只能存取自己的通知
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (account_id = (SELECT private.get_user_account_id()));
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (account_id = (SELECT private.get_user_account_id()));
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated USING (account_id = (SELECT private.get_user_account_id()));


-- ############################################################################
-- PART 9: AUTH INTEGRATION (認證整合)
-- ############################################################################
-- 當 Supabase Auth 建立新用戶時，自動建立對應的 account

-- ----------------------------------------------------------------------------
-- handle_new_user()
-- 當 auth.users 新增記錄時，自動建立 accounts 記錄
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.accounts (auth_user_id, type, name, email, status)
  VALUES (
    NEW.id,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'active'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ############################################################################
-- PART 10: ORGANIZATION API (組織功能)
-- ############################################################################
-- 建立組織的 SECURITY DEFINER 函數，確保原子操作並繞過 RLS

-- ----------------------------------------------------------------------------
-- create_organization()
-- 建立組織帳號 + 組織記錄，並自動將建立者加入為 owner
-- 
-- 流程：
-- 1. 驗證用戶已登入
-- 2. 取得用戶 account_id
-- 3. 產生 slug (如未提供)
-- 4. 建立 org 類型的 account
-- 5. 建立 organization 記錄
-- 6. 將建立者加入 organization_members (role=owner)
-- 7. 回傳建立的 ID
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_organization(
  p_name VARCHAR(255),
  p_email VARCHAR(255) DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_slug VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  out_account_id UUID,
  out_organization_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_account_id UUID;
  v_org_account_id UUID;
  v_organization_id UUID;
  v_slug VARCHAR(100);
  v_auth_user_id UUID;
BEGIN
  -- 1. 驗證用戶已登入
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 2. 取得用戶 account_id
  SELECT id INTO v_user_account_id
  FROM public.accounts
  WHERE auth_user_id = v_auth_user_id
    AND type = 'user'
    AND status != 'deleted'
  LIMIT 1;

  IF v_user_account_id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;

  -- 3. 產生 slug
  IF p_slug IS NULL OR p_slug = '' THEN
    v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) LOOP
      v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
    END LOOP;
  ELSE
    v_slug := p_slug;
  END IF;

  -- 4. 建立 org account
  INSERT INTO public.accounts (
    auth_user_id,
    type,
    name,
    email,
    avatar_url,
    status
  )
  VALUES (
    NULL,  -- 組織帳號不需要 auth_user_id
    'org',
    p_name,
    p_email,
    p_avatar_url,
    'active'
  )
  RETURNING id INTO v_org_account_id;

  -- 5. 建立 organization 記錄
  INSERT INTO public.organizations (
    account_id,
    name,
    slug,
    description,
    logo_url,
    created_by
  )
  VALUES (
    v_org_account_id,
    p_name,
    v_slug,
    NULL,
    p_avatar_url,
    v_user_account_id
  )
  RETURNING id INTO v_organization_id;

  -- 6. 將建立者加入 organization_members (role=owner)
  INSERT INTO public.organization_members (organization_id, account_id, role)
  VALUES (v_organization_id, v_user_account_id, 'owner')
  ON CONFLICT (organization_id, account_id) DO NOTHING;

  -- 7. 回傳建立的 ID
  RETURN QUERY SELECT v_org_account_id, v_organization_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_organization(VARCHAR, VARCHAR, TEXT, VARCHAR) TO authenticated;

-- ----------------------------------------------------------------------------
-- handle_new_organization() - 觸發器
-- 當 organization 建立時，確保建立者被加入為 owner
-- (作為 create_organization 的備援機制)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    -- 嘗試將 created_by 解析為 accounts.id
    SELECT id INTO v_account_id FROM public.accounts WHERE id = NEW.created_by LIMIT 1;

    -- 如果找不到，嘗試解析為 auth_user_id
    IF v_account_id IS NULL THEN
      SELECT id INTO v_account_id FROM public.accounts WHERE auth_user_id = NEW.created_by LIMIT 1;
    END IF;

    -- 將建立者加入 organization_members
    IF v_account_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organization_id, account_id, role)
      VALUES (NEW.id, v_account_id, 'owner')
      ON CONFLICT (organization_id, account_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- ############################################################################
-- PART 11: TEAM API (團隊功能)
-- ############################################################################

-- ----------------------------------------------------------------------------
-- create_team()
-- 在組織中建立團隊，需要 owner/admin 權限
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_team(
  p_organization_id UUID,
  p_name VARCHAR(255),
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  out_team_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_account_id UUID;
  v_team_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- 1. 驗證用戶已登入
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 2. 取得用戶 account_id
  SELECT id INTO v_user_account_id
  FROM public.accounts
  WHERE auth_user_id = v_auth_user_id
    AND type = 'user'
    AND status != 'deleted'
  LIMIT 1;

  IF v_user_account_id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;

  -- 3. 驗證用戶是組織 owner/admin
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.accounts a ON a.id = om.account_id
    WHERE om.organization_id = p_organization_id
    AND a.auth_user_id = v_auth_user_id
    AND om.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'User is not an admin or owner of the organization';
  END IF;

  -- 4. 檢查團隊名稱是否已存在
  IF EXISTS (
    SELECT 1 FROM public.teams
    WHERE organization_id = p_organization_id
    AND name = p_name
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Team name already exists in this organization';
  END IF;

  -- 5. 建立團隊
  INSERT INTO public.teams (
    organization_id,
    name,
    description,
    metadata
  )
  VALUES (
    p_organization_id,
    p_name,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_team_id;

  -- 6. 回傳團隊 ID
  RETURN QUERY SELECT v_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_team(UUID, VARCHAR, TEXT, JSONB) TO authenticated;

-- ############################################################################
-- PART 12: BLUEPRINT API (藍圖功能)
-- ############################################################################

-- ----------------------------------------------------------------------------
-- create_blueprint()
-- 建立藍圖，並自動將建立者加入為 maintainer
-- 
-- 支援兩種擁有者類型：
-- - 個人藍圖：owner_id = 用戶的 account_id
-- - 組織藍圖：owner_id = 組織的 account_id (需要 owner/admin 權限)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_blueprint(
  p_owner_id UUID,
  p_name VARCHAR(255),
  p_slug VARCHAR(100) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_cover_url TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT false,
  p_enabled_modules public.module_type[] DEFAULT ARRAY['tasks']::public.module_type[]
)
RETURNS TABLE (
  out_blueprint_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_account_id UUID;
  v_blueprint_id UUID;
  v_slug VARCHAR(100);
  v_auth_user_id UUID;
  v_owner_type public.account_type;
BEGIN
  -- 1. 驗證用戶已登入
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 2. 取得用戶 account_id
  SELECT id INTO v_user_account_id
  FROM public.accounts
  WHERE auth_user_id = v_auth_user_id
    AND type = 'user'
    AND status != 'deleted'
  LIMIT 1;

  IF v_user_account_id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;

  -- 3. 取得 owner 類型並驗證權限
  SELECT type INTO v_owner_type
  FROM public.accounts
  WHERE id = p_owner_id
    AND status != 'deleted';

  IF v_owner_type IS NULL THEN
    RAISE EXCEPTION 'Owner account not found';
  END IF;

  -- 4. 驗證用戶對 owner 的權限
  IF v_owner_type = 'user' THEN
    -- 個人藍圖：owner 必須是當前用戶
    IF p_owner_id != v_user_account_id THEN
      RAISE EXCEPTION 'User can only create blueprints for their own account';
    END IF;
  ELSIF v_owner_type = 'org' THEN
    -- 組織藍圖：用戶必須是組織 owner/admin
    IF NOT EXISTS (
      SELECT 1 FROM public.organizations o
      JOIN public.organization_members om ON om.organization_id = o.id
      JOIN public.accounts a ON a.id = om.account_id
      WHERE o.account_id = p_owner_id
      AND a.auth_user_id = v_auth_user_id
      AND om.role IN ('owner', 'admin')
    ) THEN
      RAISE EXCEPTION 'User is not an admin or owner of the organization';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid owner account type';
  END IF;

  -- 5. 產生 slug
  IF p_slug IS NULL OR p_slug = '' THEN
    v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    WHILE EXISTS (
      SELECT 1 FROM public.blueprints
      WHERE owner_id = p_owner_id
      AND slug = v_slug
      AND deleted_at IS NULL
    ) LOOP
      v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
    END LOOP;
  ELSE
    v_slug := p_slug;
    IF EXISTS (
      SELECT 1 FROM public.blueprints
      WHERE owner_id = p_owner_id
      AND slug = v_slug
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Blueprint slug already exists for this owner';
    END IF;
  END IF;

  -- 6. 建立藍圖
  INSERT INTO public.blueprints (
    owner_id,
    name,
    slug,
    description,
    cover_url,
    is_public,
    status,
    enabled_modules,
    created_by
  )
  VALUES (
    p_owner_id,
    p_name,
    v_slug,
    p_description,
    p_cover_url,
    p_is_public,
    'active',
    p_enabled_modules,
    v_user_account_id
  )
  RETURNING id INTO v_blueprint_id;

  -- 7. 將建立者加入 blueprint_members (role=maintainer)
  INSERT INTO public.blueprint_members (blueprint_id, account_id, role, is_external)
  VALUES (v_blueprint_id, v_user_account_id, 'maintainer', false)
  ON CONFLICT (blueprint_id, account_id) DO NOTHING;

  -- 8. 回傳藍圖 ID
  RETURN QUERY SELECT v_blueprint_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_blueprint(UUID, VARCHAR, VARCHAR, TEXT, TEXT, BOOLEAN, public.module_type[]) TO authenticated;

-- ----------------------------------------------------------------------------
-- handle_new_blueprint() - 觸發器
-- 當藍圖建立時，確保建立者被加入為 maintainer
-- (作為 create_blueprint 的備援機制)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_blueprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_type public.account_type;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    -- 取得 owner 類型
    SELECT type INTO v_owner_type
    FROM public.accounts
    WHERE id = NEW.owner_id;
    
    -- 將建立者加入 blueprint_members (role=maintainer)
    INSERT INTO public.blueprint_members (blueprint_id, account_id, role, is_external)
    VALUES (NEW.id, NEW.created_by, 'maintainer', false)
    ON CONFLICT (blueprint_id, account_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_blueprint_created
  AFTER INSERT ON blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_blueprint();

-- ############################################################################
-- PART 13: DOCUMENTATION (文件註解)
-- ############################################################################

-- 資料表註解
COMMENT ON TABLE accounts IS '帳號 - 認證與身分識別 (user/org/bot)';
COMMENT ON TABLE organizations IS '組織 - 組織層級管理';
COMMENT ON TABLE organization_members IS '組織成員 - 用戶與組織的多對多關聯';
COMMENT ON TABLE teams IS '團隊 - 組織內群組，用於授權和權限分發 (不是資產所有者)';
COMMENT ON TABLE team_members IS '團隊成員 - 用戶與團隊的多對多關聯';
COMMENT ON TABLE blueprints IS '藍圖/工作區 - 資產容器，Owner = User or Organization';
COMMENT ON TABLE blueprint_members IS '藍圖成員 - Blueprint-level access control (Members + Collaborators)';
COMMENT ON TABLE blueprint_team_roles IS '藍圖團隊授權 - Team permission injection (not ownership)';
COMMENT ON TABLE tasks IS '任務 - 施工工作項目';
COMMENT ON TABLE task_attachments IS '任務附件';
COMMENT ON TABLE diaries IS '施工日誌 - 每日施工記錄';
COMMENT ON TABLE diary_attachments IS '日誌附件/施工照片';
COMMENT ON TABLE checklists IS '檢查清單 - 驗收檢查項目列表';
COMMENT ON TABLE checklist_items IS '檢查項目 - 單一驗收項目';
COMMENT ON TABLE task_acceptances IS '品質驗收記錄';
COMMENT ON TABLE todos IS '待辦事項 - 個人待辦清單';
COMMENT ON TABLE issues IS '問題追蹤';
COMMENT ON TABLE issue_comments IS '問題評論';
COMMENT ON TABLE notifications IS '通知';

-- 私有函數註解
COMMENT ON FUNCTION private.get_user_account_id() IS '取得當前用戶 account_id (SECURITY DEFINER)';
COMMENT ON FUNCTION private.is_account_owner(UUID) IS '檢查用戶是否擁有該帳號';
COMMENT ON FUNCTION private.is_organization_member(UUID) IS '檢查用戶是否為組織成員';
COMMENT ON FUNCTION private.get_organization_role(UUID) IS '取得用戶在組織中的角色';
COMMENT ON FUNCTION private.is_organization_admin(UUID) IS '檢查用戶是否為組織 owner/admin';
COMMENT ON FUNCTION private.is_team_member(UUID) IS '檢查用戶是否為團隊成員';
COMMENT ON FUNCTION private.is_team_leader(UUID) IS '檢查用戶是否為團隊 leader';
COMMENT ON FUNCTION private.is_blueprint_owner(UUID) IS '檢查用戶是否為藍圖擁有者 (直接或透過組織)';
COMMENT ON FUNCTION private.has_blueprint_access(UUID) IS '檢查用戶是否有藍圖存取權';
COMMENT ON FUNCTION private.can_write_blueprint(UUID) IS '檢查用戶是否有藍圖寫入權';
COMMENT ON FUNCTION private.get_blueprint_business_role(UUID) IS '取得用戶在藍圖中的業務角色';

-- 公開函數註解
COMMENT ON FUNCTION public.update_updated_at() IS '觸發器函數 - 自動更新 updated_at';
COMMENT ON FUNCTION public.handle_new_user() IS 'Auth 觸發器 - 自動建立用戶帳號';
COMMENT ON FUNCTION public.create_organization(VARCHAR, VARCHAR, TEXT, VARCHAR) IS '建立組織 (SECURITY DEFINER) - 自動加入建立者為 owner';
COMMENT ON FUNCTION public.handle_new_organization() IS '組織觸發器 - 確保建立者被加入為 owner';
COMMENT ON FUNCTION public.create_team(UUID, VARCHAR, TEXT, JSONB) IS '建立團隊 (SECURITY DEFINER) - 需要組織 owner/admin 權限';
COMMENT ON FUNCTION public.create_blueprint(UUID, VARCHAR, VARCHAR, TEXT, TEXT, BOOLEAN, public.module_type[]) IS '建立藍圖 (SECURITY DEFINER) - 自動加入建立者為 maintainer';
COMMENT ON FUNCTION public.handle_new_blueprint() IS '藍圖觸發器 - 確保建立者被加入為 maintainer';

-- RBAC 相關資料表與函數註解
COMMENT ON TABLE blueprint_roles IS '藍圖角色定義 - Custom role definitions per blueprint for RBAC';
COMMENT ON COLUMN blueprint_roles.name IS '角色名稱（唯一鍵）- Role name (unique per blueprint)';
COMMENT ON COLUMN blueprint_roles.display_name IS '顯示名稱 - Display name for UI';
COMMENT ON COLUMN blueprint_roles.business_role IS '業務角色 - Maps to permission set';
COMMENT ON COLUMN blueprint_roles.permissions IS '自訂權限 JSON - Custom permissions override';
COMMENT ON COLUMN blueprint_roles.is_default IS '是否為預設角色 - Cannot be deleted';
COMMENT ON COLUMN blueprint_members.business_role IS '業務角色 - Business role for permission checking';
COMMENT ON COLUMN blueprint_members.custom_role_id IS '自訂角色 ID - Reference to custom role definition';
-- NOTE: COMMENT for create_default_blueprint_roles moved to after function definition in PART 14

-- ############################################################################
-- PART 14: RBAC DEFAULT ROLES API (RBAC 預設角色 API)
-- ############################################################################

-- ----------------------------------------------------------------------------
-- create_default_blueprint_roles()
-- 建立藍圖預設角色 (包含8種角色)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_default_blueprint_roles(p_blueprint_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Project Manager (專案經理)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'project_manager', 
    '專案經理', 
    '最高藍圖級權限，可管理所有設定和成員',
    'project_manager',
    true,
    1
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Site Director (工地主任)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'site_director', 
    '工地主任', 
    '現場管理權限，可管理任務和日誌',
    'site_director',
    true,
    2
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Site Supervisor (現場監督)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'site_supervisor', 
    '現場監督', 
    '現場監督權限，可監督任務執行和審核日誌',
    'site_supervisor',
    true,
    3
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Worker (施工人員)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'worker', 
    '施工人員', 
    '任務執行權限，可創建和更新任務',
    'worker',
    true,
    4
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- QA Staff (品管人員)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'qa_staff', 
    '品管人員', 
    '品質驗收權限，可執行品質檢查和驗收',
    'qa_staff',
    true,
    5
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Safety & Health (公共安全衛生)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'safety_health', 
    '公共安全衛生', 
    '安全衛生管理權限，可管理安全相關事項和檢查',
    'safety_health',
    true,
    6
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Finance (財務)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'finance', 
    '財務', 
    '財務管理權限，可查看和管理財務相關資料',
    'finance',
    true,
    7
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;

  -- Observer (觀察者)
  INSERT INTO public.blueprint_roles (blueprint_id, name, display_name, description, business_role, is_default, sort_order)
  VALUES (
    p_blueprint_id, 
    'observer', 
    '觀察者', 
    '僅檢視權限，只能查看內容',
    'observer',
    true,
    8
  ) ON CONFLICT (blueprint_id, name) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_default_blueprint_roles(UUID) TO authenticated;

-- ----------------------------------------------------------------------------
-- handle_new_blueprint_roles()
-- 藍圖建立時自動建立預設角色
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_blueprint_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.create_default_blueprint_roles(NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to auto-create default roles when a blueprint is created
CREATE TRIGGER on_blueprint_created_roles
  AFTER INSERT ON blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_blueprint_roles();

-- RBAC 函數註解 (moved from PART 13 to after function definition)
COMMENT ON FUNCTION public.create_default_blueprint_roles(UUID) IS '建立預設藍圖角色 - Create default roles for blueprint';
COMMENT ON FUNCTION public.handle_new_blueprint_roles() IS '藍圖觸發器 - 自動建立預設角色';

-- ############################################################################
-- PART 15: CONTAINER LAYER INFRASTRUCTURE (容器層核心基礎設施)
-- ############################################################################
-- 根據 architecture-rules.md 定義的 12 項核心基礎設施

-- ============================================================================
-- 15.1: BLUEPRINT CONFIGURATIONS (藍圖配置中心)
-- 藍圖級別配置管理
-- ============================================================================

-- 配置類型
CREATE TYPE blueprint_config_type AS ENUM (
  'general',           -- 一般設定
  'notification',      -- 通知設定
  'workflow',          -- 工作流程設定
  'display',           -- 顯示設定
  'integration',       -- 整合設定
  'permission'         -- 權限設定
);

-- 藍圖配置表
CREATE TABLE blueprint_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  config_type blueprint_config_type NOT NULL DEFAULT 'general',
  key VARCHAR(255) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT blueprint_configs_unique UNIQUE (blueprint_id, config_type, key)
);

CREATE INDEX idx_blueprint_configs_blueprint ON blueprint_configs(blueprint_id);
CREATE INDEX idx_blueprint_configs_type ON blueprint_configs(config_type);

-- 觸發器
CREATE TRIGGER update_blueprint_configs_updated_at 
  BEFORE UPDATE ON blueprint_configs 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE blueprint_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blueprint_configs_select" ON blueprint_configs 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "blueprint_configs_insert" ON blueprint_configs 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "blueprint_configs_update" ON blueprint_configs 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)))
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "blueprint_configs_delete" ON blueprint_configs 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)) AND is_system = false);

-- ============================================================================
-- 15.2: ACTIVITY TIMELINE (時間軸服務)
-- 跨模組活動追蹤
-- ============================================================================

-- 活動類型
CREATE TYPE activity_type AS ENUM (
  'create',            -- 建立
  'update',            -- 更新
  'delete',            -- 刪除
  'comment',           -- 評論
  'assign',            -- 指派
  'status_change',     -- 狀態變更
  'attachment',        -- 附件操作
  'approval',          -- 審核
  'mention',           -- 提及
  'share',             -- 分享
  'move',              -- 移動
  'archive',           -- 封存
  'restore'            -- 還原
);

-- 實體類型
CREATE TYPE entity_type AS ENUM (
  'blueprint',
  'task',
  'diary',
  'checklist',
  'checklist_item',
  'issue',
  'todo',
  'file',
  'acceptance',
  'comment'
);

-- 活動時間軸表
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  activity_type activity_type NOT NULL,
  actor_id UUID REFERENCES accounts(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_blueprint ON activities(blueprint_id);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_actor ON activities(actor_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_blueprint_created ON activities(blueprint_id, created_at DESC);

-- RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select" ON activities 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "activities_insert" ON activities 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

-- 記錄活動函數
CREATE OR REPLACE FUNCTION public.log_activity(
  p_blueprint_id UUID,
  p_entity_type entity_type,
  p_entity_id UUID,
  p_activity_type activity_type,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_activity_id UUID;
  v_actor_id UUID;
BEGIN
  v_actor_id := (SELECT private.get_user_account_id());
  
  INSERT INTO public.activities (
    blueprint_id,
    entity_type,
    entity_id,
    activity_type,
    actor_id,
    metadata,
    old_value,
    new_value
  )
  VALUES (
    p_blueprint_id,
    p_entity_type,
    p_entity_id,
    p_activity_type,
    v_actor_id,
    p_metadata,
    p_old_value,
    p_new_value
  )
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_activity(UUID, entity_type, UUID, activity_type, JSONB, JSONB, JSONB) TO authenticated;

-- ============================================================================
-- 15.3: EVENT BUS (事件總線)
-- 模組間解耦通訊
-- ============================================================================

-- 事件狀態
CREATE TYPE event_status AS ENUM (
  'pending',           -- 待處理
  'processing',        -- 處理中
  'completed',         -- 已完成
  'failed',            -- 失敗
  'cancelled'          -- 已取消
);

-- 事件表
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  source VARCHAR(100),
  status event_status NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_blueprint ON events(blueprint_id);
CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_scheduled ON events(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_events_created ON events(created_at DESC);

-- 事件訂閱表
CREATE TABLE event_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  handler_name VARCHAR(255) NOT NULL,
  filter_conditions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT event_subscriptions_unique UNIQUE (blueprint_id, event_name, handler_name)
);

CREATE INDEX idx_event_subscriptions_blueprint ON event_subscriptions(blueprint_id);
CREATE INDEX idx_event_subscriptions_event ON event_subscriptions(event_name);
CREATE INDEX idx_event_subscriptions_active ON event_subscriptions(is_active) WHERE is_active = true;

-- 觸發器
CREATE TRIGGER update_event_subscriptions_updated_at 
  BEFORE UPDATE ON event_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select" ON events 
  FOR SELECT TO authenticated 
  USING (blueprint_id IS NULL OR (SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "events_insert" ON events 
  FOR INSERT TO authenticated 
  WITH CHECK (blueprint_id IS NULL OR (SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "event_subscriptions_select" ON event_subscriptions 
  FOR SELECT TO authenticated 
  USING (blueprint_id IS NULL OR (SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "event_subscriptions_insert" ON event_subscriptions 
  FOR INSERT TO authenticated 
  WITH CHECK (blueprint_id IS NULL OR (SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "event_subscriptions_update" ON event_subscriptions 
  FOR UPDATE TO authenticated 
  USING (blueprint_id IS NULL OR (SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "event_subscriptions_delete" ON event_subscriptions 
  FOR DELETE TO authenticated 
  USING (blueprint_id IS NULL OR (SELECT private.can_write_blueprint(blueprint_id)));

-- 發布事件函數
CREATE OR REPLACE FUNCTION public.publish_event(
  p_event_name VARCHAR(255),
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_blueprint_id UUID DEFAULT NULL,
  p_source VARCHAR(100) DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.events (
    blueprint_id,
    event_name,
    payload,
    source,
    scheduled_at,
    status
  )
  VALUES (
    p_blueprint_id,
    p_event_name,
    p_payload,
    p_source,
    COALESCE(p_scheduled_at, now()),
    CASE WHEN p_scheduled_at IS NULL OR p_scheduled_at <= now() THEN 'pending' ELSE 'pending' END
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_event(VARCHAR, JSONB, UUID, VARCHAR, TIMESTAMPTZ) TO authenticated;

-- ============================================================================
-- 15.4: CROSS-MODULE REFERENCES (關聯管理)
-- 跨模組資源引用
-- ============================================================================

-- 引用類型
CREATE TYPE reference_type AS ENUM (
  'link',              -- 連結
  'parent',            -- 父子關係
  'related',           -- 相關
  'blocks',            -- 阻擋
  'blocked_by',        -- 被阻擋
  'duplicates',        -- 重複
  'duplicate_of'       -- 重複自
);

-- 跨模組引用表
CREATE TABLE entity_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  source_type entity_type NOT NULL,
  source_id UUID NOT NULL,
  target_type entity_type NOT NULL,
  target_id UUID NOT NULL,
  reference_type reference_type NOT NULL DEFAULT 'related',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT entity_references_unique UNIQUE (blueprint_id, source_type, source_id, target_type, target_id, reference_type)
);

CREATE INDEX idx_entity_references_blueprint ON entity_references(blueprint_id);
CREATE INDEX idx_entity_references_source ON entity_references(source_type, source_id);
CREATE INDEX idx_entity_references_target ON entity_references(target_type, target_id);
CREATE INDEX idx_entity_references_type ON entity_references(reference_type);

-- RLS
ALTER TABLE entity_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_references_select" ON entity_references 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "entity_references_insert" ON entity_references 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "entity_references_delete" ON entity_references 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

-- ============================================================================
-- 15.5: METADATA SYSTEM (元數據系統)
-- 自訂欄位支援
-- ============================================================================

-- 欄位類型
CREATE TYPE custom_field_type AS ENUM (
  'text',              -- 文字
  'number',            -- 數字
  'date',              -- 日期
  'datetime',          -- 日期時間
  'boolean',           -- 布林值
  'select',            -- 單選
  'multiselect',       -- 多選
  'user',              -- 用戶
  'url',               -- 連結
  'email',             -- 電子郵件
  'phone',             -- 電話
  'currency',          -- 貨幣
  'percentage',        -- 百分比
  'file',              -- 檔案
  'formula'            -- 公式
);

-- 自訂欄位定義表
CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  field_type custom_field_type NOT NULL,
  description TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  default_value JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT custom_field_definitions_unique UNIQUE (blueprint_id, entity_type, name)
);

CREATE INDEX idx_custom_field_definitions_blueprint ON custom_field_definitions(blueprint_id);
CREATE INDEX idx_custom_field_definitions_entity ON custom_field_definitions(entity_type);

-- 自訂欄位值表
CREATE TABLE custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT custom_field_values_unique UNIQUE (field_definition_id, entity_type, entity_id)
);

CREATE INDEX idx_custom_field_values_blueprint ON custom_field_values(blueprint_id);
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX idx_custom_field_values_field ON custom_field_values(field_definition_id);

-- 觸發器
CREATE TRIGGER update_custom_field_definitions_updated_at 
  BEFORE UPDATE ON custom_field_definitions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_custom_field_values_updated_at 
  BEFORE UPDATE ON custom_field_values 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;

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
  USING ((SELECT private.can_write_blueprint(blueprint_id)) AND is_system = false);

CREATE POLICY "custom_field_values_select" ON custom_field_values 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "custom_field_values_insert" ON custom_field_values 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "custom_field_values_update" ON custom_field_values 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "custom_field_values_delete" ON custom_field_values 
  FOR DELETE TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- ============================================================================
-- 15.6: LIFECYCLE MANAGEMENT (生命週期管理)
-- 狀態機支援
-- ============================================================================

-- 藍圖生命週期狀態
CREATE TYPE blueprint_lifecycle AS ENUM (
  'draft',             -- 草稿
  'active',            -- 啟用中
  'on_hold',           -- 暫停
  'archived',          -- 已封存
  'deleted'            -- 已刪除
);

-- 增加 lifecycle 欄位到 blueprints (使用 ALTER TABLE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blueprints' AND column_name = 'lifecycle'
  ) THEN
    ALTER TABLE blueprints ADD COLUMN lifecycle blueprint_lifecycle NOT NULL DEFAULT 'active';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blueprints_lifecycle ON blueprints(lifecycle);

-- 狀態轉換歷史表
CREATE TABLE lifecycle_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  from_status VARCHAR(100),
  to_status VARCHAR(100) NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  transitioned_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lifecycle_transitions_blueprint ON lifecycle_transitions(blueprint_id);
CREATE INDEX idx_lifecycle_transitions_entity ON lifecycle_transitions(entity_type, entity_id);
CREATE INDEX idx_lifecycle_transitions_created ON lifecycle_transitions(created_at DESC);

-- RLS
ALTER TABLE lifecycle_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lifecycle_transitions_select" ON lifecycle_transitions 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "lifecycle_transitions_insert" ON lifecycle_transitions 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

-- ============================================================================
-- 15.7: SEARCH INFRASTRUCTURE (搜尋引擎基礎設施)
-- 全文檢索支援
-- ============================================================================

-- 搜尋索引表
CREATE TABLE search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT search_index_unique UNIQUE (blueprint_id, entity_type, entity_id)
);

CREATE INDEX idx_search_index_blueprint ON search_index(blueprint_id);
CREATE INDEX idx_search_index_entity ON search_index(entity_type, entity_id);
CREATE INDEX idx_search_index_vector ON search_index USING GIN(search_vector);
CREATE INDEX idx_search_index_title ON search_index USING GIN(to_tsvector('simple', title));

-- 觸發器：自動更新搜尋向量
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
                       setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_search_index_vector
  BEFORE INSERT OR UPDATE ON search_index
  FOR EACH ROW
  EXECUTE FUNCTION public.update_search_vector();

-- RLS
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_index_select" ON search_index 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "search_index_insert" ON search_index 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "search_index_update" ON search_index 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "search_index_delete" ON search_index 
  FOR DELETE TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- 搜尋函數
CREATE OR REPLACE FUNCTION public.search_blueprint(
  p_blueprint_id UUID,
  p_query TEXT,
  p_entity_types entity_type[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  entity_type entity_type,
  entity_id UUID,
  title TEXT,
  content TEXT,
  metadata JSONB,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  -- 驗證存取權限
  IF NOT (SELECT private.has_blueprint_access(p_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to blueprint';
  END IF;

  RETURN QUERY
  SELECT 
    si.entity_type,
    si.entity_id,
    si.title,
    si.content,
    si.metadata,
    ts_rank(si.search_vector, plainto_tsquery('simple', p_query)) AS rank
  FROM public.search_index si
  WHERE si.blueprint_id = p_blueprint_id
    AND (p_entity_types IS NULL OR si.entity_type = ANY(p_entity_types))
    AND si.search_vector @@ plainto_tsquery('simple', p_query)
  ORDER BY rank DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_blueprint(UUID, TEXT, entity_type[], INTEGER, INTEGER) TO authenticated;

-- ============================================================================
-- 15.8: FILES MANAGEMENT (檔案管理)
-- 檔案系統支援
-- ============================================================================

-- 檔案狀態
CREATE TYPE file_status AS ENUM (
  'pending',           -- 上傳中
  'active',            -- 有效
  'archived',          -- 已封存
  'deleted'            -- 已刪除
);

-- 檔案表
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  display_name VARCHAR(500),
  mime_type VARCHAR(255),
  file_size BIGINT,
  checksum VARCHAR(64),
  status file_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  parent_folder_id UUID REFERENCES files(id) ON DELETE SET NULL,
  is_folder BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_files_blueprint ON files(blueprint_id);
CREATE INDEX idx_files_parent ON files(parent_folder_id);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_files_mime ON files(mime_type);
CREATE INDEX idx_files_folder ON files(is_folder);

-- 檔案分享表
CREATE TABLE file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  shared_with_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  shared_with_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  share_link VARCHAR(100) UNIQUE,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT file_shares_recipient CHECK (
    (shared_with_account_id IS NOT NULL AND shared_with_team_id IS NULL) OR
    (shared_with_account_id IS NULL AND shared_with_team_id IS NOT NULL) OR
    (share_link IS NOT NULL)
  )
);

CREATE INDEX idx_file_shares_file ON file_shares(file_id);
CREATE INDEX idx_file_shares_account ON file_shares(shared_with_account_id);
CREATE INDEX idx_file_shares_team ON file_shares(shared_with_team_id);
CREATE INDEX idx_file_shares_link ON file_shares(share_link);

-- 觸發器
CREATE TRIGGER update_files_updated_at 
  BEFORE UPDATE ON files 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_select" ON files 
  FOR SELECT TO authenticated 
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "files_insert" ON files 
  FOR INSERT TO authenticated 
  WITH CHECK ((SELECT private.has_blueprint_access(blueprint_id)));

CREATE POLICY "files_update" ON files 
  FOR UPDATE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "files_delete" ON files 
  FOR DELETE TO authenticated 
  USING ((SELECT private.can_write_blueprint(blueprint_id)));

CREATE POLICY "file_shares_select" ON file_shares 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM files f 
      WHERE f.id = file_shares.file_id 
      AND (SELECT private.has_blueprint_access(f.blueprint_id))
    )
  );

CREATE POLICY "file_shares_insert" ON file_shares 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM files f 
      WHERE f.id = file_shares.file_id 
      AND (SELECT private.can_write_blueprint(f.blueprint_id))
    )
  );

CREATE POLICY "file_shares_delete" ON file_shares 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM files f 
      WHERE f.id = file_shares.file_id 
      AND (SELECT private.can_write_blueprint(f.blueprint_id))
    )
  );

-- ============================================================================
-- 15.9: PERMISSION VIEWS (權限系統視圖)
-- RBAC 輔助視圖
-- ============================================================================

-- 用戶權限視圖
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
  a.id AS account_id,
  a.auth_user_id,
  b.id AS blueprint_id,
  b.name AS blueprint_name,
  bm.role AS member_role,
  bm.business_role,
  br.name AS custom_role_name,
  br.permissions AS custom_permissions,
  CASE 
    WHEN b.owner_id = a.id THEN true
    WHEN EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON om.organization_id = o.id
      WHERE o.account_id = b.owner_id
      AND om.account_id = a.id
      AND om.role = 'owner'
    ) THEN true
    ELSE false
  END AS is_owner,
  CASE 
    WHEN bm.role = 'maintainer' THEN true
    WHEN EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON om.organization_id = o.id
      WHERE o.account_id = b.owner_id
      AND om.account_id = a.id
      AND om.role IN ('owner', 'admin')
    ) THEN true
    ELSE false
  END AS can_manage
FROM accounts a
JOIN blueprint_members bm ON bm.account_id = a.id
JOIN blueprints b ON b.id = bm.blueprint_id
LEFT JOIN blueprint_roles br ON br.id = bm.custom_role_id
WHERE a.type = 'user'
  AND a.status = 'active'
  AND b.deleted_at IS NULL;

-- 藍圖成員完整視圖
CREATE OR REPLACE VIEW blueprint_members_full AS
SELECT 
  bm.id,
  bm.blueprint_id,
  bm.account_id,
  a.name AS account_name,
  a.email AS account_email,
  a.avatar_url,
  bm.role,
  bm.business_role,
  bm.custom_role_id,
  br.name AS custom_role_name,
  br.display_name AS custom_role_display_name,
  bm.is_external,
  bm.created_at,
  bm.updated_at
FROM blueprint_members bm
JOIN accounts a ON a.id = bm.account_id
LEFT JOIN blueprint_roles br ON br.id = bm.custom_role_id
WHERE a.status != 'deleted';

-- ============================================================================
-- 15.10: API GATEWAY FUNCTIONS (API 閘道)
-- 對外 RPC 函數
-- ============================================================================

-- 取得藍圖完整上下文
CREATE OR REPLACE FUNCTION public.get_blueprint_context(p_blueprint_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_user_account_id UUID;
  v_business_role public.blueprint_business_role;
BEGIN
  -- 驗證存取權限
  IF NOT (SELECT private.has_blueprint_access(p_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to blueprint';
  END IF;
  
  v_user_account_id := (SELECT private.get_user_account_id());
  v_business_role := (SELECT private.get_blueprint_business_role(p_blueprint_id));
  
  SELECT jsonb_build_object(
    'blueprint', jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'slug', b.slug,
      'description', b.description,
      'cover_url', b.cover_url,
      'is_public', b.is_public,
      'status', b.status,
      'lifecycle', b.lifecycle,
      'enabled_modules', b.enabled_modules,
      'owner_id', b.owner_id,
      'created_at', b.created_at
    ),
    'user', jsonb_build_object(
      'account_id', v_user_account_id,
      'business_role', v_business_role,
      'is_owner', (SELECT private.is_blueprint_owner(p_blueprint_id)),
      'can_write', (SELECT private.can_write_blueprint(p_blueprint_id))
    ),
    'roles', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', br.id,
          'name', br.name,
          'display_name', br.display_name,
          'business_role', br.business_role,
          'is_default', br.is_default
        )
      ), '[]'::jsonb)
      FROM public.blueprint_roles br
      WHERE br.blueprint_id = p_blueprint_id
    ),
    'configs', (
      SELECT COALESCE(jsonb_object_agg(
        bc.key, bc.value
      ), '{}'::jsonb)
      FROM public.blueprint_configs bc
      WHERE bc.blueprint_id = p_blueprint_id
    )
  ) INTO v_result
  FROM public.blueprints b
  WHERE b.id = p_blueprint_id;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_blueprint_context(UUID) TO authenticated;

-- 取得用戶所有藍圖
CREATE OR REPLACE FUNCTION public.get_user_blueprints()
RETURNS TABLE (
  blueprint_id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN,
  status public.account_status,
  lifecycle public.blueprint_lifecycle,
  enabled_modules public.module_type[],
  owner_id UUID,
  owner_name VARCHAR,
  owner_type public.account_type,
  member_role public.blueprint_role,
  business_role public.blueprint_business_role,
  is_owner BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_user_account_id UUID;
BEGIN
  v_user_account_id := (SELECT private.get_user_account_id());
  
  IF v_user_account_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    b.id AS blueprint_id,
    b.name,
    b.slug,
    b.description,
    b.cover_url,
    b.is_public,
    b.status,
    b.lifecycle,
    b.enabled_modules,
    b.owner_id,
    a.name AS owner_name,
    a.type AS owner_type,
    bm.role AS member_role,
    COALESCE(bm.business_role, 'observer'::public.blueprint_business_role) AS business_role,
    (b.owner_id = v_user_account_id) AS is_owner,
    b.created_at
  FROM public.blueprints b
  JOIN public.accounts a ON a.id = b.owner_id
  LEFT JOIN public.blueprint_members bm ON bm.blueprint_id = b.id AND bm.account_id = v_user_account_id
  WHERE b.deleted_at IS NULL
    AND (
      -- 擁有者
      b.owner_id = v_user_account_id
      -- 成員
      OR bm.id IS NOT NULL
      -- 組織成員
      OR EXISTS (
        SELECT 1 FROM public.organizations o
        JOIN public.organization_members om ON om.organization_id = o.id
        WHERE o.account_id = b.owner_id
        AND om.account_id = v_user_account_id
      )
      -- 團隊成員
      OR EXISTS (
        SELECT 1 FROM public.blueprint_team_roles btr
        JOIN public.team_members tm ON tm.team_id = btr.team_id
        WHERE btr.blueprint_id = b.id
        AND tm.account_id = v_user_account_id
      )
      -- 公開藍圖
      OR b.is_public = true
    )
  ORDER BY b.updated_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_blueprints() TO authenticated;

-- 取得藍圖統計資訊
CREATE OR REPLACE FUNCTION public.get_blueprint_stats(p_blueprint_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- 驗證存取權限
  IF NOT (SELECT private.has_blueprint_access(p_blueprint_id)) THEN
    RAISE EXCEPTION 'Access denied to blueprint';
  END IF;
  
  SELECT jsonb_build_object(
    'tasks', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.tasks WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL),
      'pending', (SELECT COUNT(*) FROM public.tasks WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status = 'pending'),
      'in_progress', (SELECT COUNT(*) FROM public.tasks WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status = 'in_progress'),
      'completed', (SELECT COUNT(*) FROM public.tasks WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status = 'completed')
    ),
    'diaries', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.diaries WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL),
      'this_month', (SELECT COUNT(*) FROM public.diaries WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND work_date >= date_trunc('month', CURRENT_DATE))
    ),
    'issues', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.issues WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL),
      'open', (SELECT COUNT(*) FROM public.issues WHERE blueprint_id = p_blueprint_id AND deleted_at IS NULL AND status NOT IN ('resolved', 'closed'))
    ),
    'members', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.blueprint_members WHERE blueprint_id = p_blueprint_id)
    ),
    'files', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.files WHERE blueprint_id = p_blueprint_id AND status = 'active' AND is_folder = false),
      'total_size', (SELECT COALESCE(SUM(file_size), 0) FROM public.files WHERE blueprint_id = p_blueprint_id AND status = 'active' AND is_folder = false)
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_blueprint_stats(UUID) TO authenticated;

-- ============================================================================
-- 15.11: NOTIFICATION ENHANCEMENTS (通知中心增強)
-- 擴展通知系統
-- ============================================================================

-- 通知類型
CREATE TYPE notification_type AS ENUM (
  'info',              -- 一般資訊
  'warning',           -- 警告
  'error',             -- 錯誤
  'success',           -- 成功
  'mention',           -- 提及
  'assignment',        -- 指派
  'approval',          -- 審核
  'reminder',          -- 提醒
  'system'             -- 系統
);

-- 通知渠道
CREATE TYPE notification_channel AS ENUM (
  'in_app',            -- 應用內
  'email',             -- 電子郵件
  'push',              -- 推播
  'sms'                -- 簡訊
);

-- 增加欄位到 notifications (使用 ALTER TABLE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'notification_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN notification_type notification_type NOT NULL DEFAULT 'info';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'channels'
  ) THEN
    ALTER TABLE notifications ADD COLUMN channels notification_channel[] DEFAULT ARRAY['in_app']::notification_channel[];
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'sent_channels'
  ) THEN
    ALTER TABLE notifications ADD COLUMN sent_channels notification_channel[] DEFAULT ARRAY[]::notification_channel[];
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN entity_type entity_type;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'entity_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN entity_id UUID;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'action_url'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- 通知偏好設定表
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  blueprint_id UUID REFERENCES blueprints(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  channels notification_channel[] NOT NULL DEFAULT ARRAY['in_app']::notification_channel[],
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT notification_preferences_unique UNIQUE (account_id, blueprint_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_account ON notification_preferences(account_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_blueprint ON notification_preferences(blueprint_id);

-- 觸發器
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

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

-- 發送通知函數
CREATE OR REPLACE FUNCTION public.send_notification(
  p_account_id UUID,
  p_blueprint_id UUID,
  p_title VARCHAR(500),
  p_content TEXT DEFAULT NULL,
  p_notification_type notification_type DEFAULT 'info',
  p_entity_type entity_type DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_notification_id UUID;
  v_channels notification_channel[];
BEGIN
  -- 取得通知偏好
  SELECT COALESCE(np.channels, ARRAY['in_app']::notification_channel[])
  INTO v_channels
  FROM public.notification_preferences np
  WHERE np.account_id = p_account_id
    AND (np.blueprint_id = p_blueprint_id OR np.blueprint_id IS NULL)
    AND np.notification_type = p_notification_type
    AND np.is_enabled = true
  LIMIT 1;
  
  -- 如果沒有偏好設定，使用預設
  IF v_channels IS NULL THEN
    v_channels := ARRAY['in_app']::notification_channel[];
  END IF;
  
  INSERT INTO public.notifications (
    account_id,
    blueprint_id,
    title,
    content,
    notification_type,
    channels,
    entity_type,
    entity_id,
    action_url,
    metadata
  )
  VALUES (
    p_account_id,
    p_blueprint_id,
    p_title,
    p_content,
    p_notification_type,
    v_channels,
    p_entity_type,
    p_entity_id,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_notification(UUID, UUID, VARCHAR, TEXT, notification_type, entity_type, UUID, TEXT, JSONB) TO authenticated;

-- ############################################################################
-- PART 16: DOCUMENTATION FOR NEW INFRASTRUCTURE (新基礎設施文件註解)
-- ############################################################################

-- 容器層基礎設施資料表註解
COMMENT ON TABLE blueprint_configs IS '藍圖配置 - Blueprint-level configuration management';
COMMENT ON TABLE activities IS '活動時間軸 - Cross-module activity tracking';
COMMENT ON TABLE events IS '事件表 - Event bus for inter-module communication';
COMMENT ON TABLE event_subscriptions IS '事件訂閱 - Event subscription management';
COMMENT ON TABLE entity_references IS '實體引用 - Cross-module resource references';
COMMENT ON TABLE custom_field_definitions IS '自訂欄位定義 - Custom field definitions per entity type';
COMMENT ON TABLE custom_field_values IS '自訂欄位值 - Custom field values for entities';
COMMENT ON TABLE lifecycle_transitions IS '生命週期轉換 - State transition history';
COMMENT ON TABLE search_index IS '搜尋索引 - Full-text search index';
COMMENT ON TABLE files IS '檔案 - File management system';
COMMENT ON TABLE file_shares IS '檔案分享 - File sharing management';
COMMENT ON TABLE notification_preferences IS '通知偏好 - User notification preferences';

-- 容器層基礎設施函數註解
COMMENT ON FUNCTION public.log_activity(UUID, entity_type, UUID, activity_type, JSONB, JSONB, JSONB) IS '記錄活動 - Log activity to timeline';
COMMENT ON FUNCTION public.publish_event(VARCHAR, JSONB, UUID, VARCHAR, TIMESTAMPTZ) IS '發布事件 - Publish event to event bus';
COMMENT ON FUNCTION public.search_blueprint(UUID, TEXT, entity_type[], INTEGER, INTEGER) IS '搜尋藍圖 - Full-text search within blueprint';
COMMENT ON FUNCTION public.get_blueprint_context(UUID) IS '取得藍圖上下文 - Get complete blueprint context';
COMMENT ON FUNCTION public.get_user_blueprints() IS '取得用戶藍圖 - Get all blueprints accessible to user';
COMMENT ON FUNCTION public.get_blueprint_stats(UUID) IS '取得藍圖統計 - Get blueprint statistics';
COMMENT ON FUNCTION public.send_notification(UUID, UUID, VARCHAR, TEXT, notification_type, entity_type, UUID, TEXT, JSONB) IS '發送通知 - Send notification to user';
COMMENT ON FUNCTION public.update_search_vector() IS '更新搜尋向量 - Trigger function to update search vector';

-- 類型註解
COMMENT ON TYPE blueprint_config_type IS '配置類型 - Types of blueprint configurations';
COMMENT ON TYPE activity_type IS '活動類型 - Types of activity log entries';
COMMENT ON TYPE entity_type IS '實體類型 - Types of entities in the system';
COMMENT ON TYPE event_status IS '事件狀態 - Status of events in event bus';
COMMENT ON TYPE reference_type IS '引用類型 - Types of cross-module references';
COMMENT ON TYPE custom_field_type IS '自訂欄位類型 - Types of custom fields';
COMMENT ON TYPE blueprint_lifecycle IS '藍圖生命週期 - Lifecycle states of blueprints';
COMMENT ON TYPE file_status IS '檔案狀態 - Status of files';
COMMENT ON TYPE notification_type IS '通知類型 - Types of notifications';
COMMENT ON TYPE notification_channel IS '通知渠道 - Channels for sending notifications';

-- ############################################################################
-- PART 17: STORAGE CONFIGURATION (儲存配置)
-- ############################################################################

-- 建立儲存桶 (如果不存在)
-- 注意：這需要 Supabase Storage API，在 PostgreSQL 中通過 storage schema 操作

-- Blueprint 附件儲存桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blueprint-attachments',
  'blueprint-attachments',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 用戶頭像儲存桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 建立儲存政策
-- Blueprint 附件：只有藍圖成員可以存取
CREATE POLICY "blueprint_attachments_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'blueprint-attachments'
    AND (
      SELECT private.has_blueprint_access(
        (storage.foldername(name))[1]::uuid
      )
    )
  );

CREATE POLICY "blueprint_attachments_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'blueprint-attachments'
    AND (
      SELECT private.has_blueprint_access(
        (storage.foldername(name))[1]::uuid
      )
    )
  );

CREATE POLICY "blueprint_attachments_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'blueprint-attachments'
    AND (
      SELECT private.can_write_blueprint(
        (storage.foldername(name))[1]::uuid
      )
    )
  );

CREATE POLICY "blueprint_attachments_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'blueprint-attachments'
    AND (
      SELECT private.can_write_blueprint(
        (storage.foldername(name))[1]::uuid
      )
    )
  );

-- 頭像：公開讀取，用戶只能修改自己的
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ############################################################################
-- PART 18: REALTIME CONFIGURATION (即時配置)
-- ############################################################################

-- 啟用 Realtime 訂閱
-- 注意：這需要 Supabase Realtime 設定

-- 為需要即時更新的資料表啟用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE diaries;
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE blueprint_members;

-- ############################################################################
-- END OF INIT.SQL
-- ############################################################################


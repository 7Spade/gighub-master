-- ============================================================================
-- Migration: Create Custom Types (Enums)
-- Description: 建立自定義類型（列舉類型）
-- Created: 2024-12-01
-- ============================================================================

-- ############################################################################
-- PART 1: ENUMS (列舉類型定義)
-- ############################################################################

-- 帳號類型
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('user', 'org', 'bot');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 帳號狀態
DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 組織角色
DO $$ BEGIN
  CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 團隊角色
DO $$ BEGIN
  CREATE TYPE team_role AS ENUM ('leader', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 藍圖成員角色
DO $$ BEGIN
  CREATE TYPE blueprint_role AS ENUM ('viewer', 'contributor', 'maintainer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 藍圖團隊存取
DO $$ BEGIN
  CREATE TYPE blueprint_team_access AS ENUM ('read', 'write', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 啟用模組
DO $$ BEGIN
  CREATE TYPE module_type AS ENUM ('tasks', 'diary', 'dashboard', 'bot_workflow', 'files', 'todos', 'checklists', 'issues');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 任務狀態
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 任務優先級
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('lowest', 'low', 'medium', 'high', 'highest');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 問題嚴重度
DO $$ BEGIN
  CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 問題狀態
DO $$ BEGIN
  CREATE TYPE issue_status AS ENUM ('new', 'assigned', 'in_progress', 'pending_confirm', 'resolved', 'closed', 'reopened');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 驗收結果
DO $$ BEGIN
  CREATE TYPE acceptance_result AS ENUM ('pending', 'passed', 'failed', 'conditional');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 天氣類型 (expanded weather conditions)
DO $$ BEGIN
  CREATE TYPE weather_type AS ENUM (
    'sunny',         -- 晴天
    'cloudy',        -- 多雲
    'overcast',      -- 陰天
    'light_rain',    -- 小雨
    'heavy_rain',    -- 大雨
    'rainy',         -- 雨天 (通用)
    'thunderstorm',  -- 雷陣雨
    'stormy',        -- 暴風雨
    'foggy',         -- 霧
    'windy',         -- 風大
    'snowy',         -- 下雪
    'snow',          -- 雪 (alias)
    'other'          -- 其他
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 日誌狀態 (施工日誌審核狀態)
DO $$ BEGIN
  CREATE TYPE diary_status AS ENUM (
    'draft',       -- 草稿
    'submitted',   -- 已提交
    'reviewing',   -- 審核中
    'approved',    -- 已核准
    'rejected',    -- 已駁回
    'archived'     -- 已歸檔
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 業務角色
DO $$ BEGIN
  CREATE TYPE blueprint_business_role AS ENUM (
    'project_manager',   -- 專案經理
    'site_director',     -- 工地主任
    'supervisor',        -- 監工
    'inspector',         -- 檢驗員
    'contractor',        -- 承包商
    'subcontractor',     -- 分包商
    'consultant',        -- 顧問
    'engineer',          -- 工程師
    'safety_officer',    -- 安全官員
    'quality_control',   -- 品管人員
    'observer',          -- 觀察者
    'guest'              -- 訪客
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TYPE IF EXISTS blueprint_business_role;
-- DROP TYPE IF EXISTS diary_status;
-- DROP TYPE IF EXISTS weather_type;
-- DROP TYPE IF EXISTS acceptance_result;
-- DROP TYPE IF EXISTS issue_status;
-- DROP TYPE IF EXISTS issue_severity;
-- DROP TYPE IF EXISTS task_priority;
-- DROP TYPE IF EXISTS task_status;
-- DROP TYPE IF EXISTS module_type;
-- DROP TYPE IF EXISTS blueprint_team_access;
-- DROP TYPE IF EXISTS blueprint_role;
-- DROP TYPE IF EXISTS team_role;
-- DROP TYPE IF EXISTS organization_role;
-- DROP TYPE IF EXISTS account_status;
-- DROP TYPE IF EXISTS account_type;

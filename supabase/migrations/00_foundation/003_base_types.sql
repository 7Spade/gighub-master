-- ============================================================================
-- Migration: 003_base_types
-- Layer: 00_foundation
-- Description: 建立所有基礎 ENUM 類型
-- Dependencies: 002_schemas
-- ============================================================================

-- ############################################################################
-- SECTION 1: Core Types (核心類型)
-- ############################################################################

-- 帳號類型
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('user', 'org', 'bot');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 帳號狀態
DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('active', 'inactive', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 組織角色
DO $$ BEGIN
  CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 團隊角色
DO $$ BEGIN
  CREATE TYPE team_role AS ENUM ('leader', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- SECTION 2: Workspace Types (工作區類型)
-- ############################################################################

-- 藍圖成員角色
DO $$ BEGIN
  CREATE TYPE blueprint_role AS ENUM ('viewer', 'contributor', 'maintainer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 藍圖團隊存取
DO $$ BEGIN
  CREATE TYPE blueprint_team_access AS ENUM ('read', 'write', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 業務角色 (RBAC)
DO $$ BEGIN
  CREATE TYPE blueprint_business_role AS ENUM (
    'project_manager',   -- 專案經理
    'site_director',     -- 工地主任
    'site_supervisor',   -- 現場監督
    'worker',            -- 施工人員
    'qa_staff',          -- 品管人員
    'safety_health',     -- 公共安全衛生
    'finance',           -- 財務
    'observer'           -- 觀察者
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 啟用模組
DO $$ BEGIN
  CREATE TYPE module_type AS ENUM (
    'tasks',       -- 任務管理
    'diary',       -- 施工日誌
    'files',       -- 檔案管理
    'checklists',  -- 檢查清單
    'issues',      -- 問題追蹤
    'financial',   -- 財務管理
    'acceptance'   -- 品質驗收
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- SECTION 3: Module Types (模組類型)
-- ############################################################################

-- 任務狀態
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 任務優先級
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('lowest', 'low', 'medium', 'high', 'highest');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題嚴重度
DO $$ BEGIN
  CREATE TYPE issue_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題狀態
DO $$ BEGIN
  CREATE TYPE issue_status AS ENUM ('new', 'assigned', 'in_progress', 'pending_confirm', 'resolved', 'closed', 'reopened');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 驗收結果
DO $$ BEGIN
  CREATE TYPE acceptance_result AS ENUM ('pending', 'passed', 'failed', 'conditional');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 天氣類型
DO $$ BEGIN
  CREATE TYPE weather_type AS ENUM (
    'sunny', 'cloudy', 'overcast', 'light_rain', 'heavy_rain', 
    'rainy', 'thunderstorm', 'stormy', 'foggy', 'windy', 
    'snowy', 'snow', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 日誌狀態
DO $$ BEGIN
  CREATE TYPE diary_status AS ENUM (
    'draft', 'submitted', 'reviewing', 'approved', 'rejected', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ############################################################################
-- SECTION 4: QC/Acceptance/Problem Types (品管/驗收/問題類型)
-- ############################################################################

-- 品管檢查狀態
DO $$ BEGIN
  CREATE TYPE qc_inspection_status AS ENUM (
    'pending', 'in_progress', 'passed', 'failed', 'conditionally_passed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 品管檢查類型
DO $$ BEGIN
  CREATE TYPE qc_inspection_type AS ENUM (
    'self_check', 'supervisor_check', 'third_party', 'random_check', 'final_check'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 品管項目狀態
DO $$ BEGIN
  CREATE TYPE qc_item_status AS ENUM ('pending', 'passed', 'failed', 'na');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 驗收狀態
DO $$ BEGIN
  CREATE TYPE acceptance_status AS ENUM (
    'pending', 'in_progress', 'passed', 'failed', 'conditionally_passed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 驗收類型
DO $$ BEGIN
  CREATE TYPE acceptance_type AS ENUM (
    'interim', 'final', 'partial', 'stage', 'completion'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 驗收決定
DO $$ BEGIN
  CREATE TYPE acceptance_decision AS ENUM ('approve', 'reject', 'conditional', 'defer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題類型
DO $$ BEGIN
  CREATE TYPE problem_type AS ENUM (
    'defect', 'risk', 'gap', 'improvement', 'change_request', 
    'non_conformance', 'safety', 'quality', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題狀態
DO $$ BEGIN
  CREATE TYPE problem_status AS ENUM (
    'open', 'assessing', 'assigned', 'in_progress', 'resolved', 
    'verifying', 'closed', 'cancelled', 'deferred'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題優先級
DO $$ BEGIN
  CREATE TYPE problem_priority AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題嚴重程度
DO $$ BEGIN
  CREATE TYPE problem_severity AS ENUM ('critical', 'major', 'minor', 'cosmetic');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題來源
DO $$ BEGIN
  CREATE TYPE problem_source AS ENUM (
    'qc_inspection', 'acceptance', 'self_report', 'customer', 'audit', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TYPE IF EXISTS problem_source CASCADE;
-- DROP TYPE IF EXISTS problem_severity CASCADE;
-- DROP TYPE IF EXISTS problem_priority CASCADE;
-- DROP TYPE IF EXISTS problem_status CASCADE;
-- DROP TYPE IF EXISTS problem_type CASCADE;
-- DROP TYPE IF EXISTS acceptance_decision CASCADE;
-- DROP TYPE IF EXISTS acceptance_type CASCADE;
-- DROP TYPE IF EXISTS acceptance_status CASCADE;
-- DROP TYPE IF EXISTS qc_item_status CASCADE;
-- DROP TYPE IF EXISTS qc_inspection_type CASCADE;
-- DROP TYPE IF EXISTS qc_inspection_status CASCADE;
-- DROP TYPE IF EXISTS diary_status CASCADE;
-- DROP TYPE IF EXISTS weather_type CASCADE;
-- DROP TYPE IF EXISTS acceptance_result CASCADE;
-- DROP TYPE IF EXISTS issue_status CASCADE;
-- DROP TYPE IF EXISTS issue_severity CASCADE;
-- DROP TYPE IF EXISTS task_priority CASCADE;
-- DROP TYPE IF EXISTS task_status CASCADE;
-- DROP TYPE IF EXISTS module_type CASCADE;
-- DROP TYPE IF EXISTS blueprint_business_role CASCADE;
-- DROP TYPE IF EXISTS blueprint_team_access CASCADE;
-- DROP TYPE IF EXISTS blueprint_role CASCADE;
-- DROP TYPE IF EXISTS team_role CASCADE;
-- DROP TYPE IF EXISTS organization_role CASCADE;
-- DROP TYPE IF EXISTS account_status CASCADE;
-- DROP TYPE IF EXISTS account_type CASCADE;

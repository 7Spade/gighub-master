-- ============================================================================
-- Migration: 03 - Custom Types (All ENUMs)
-- Description: 所有自定義類型和枚舉定義
-- Category: 03 - Custom Types
-- 
-- 注意：所有 ENUM 類型必須在表創建之前定義
-- ============================================================================

-- ============================================================================
-- PART 1: 基礎類型
-- ============================================================================

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

-- ============================================================================
-- PART 2: 藍圖類型
-- ============================================================================

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

-- 業務角色
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
  CREATE TYPE module_type AS ENUM ('tasks', 'diary', 'dashboard', 'bot_workflow', 'files', 'todos', 'checklists', 'issues');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 3: 任務/模組類型
-- ============================================================================

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
    'rainy', 'thunderstorm', 'stormy', 'foggy', 'windy', 'snowy', 'snow', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 日誌狀態
DO $$ BEGIN
  CREATE TYPE diary_status AS ENUM ('draft', 'submitted', 'reviewing', 'approved', 'rejected', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 工項類型
DO $$ BEGIN
  CREATE TYPE work_item_type AS ENUM (
    'construction', 'material', 'equipment', 'labor', 
    'inspection', 'safety', 'quality', 'meeting', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 4: 容器層類型
-- ============================================================================

-- 配置類型
DO $$ BEGIN
  CREATE TYPE blueprint_config_type AS ENUM ('general', 'notification', 'workflow', 'display', 'integration', 'permission');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 活動類型
DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'create', 'update', 'delete', 'comment', 'assign', 'status_change',
    'attachment', 'approval', 'mention', 'share', 'move', 'archive', 'restore'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 實體類型 (用於活動和引用)
DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM (
    'blueprint', 'task', 'diary', 'checklist', 'checklist_item', 'issue', 'todo',
    'file', 'comment', 'acceptance', 'problem', 'qc_inspection', 'notification',
    'contract', 'expense', 'payment_request', 'payment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 事件狀態
DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('pending', 'processed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 引用類型
DO $$ BEGIN
  CREATE TYPE reference_type AS ENUM ('parent', 'child', 'related', 'duplicate', 'blocks', 'blocked_by', 'mentions', 'mentioned_by');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 自定義欄位類型
DO $$ BEGIN
  CREATE TYPE custom_field_type AS ENUM ('text', 'number', 'date', 'datetime', 'select', 'multiselect', 'checkbox', 'url', 'email', 'phone', 'user', 'file');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 藍圖生命週期
DO $$ BEGIN
  CREATE TYPE blueprint_lifecycle AS ENUM ('draft', 'active', 'completed', 'cancelled', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 檔案狀態
DO $$ BEGIN
  CREATE TYPE file_status AS ENUM ('uploading', 'processing', 'ready', 'error', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 通知類型
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'task_assigned', 'task_completed', 'task_commented', 'task_due_soon', 'task_overdue',
    'diary_submitted', 'diary_approved', 'diary_rejected',
    'issue_created', 'issue_assigned', 'issue_resolved',
    'mention', 'system', 'reminder'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 通知頻道
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'push', 'sms');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 5: QC/驗收/問題類型
-- ============================================================================

-- 品管檢查狀態
DO $$ BEGIN
  CREATE TYPE qc_inspection_status AS ENUM ('pending', 'in_progress', 'passed', 'failed', 'conditionally_passed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 品管檢查類型
DO $$ BEGIN
  CREATE TYPE qc_inspection_type AS ENUM ('self_check', 'supervisor_check', 'third_party', 'random_check', 'final_check');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 品管項目狀態
DO $$ BEGIN
  CREATE TYPE qc_item_status AS ENUM ('pending', 'passed', 'failed', 'na');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 驗收狀態
DO $$ BEGIN
  CREATE TYPE acceptance_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 驗收類型
DO $$ BEGIN
  CREATE TYPE acceptance_type AS ENUM ('phase', 'final', 'partial', 'rework');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 驗收決定
DO $$ BEGIN
  CREATE TYPE acceptance_decision AS ENUM ('pending', 'approved', 'rejected', 'conditional');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題類型
DO $$ BEGIN
  CREATE TYPE problem_type AS ENUM ('defect', 'safety', 'quality', 'delay', 'design', 'material', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題狀態
DO $$ BEGIN
  CREATE TYPE problem_status AS ENUM ('open', 'in_progress', 'resolved', 'closed', 'reopened');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題優先級
DO $$ BEGIN
  CREATE TYPE problem_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題嚴重度
DO $$ BEGIN
  CREATE TYPE problem_severity AS ENUM ('minor', 'moderate', 'major', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 問題來源
DO $$ BEGIN
  CREATE TYPE problem_source AS ENUM ('inspection', 'observation', 'complaint', 'audit', 'accident', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PART 6: 審計日誌類型
-- ============================================================================

-- 審計動作類型
DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM (
    'create', 'update', 'delete', 'view', 'export', 'import',
    'approve', 'reject', 'assign', 'unassign', 'login', 'logout',
    'password_change', 'permission_change', 'role_change', 'status_change',
    'archive', 'restore', 'share', 'comment', 'upload', 'download'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 審計嚴重程度
DO $$ BEGIN
  CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'error', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 審計實體類型
DO $$ BEGIN
  CREATE TYPE audit_entity_type AS ENUM (
    'account', 'organization', 'blueprint', 'task', 'diary', 'file',
    'issue', 'checklist', 'acceptance', 'contract', 'payment',
    'notification', 'comment', 'team', 'role', 'permission'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 審計操作者類型
DO $$ BEGIN
  CREATE TYPE audit_actor_type AS ENUM ('user', 'system', 'bot');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

# 📋 Supabase 遷移檔案結構化指南

> **目的**: 定義最有利於開發的 Supabase 遷移檔案結構樹，基於專案三層架構設計

---

## 🏗️ 完整結構樹

基於 GigHub 專案的三層架構（基礎層、容器層、業務層），設計以下最佳遷移結構：

```
supabase/
├── config.toml                           # Supabase 專案配置
├── .gitignore                            # 忽略 .supabase/ 等本地文件
├── MIGRATION_GUIDE.md                    # 遷移操作指南
│
├── migrations/                           # 遷移檔案主目錄
│   │
│   │  ═══════════════════════════════════════════════════════════════════
│   │  LAYER 0: CORE INFRASTRUCTURE (核心基礎設施)
│   │  ═══════════════════════════════════════════════════════════════════
│   │
│   ├── 00000_extensions.sql              # PostgreSQL 擴展 (pg_trgm, uuid-ossp等)
│   ├── 00001_create_schemas.sql          # Schema 定義 (public, private, auth擴展)
│   ├── 00002_create_enums.sql            # 所有 ENUM 類型定義
│   ├── 00003_create_helper_functions.sql # 通用 Helper 函數 (updated_at 等)
│   │
│   │  ═══════════════════════════════════════════════════════════════════
│   │  LAYER 1: FOUNDATION (基礎層 - 帳戶/組織/團隊)
│   │  ═══════════════════════════════════════════════════════════════════
│   │
│   ├── 01000_foundation_accounts.sql     # accounts 表 + RLS + 觸發器
│   ├── 01001_foundation_organizations.sql # organizations 表 + RLS
│   ├── 01002_foundation_org_members.sql  # organization_members 表 + RLS
│   ├── 01003_foundation_teams.sql        # teams 表 + RLS
│   ├── 01004_foundation_team_members.sql # team_members 表 + RLS
│   ├── 01005_foundation_team_bots.sql    # team_bots 表 + RLS
│   ├── 01006_foundation_notifications.sql # notifications 表 + RLS
│   │
│   ├── 01100_foundation_rls_helpers.sql  # 基礎層 RLS Helper 函數
│   ├── 01101_foundation_auth_triggers.sql # Auth 整合觸發器
│   ├── 01102_foundation_api_functions.sql # 組織/團隊 API 函數
│   │
│   │  ═══════════════════════════════════════════════════════════════════
│   │  LAYER 2: CONTAINER (容器層 - 藍圖/權限)
│   │  ═══════════════════════════════════════════════════════════════════
│   │
│   ├── 02000_container_blueprints.sql    # blueprints 表 + RLS
│   ├── 02001_container_bp_members.sql    # blueprint_members 表 + RLS
│   ├── 02002_container_bp_roles.sql      # blueprint_roles 表 + RLS
│   ├── 02003_container_bp_team_roles.sql # blueprint_team_roles 表 + RLS
│   ├── 02004_container_bp_configs.sql    # blueprint_configs 表 (配置中心)
│   ├── 02005_container_bp_modules.sql    # blueprint_modules 表 (模組啟用)
│   │
│   ├── 02100_container_activity.sql      # blueprint_activities 時間軸
│   ├── 02101_container_events.sql        # blueprint_events 事件總線
│   ├── 02102_container_metadata.sql      # blueprint_metadata 元數據系統
│   ├── 02103_container_entity_refs.sql   # entity_references 關聯管理
│   ├── 02104_container_lifecycle.sql     # 生命週期管理表
│   │
│   ├── 02200_container_rls_helpers.sql   # 容器層 RLS Helper 函數
│   ├── 02201_container_api_functions.sql # 藍圖 API 函數
│   ├── 02202_container_rbac_setup.sql    # RBAC 預設角色設置
│   │
│   │  ═══════════════════════════════════════════════════════════════════
│   │  LAYER 3: BUSINESS MODULES (業務層 - 核心模組)
│   │  ═══════════════════════════════════════════════════════════════════
│   │
│   │  --- Module: Tasks (任務管理) ---
│   ├── 03000_business_tasks.sql          # tasks 表 + RLS
│   ├── 03001_business_task_attachments.sql # task_attachments 表
│   ├── 03002_business_task_comments.sql  # task_comments 表
│   ├── 03003_business_task_acceptances.sql # task_acceptances 驗收記錄
│   ├── 03004_business_task_labels.sql    # task_labels 標籤
│   │
│   │  --- Module: Diaries (施工日誌) ---
│   ├── 03100_business_diaries.sql        # diaries 表 + RLS
│   ├── 03101_business_diary_attachments.sql # diary_attachments 表
│   ├── 03102_business_diary_entries.sql  # diary_entries 工項記錄
│   │
│   │  --- Module: Checklists (檢查清單) ---
│   ├── 03200_business_checklists.sql     # checklists 表 + RLS
│   ├── 03201_business_checklist_items.sql # checklist_items 表
│   │
│   │  --- Module: Issues (問題追蹤) ---
│   ├── 03300_business_issues.sql         # issues 表 + RLS
│   ├── 03301_business_issue_comments.sql # issue_comments 表
│   ├── 03302_business_issue_attachments.sql # issue_attachments 表
│   │
│   │  --- Module: Files (檔案管理) ---
│   ├── 03400_business_files.sql          # files 表 + RLS
│   ├── 03401_business_file_versions.sql  # file_versions 版本控制
│   ├── 03402_business_file_shares.sql    # file_shares 分享管理
│   │
│   │  --- Module: Todos (待辦事項) ---
│   ├── 03500_business_todos.sql          # todos 表 + RLS
│   │
│   │  ═══════════════════════════════════════════════════════════════════
│   │  LAYER 4: EXTENDED MODULES (擴展模組)
│   │  ═══════════════════════════════════════════════════════════════════
│   │
│   │  --- Module: QC (品質管理) ---
│   ├── 04000_qc_inspections.sql          # qc_inspections 品管檢查
│   ├── 04001_qc_inspection_items.sql     # qc_inspection_items 檢查項目
│   ├── 04002_qc_attachments.sql          # qc_inspection_attachments 附件
│   │
│   │  --- Module: Acceptance (驗收管理) ---
│   ├── 04100_acceptance_records.sql      # acceptances 驗收記錄
│   ├── 04101_acceptance_items.sql        # acceptance_items 驗收項目
│   ├── 04102_acceptance_decisions.sql    # acceptance_decisions 決定歷史
│   │
│   │  --- Module: Problems (問題管理) ---
│   ├── 04200_problem_reports.sql         # problems 問題報告
│   ├── 04201_problem_history.sql         # problem_history 歷史記錄
│   ├── 04202_problem_attachments.sql     # problem_attachments 附件
│   │
│   │  --- Module: Financial (財務管理 - 可選) ---
│   ├── 04300_financial_contracts.sql     # contracts 合約
│   ├── 04301_financial_payments.sql      # payments 付款
│   ├── 04302_financial_invoices.sql      # invoices 發票
│   │
│   │  ═══════════════════════════════════════════════════════════════════
│   │  LAYER 5: CROSS-CUTTING (跨切面功能)
│   │  ═══════════════════════════════════════════════════════════════════
│   │
│   ├── 05000_audit_logs.sql              # audit_logs 審計日誌
│   ├── 05001_search_history.sql          # search_history 搜尋歷史
│   ├── 05002_search_index.sql            # 搜尋索引配置
│   │
│   │  ═══════════════════════════════════════════════════════════════════
│   │  LAYER 6: STORAGE & REALTIME (存儲與即時)
│   │  ═══════════════════════════════════════════════════════════════════
│   │
│   ├── 06000_storage_buckets.sql         # Storage Buckets 配置
│   ├── 06001_storage_policies.sql        # Storage RLS 政策
│   ├── 06002_realtime_config.sql         # Realtime 頻道配置
│   │
│   │  ═══════════════════════════════════════════════════════════════════
│   │  LAYER 7: VIEWS & MATERIALIZED VIEWS (視圖)
│   │  ═══════════════════════════════════════════════════════════════════
│   │
│   ├── 07000_views_permissions.sql       # 權限相關視圖
│   ├── 07001_views_statistics.sql        # 統計相關視圖
│   ├── 07002_views_reports.sql           # 報表相關視圖
│   │
│   │  ═══════════════════════════════════════════════════════════════════
│   │  LAYER 8: DOCUMENTATION (文件註解)
│   │  ═══════════════════════════════════════════════════════════════════
│   │
│   └── 08000_table_comments.sql          # 資料表與欄位註解
│
├── seeds/                                # 種子資料
│   ├── seed.sql                          # 完整種子檔案 (開發/測試用)
│   ├── seed_accounts.sql                 # 帳戶種子資料
│   ├── seed_blueprints.sql               # 藍圖種子資料
│   ├── seed_tasks.sql                    # 任務種子資料
│   ├── seed_diaries.sql                  # 日誌種子資料
│   └── ...                               # 其他模組種子資料
│
└── functions/                            # Edge Functions (如有需要)
    ├── auth-webhook/
    │   └── index.ts
    ├── file-processor/
    │   └── index.ts
    └── ...
```

---

## 📁 命名規範

### 遷移檔案命名格式

```
{層級序號}{模組序號}{子序號}_{描述}.sql
```

| 欄位 | 說明 | 範例 |
|------|------|------|
| 層級序號 | 2位數字，代表架構層級 | 00, 01, 02, 03, 04, 05, 06, 07, 08 |
| 模組序號 | 1位數字，代表模組分類 | 0, 1, 2, 3, 4, 5 |
| 子序號 | 2位數字，代表順序 | 00, 01, 02, ... |
| 描述 | snake_case 描述 | create_accounts, add_rls_policies |

### 層級對應

| 層級碼 | 層級名稱 | 說明 |
|--------|---------|------|
| 00xxx | Core Infrastructure | 擴展、Schema、Enum、通用函數 |
| 01xxx | Foundation Layer | 帳戶、組織、團隊 |
| 02xxx | Container Layer | 藍圖、權限、配置 |
| 03xxx | Business Modules | 核心業務模組 (Tasks, Diaries, etc.) |
| 04xxx | Extended Modules | 擴展業務模組 (QC, Financial, etc.) |
| 05xxx | Cross-Cutting | 審計、搜尋、通用功能 |
| 06xxx | Storage & Realtime | 存儲與即時配置 |
| 07xxx | Views | 視圖與物化視圖 |
| 08xxx | Documentation | 文件註解 |

---

## 🔧 單一遷移檔案結構

每個遷移檔案應遵循以下結構：

```sql
-- ============================================================================
-- Migration: {描述}
-- Layer: {層級名稱}
-- Module: {模組名稱}
-- Description: {詳細說明}
-- 
-- Features:
--   - {功能 1}
--   - {功能 2}
--
-- Dependencies:
--   - {依賴的遷移檔案或表}
--
-- Based on GigHub Architecture:
--   - Three-layer architecture (Foundation/Container/Business)
--   - Blueprint as logical container
--   - RLS with helper functions pattern
-- ============================================================================

-- ============================================================================
-- 1. Enums (如果本模組需要新的枚舉類型)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_name') THEN
    CREATE TYPE enum_name AS ENUM ('value1', 'value2');
  END IF;
END $$;

-- ============================================================================
-- 2. Table Definition (資料表定義)
-- ============================================================================

CREATE TABLE IF NOT EXISTS table_name (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 關聯欄位 (藍圖關聯是業務層的必要欄位)
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  
  -- 業務欄位
  ...
  
  -- 審計欄位
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMPTZ  -- 軟刪除
);

-- ============================================================================
-- 3. Indexes (索引)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_table_name_blueprint_id ON table_name(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_table_name_status ON table_name(status) WHERE deleted_at IS NULL;
-- 複合索引
CREATE INDEX IF NOT EXISTS idx_table_name_composite ON table_name(col1, col2 DESC);

-- ============================================================================
-- 4. Row Level Security (RLS)
-- ============================================================================

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- SELECT: 藍圖成員可讀取
CREATE POLICY "table_name_select_member"
  ON table_name
  FOR SELECT
  TO authenticated
  USING (
    (SELECT private.has_blueprint_access(blueprint_id))
    AND deleted_at IS NULL
  );

-- INSERT: 藍圖成員可新增
CREATE POLICY "table_name_insert_member"
  ON table_name
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT private.can_write_blueprint(blueprint_id))
  );

-- UPDATE: 建立者或管理者可更新
CREATE POLICY "table_name_update_owner"
  ON table_name
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
    AND deleted_at IS NULL
  );

-- DELETE: 建立者或管理者可刪除
CREATE POLICY "table_name_delete_owner"
  ON table_name
  FOR DELETE
  TO authenticated
  USING (
    (SELECT private.can_write_blueprint(blueprint_id))
  );

-- ============================================================================
-- 5. Triggers (觸發器)
-- ============================================================================

-- updated_at 自動更新
CREATE TRIGGER table_name_updated_at_trigger
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION private.update_updated_at();

-- ============================================================================
-- 6. Comments (文件註解)
-- ============================================================================

COMMENT ON TABLE table_name IS '表描述';
COMMENT ON COLUMN table_name.id IS '主鍵 UUID';
COMMENT ON COLUMN table_name.blueprint_id IS '所屬藍圖 ID';
```

---

## 🎯 設計原則

### 1. 層級依賴原則

```
Core Infrastructure (00xxx)
       ↓
Foundation Layer (01xxx)
       ↓
Container Layer (02xxx)
       ↓
Business Modules (03xxx, 04xxx)
       ↓
Cross-Cutting (05xxx)
       ↓
Storage & Views (06xxx, 07xxx)
```

每個層級只能依賴**同層或更低層**的表和函數。

### 2. 冪等性原則

所有遷移必須是**冪等的**（可重複執行）：

```sql
-- ENUM: 使用 DO block 檢查
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '...') THEN
    CREATE TYPE ...
  END IF;
END $$;

-- TABLE: 使用 IF NOT EXISTS
CREATE TABLE IF NOT EXISTS ...

-- INDEX: 使用 IF NOT EXISTS
CREATE INDEX IF NOT EXISTS ...

-- POLICY: 先刪除再建立
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ...

-- FUNCTION: 使用 CREATE OR REPLACE
CREATE OR REPLACE FUNCTION ...
```

### 3. RLS 設計原則

1. **使用 Helper 函數**：避免 RLS 遞迴
2. **SECURITY DEFINER**：Helper 函數必須使用
3. **效能優化**：使用 `(SELECT ...)` 包裝子查詢
4. **TO authenticated**：明確指定角色

```sql
-- 正確的 RLS 政策格式
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  TO authenticated  -- 明確指定
  USING (
    (SELECT private.has_blueprint_access(blueprint_id))  -- 使用 Helper
    AND deleted_at IS NULL
  );
```

### 4. 索引設計原則

1. **主查詢欄位**：`blueprint_id`, `status`, `created_at`
2. **外鍵欄位**：所有 `_id` 結尾的欄位
3. **常用過濾**：`WHERE deleted_at IS NULL`
4. **複合索引**：常見查詢組合

---

## 🚀 遷移工作流程

### 開發環境

```bash
# 1. 建立新遷移
npx supabase migration new <migration_name>

# 2. 編寫遷移 SQL (遵循上述結構)

# 3. 本地測試
npx supabase db reset

# 4. 檢查差異
npx supabase db diff
```

### 部署流程

```bash
# 1. 連接遠端專案
npx supabase link --project-ref <project-ref>

# 2. 推送遷移
npx supabase db push

# 3. 驗證
npx supabase migration list
```

---

## 📚 相關文件

- [Supabase 整合 README](../README.md)
- [RLS 政策設計](../rls/README.md)
- [Schema 設計規範](../schema/README.md)
- [函數設計規範](../functions/README.md)
- [遷移操作指南](../../supabase/MIGRATION_GUIDE.md)

---

## 📝 附錄：現有遷移檔案對照

| 現有檔案 | 建議重新命名 | 層級 |
|---------|-------------|------|
| 20241203000000_create_search_history.sql | 05001_search_history.sql | Cross-Cutting |
| 20241203100000_create_audit_logs.sql | 05000_audit_logs.sql | Cross-Cutting |
| 20241203100001_create_diaries.sql | 03100_business_diaries.sql | Business |
| 20241203100002_create_qc_acceptance_problem.sql | 04000_qc_inspections.sql + 04100_acceptance_records.sql + 04200_problem_reports.sql | Extended |

---

**最後更新**: 2025-12-03  
**維護者**: 開發團隊

# Supabase Backup Files

此目錄包含原始 SQL 備份檔案，用於參考和歷史記錄。

## 檔案狀態

### 已整合至 migrations 目錄

以下備份檔案的內容已完整整合至 `migrations/` 目錄中的對應遷移檔案：

| 備份檔案 | 已整合至遷移檔案 | 狀態 |
|---------|-----------------|------|
| `20241203000000_create_search_history.sql` | `migrations/20241203000000_create_search_history.sql` | ✅ 已整合 |
| `20241203100000_create_audit_logs.sql` | `migrations/20241203100000_create_audit_logs.sql` | ✅ 已整合 |
| `20241203100002_create_qc_acceptance_problem.sql` | `migrations/20241203100002_create_qc_acceptance_problem.sql` | ✅ 已整合 |
| `migrations_audit_logs.sql` | `migrations/20241203100000_create_audit_logs.sql` | ✅ 已整合 |
| `migrations_search_history.sql` | `migrations/20241203000000_create_search_history.sql` | ✅ 已整合 |

### 已合併的模組遷移

以下備份檔案的內容已合併至單一遷移檔案：

| 備份檔案 | 合併至 | 狀態 |
|---------|-------|------|
| `migrations_qc_inspections.sql` | `migrations/20241203100002_create_qc_acceptance_problem.sql` | ✅ 已合併 |
| `migrations_acceptances.sql` | `migrations/20241203100002_create_qc_acceptance_problem.sql` | ✅ 已合併 |
| `migrations_problems.sql` | `migrations/20241203100002_create_qc_acceptance_problem.sql` | ✅ 已合併 |

### 日誌模組整合

`migrations_diaries.sql` 的內容已分解整合至：

| 內容 | 遷移檔案 | 狀態 |
|-----|---------|------|
| `diary_status` enum | `migrations/20241201000003_create_custom_types.sql` | ✅ 已整合 |
| `diaries` 表 | `migrations/20241201000302_create_table_diaries.sql` | ✅ 已整合 |
| `diary_attachments` 表 | `migrations/20241201000303_create_table_diary_attachments.sql` | ✅ 已整合 |
| `diary_entries` 表 + `work_item_type` enum | `migrations/20241201000311_create_table_diary_entries.sql` | ✅ 已整合 |
| RLS Policies | 各自的遷移檔案中 | ✅ 已整合 |

### 主備份檔案整合 (migrations.sql - 3862行)

`migrations.sql` 是原始合併的完整種子檔案，包含所有基礎架構。已逐一比對並整合至對應遷移檔案：

| 內容模組 | 遷移檔案 | 狀態 |
|---------|---------|------|
| **PART 1-2: Extensions & Schemas** | `20241201000001_create_extensions.sql`, `20241201000002_create_schemas.sql` | ✅ 已整合 |
| **PART 3: Enums (15 types)** | `20241201000003_create_custom_types.sql` | ✅ 已整合 |
| **PART 4: Core Tables** | `20241201000100-104_create_table_*.sql` | ✅ 已整合 |
| - accounts | `20241201000100_create_table_accounts.sql` | ✅ |
| - organizations | `20241201000101_create_table_organizations.sql` | ✅ |
| - organization_members | `20241201000102_create_table_organization_members.sql` | ✅ |
| - teams | `20241201000103_create_table_teams.sql` | ✅ |
| - team_members | `20241201000104_create_table_team_members.sql` | ✅ |
| **PART 5: Blueprint Tables** | `20241201000200-203_create_table_*.sql` | ✅ 已整合 |
| - blueprints | `20241201000200_create_table_blueprints.sql` | ✅ |
| - blueprint_roles | `20241201000201_create_table_blueprint_roles.sql` | ✅ |
| - blueprint_members | `20241201000202_create_table_blueprint_members.sql` | ✅ |
| - blueprint_team_roles | `20241201000203_create_table_blueprint_team_roles.sql` | ✅ |
| **PART 6: Module Tables** | `20241201000300-311_create_table_*.sql` | ✅ 已整合 |
| - tasks, task_attachments | `20241201000300-301_*.sql` | ✅ |
| - diaries, diary_attachments | `20241201000302-303_*.sql` | ✅ |
| - checklists, checklist_items | `20241201000304-305_*.sql` | ✅ |
| - task_acceptances | `20241201000306_*.sql` | ✅ |
| - todos | `20241201000307_*.sql` | ✅ |
| - issues, issue_comments | `20241201000308-309_*.sql` | ✅ |
| - notifications | `20241201000310_*.sql` | ✅ |
| - diary_entries | `20241201000311_*.sql` | ✅ |
| **PART 7: Private Functions** | `20241201000400_create_private_functions.sql` | ✅ 已整合 |
| - get_user_account_id() | ✅ |
| - is_account_owner() | ✅ |
| - is_organization_member() | ✅ |
| - get_organization_role() | ✅ |
| - is_organization_admin() | ✅ |
| - is_team_member() | ✅ |
| - is_team_leader() | ✅ |
| - is_blueprint_owner() | ✅ |
| - has_blueprint_access() | ✅ |
| - can_write_blueprint() | ✅ |
| - get_blueprint_business_role() | ✅ |
| **PART 8: Utility Triggers** | `20241201000500_create_triggers.sql` | ✅ 已整合 |
| - update_updated_at() | ✅ |
| - 18 table triggers | ✅ |
| **PART 9: RLS Policies** | `20241201000600_create_rls_policies.sql` | ✅ 已整合 |
| **PART 10: Auth Integration** | `20241201000700_create_auth_integration.sql` | ✅ 已整合 |
| - handle_new_user() | ✅ |
| - on_auth_user_created trigger | ✅ |
| **PART 11-12: Organization/Team API** | `20241201000800_create_api_functions.sql` | ✅ 已整合 |
| - create_organization() | ✅ |
| - handle_new_organization() | ✅ |
| - create_team() | ✅ |
| - create_blueprint() | ✅ |
| - handle_new_blueprint() | ✅ |
| **PART 13: Documentation** | `20241201000900_create_documentation_comments.sql` | ✅ 已整合 |
| **PART 14: RBAC Default Roles** | `20241201001000_create_rbac_default_roles.sql` | ✅ 已整合 |
| - create_default_blueprint_roles() | ✅ |
| - handle_new_blueprint_roles() | ✅ |
| **PART 15: Container Infrastructure** | `20241201001100_create_container_infrastructure.sql` | ✅ 已整合 |
| - blueprint_configs | ✅ |
| - activities | ✅ |
| - events, event_subscriptions | ✅ |
| - entity_references | ✅ |
| - custom_field_definitions/values | ✅ |
| - lifecycle_transitions | ✅ |
| - search_index | ✅ |
| - files, file_shares | ✅ |
| - notification_preferences | ✅ |
| - user_permissions view | ✅ |
| - blueprint_members_full view | ✅ |
| - API functions (get_blueprint_context, etc.) | ✅ |
| **Financial Extension** | `20241202104900_add_financial_extension.sql` | ✅ 已整合 |
| - contracts, expenses | ✅ |
| - payment_requests, payments | ✅ |
| - lifecycle triggers | ✅ |
| - get_contract_summary() | ✅ |
| - get_blueprint_financial_summary() | ✅ |

### 原始合併檔案 (僅供參考)

| 檔案 | 行數 | 說明 |
|-----|-----|------|
| `migrations.sql` | 3862 | 原始合併的完整種子檔案。已完整拆分整合至 migrations 目錄。 |

## 遷移完整性比較

| 項目 | backup/migrations.sql | migrations/ 目錄 |
|-----|---------------------|-----------------|
| CREATE TABLE 數量 | 36 | 49 |
| CREATE TYPE 數量 | 24 | 31+ |
| GRANT 數量 | 24 | 27 |
| ENABLE RLS 數量 | 36 | 49 |

**注意：** migrations 目錄包含額外模組：
- QC 品管檢查 (qc_inspections, qc_inspection_items, qc_inspection_attachments)
- 驗收管理 (acceptances, acceptance_approvals, acceptance_attachments)
- 問題追蹤 (problems, problem_actions, problem_comments, problem_attachments)
- 審計日誌 (audit_logs)
- 搜尋歷史 (search_history)

## 注意事項

1. **請勿直接執行備份檔案** - 所有內容已整合至 `migrations/` 目錄
2. **備份檔案僅供參考** - 用於追蹤歷史變更和原始設計
3. **如需修改** - 請更新 `migrations/` 目錄中對應的遷移檔案

## 遷移結構符合 ENTERPRISE_STRUCTURE.md

所有備份內容已按照 `ENTERPRISE_STRUCTURE.md` 規範重新組織：

- 擴展 → `migrations/20241201000001_create_extensions.sql`
- 模式 → `migrations/20241201000002_create_schemas.sql`
- 類型定義 → `migrations/20241201000003_create_custom_types.sql`
- 表格建立 → `migrations/2024120100XXXX_create_table_*.sql`
- 私有函數 → `migrations/20241201000400_create_private_functions.sql`
- 觸發器 → `migrations/20241201000500_create_triggers.sql`
- RLS 策略 → `migrations/20241201000600_create_rls_policies.sql`
- 認證整合 → `migrations/20241201000700_create_auth_integration.sql`
- API 函數 → `migrations/20241201000800_create_api_functions.sql`
- 文檔註解 → `migrations/20241201000900_create_documentation_comments.sql`
- RBAC 預設角色 → `migrations/20241201001000_create_rbac_default_roles.sql`
- 容器基礎設施 → `migrations/20241201001100_create_container_infrastructure.sql`
- 基礎設施文檔 → `migrations/20241201001200_create_infrastructure_documentation.sql`
- 儲存配置 → `migrations/20241201001300_create_storage_configuration.sql`
- 即時配置 → `migrations/20241201001400_create_realtime_configuration.sql`
- 財務擴展 → `migrations/20241202104900_add_financial_extension.sql`
- 搜尋歷史 → `migrations/20241203000000_create_search_history.sql`
- 審計日誌 → `migrations/20241203100000_create_audit_logs.sql`
- QC/驗收/問題 → `migrations/20241203100002_create_qc_acceptance_problem.sql`
- 藍圖創建修復 → `migrations/20241204000000_fix_blueprint_creation.sql`

## 2024-12-04 修復：藍圖創建問題

### 問題描述
藍圖無法建立，但使用 `db-backup/migrations.sql` 時可以建立。

### 根本原因分析
1. **缺失的 RLS 政策**: `blueprints` 表缺少 INSERT RLS 政策
2. **函數差異**: `create_blueprint` RPC 函數與 `db-backup/migrations.sql` 版本有差異
   - 狀態檢查：`status = 'active'` vs `status != 'deleted'`
   - slug 唯一性檢查：缺少 `AND deleted_at IS NULL`
   - `blueprint_members` 插入欄位差異

### 解決方案
新增遷移文件 `20241204000000_fix_blueprint_creation.sql`：
1. 添加 `blueprints_insert` RLS 政策
2. 添加 `teams_insert` RLS 政策
3. 更新 `create_blueprint` 函數以合併兩個版本的優點

## 2024-12-04 修復：業務角色枚舉不匹配

### 問題描述
建立藍圖時出現錯誤：
```
invalid input value for enum public.blueprint_business_role: "site_supervisor"
```

### 根本原因分析
`blueprint_business_role` 枚舉定義不一致：
- **遷移文件** (`20241201000003_create_custom_types.sql`) 已更新為正確的 8 個值
- **RBAC 預設角色** (`20241201001000_create_rbac_default_roles.sql`) 使用：`project_manager`, `site_director`, `site_supervisor`, `worker`, `qa_staff`, `safety_health`, `finance`, `observer`
- **備份文件** (`db-backup/seed.sql`) 使用正確的 8 個值

**問題根因：** 當數據庫中已存在舊版本的 `blueprint_business_role` enum 時，遷移使用的 `EXCEPTION WHEN duplicate_object THEN NULL;` 語法會跳過整個創建過程，導致新的 enum 值無法被添加。

### 解決方案
新增遷移文件 `20241205000000_fix_blueprint_business_role_enum.sql`：
1. 使用 `ALTER TYPE ... ADD VALUE IF NOT EXISTS` 添加可能缺失的 enum 值
2. 驗證所有必要的 enum 值都存在
3. 添加詳細的文檔註解

這個修復遷移會安全地添加以下 enum 值（如果缺失）：
- `project_manager` (專案經理)
- `site_director` (工地主任)
- `site_supervisor` (現場監督)
- `worker` (施工人員)
- `qa_staff` (品管人員)
- `safety_health` (公共安全衛生)
- `finance` (財務)
- `observer` (觀察者)

---

**最後更新：** 2024-12-05

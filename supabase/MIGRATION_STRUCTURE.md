# Supabase 遷移文件 18 分類結構

本文檔定義了 GigHub 專案的資料庫遷移文件分類系統，確保跨類別依賴正確處理，避免 RLS 政策參照不存在欄位的問題。

---

## 📋 目錄

- [分類系統概覽](#分類系統概覽)
- [命名規範](#命名規範)
- [18 分類詳細說明](#18-分類詳細說明)
- [依賴關係圖](#依賴關係圖)
- [RLS 政策安全規則](#rls-政策安全規則)
- [維護指南](#維護指南)

---

## 分類系統概覽

### 核心原則

1. **前綴號控制順序**：使用 2 位數前綴 (01-18) 確保分類間正確順序
2. **編號控制同類順序**：使用 4 位數編號 (0001-9999) 確保同類內依賴順序
3. **RLS 必須後於表**：RLS 政策只能參照已建立的表和欄位
4. **函數必須後於類型**：函數可能依賴自定義類型

### 時間戳格式

```
YYYYMMDD_CC_NNNN_description.sql

- YYYYMMDD: 日期 (如 20241205)
- CC: 分類號 (01-18)
- NNNN: 序號 (0001-9999)
- description: 描述 (snake_case)
```

---

## 命名規範

### 分類前綴對照表

| 前綴 | 分類名稱 | 說明 | 依賴關係 |
|------|---------|------|---------|
| 01 | Extensions | PostgreSQL 擴展 | 無 |
| 02 | Schemas | 命名空間 | 01 |
| 03 | Custom Types | ENUM 和複合類型 | 01, 02 |
| 04 | Foundation Tables | 基礎層表 (accounts) | 01-03 |
| 05 | Organization Tables | 組織層表 | 04 |
| 06 | Blueprint Tables | 藍圖層表 | 04, 05 |
| 07 | Module Tables | 模組層表 | 04-06 |
| 08 | Private Functions | RLS 輔助函數 | 04-07 |
| 09 | Triggers | 觸發器函數和觸發器 | 04-08 |
| 10 | RLS Policies | 行級安全政策 | 04-09 |
| 11 | Auth Integration | 認證整合 | 04-10 |
| 12 | API Functions | 公開 RPC 函數 | 04-11 |
| 13 | RBAC Configuration | 角色權限配置 | 04-12 |
| 14 | Container Infrastructure | 容器層基礎設施 | 04-13 |
| 15 | Storage Configuration | Supabase 儲存配置 | 01-14 |
| 16 | Realtime Configuration | 即時功能配置 | 01-15 |
| 17 | Business Extensions | 業務擴展模組 | 01-16 |
| 18 | Documentation | 文檔註解 | 01-17 |

---

## 18 分類詳細說明

### 01 - Extensions (PostgreSQL 擴展)

**目的**：啟用必要的 PostgreSQL 擴展

**包含內容**：
- `pg_trgm` - 三字母組文字搜尋
- `uuid-ossp` - UUID 生成
- `pgcrypto` - 加密函數
- 其他必要擴展

**依賴**：無

**範例檔案**：
```
20241205_01_0001_create_extensions.sql
```

---

### 02 - Schemas (命名空間)

**目的**：建立資料庫 Schema

**包含內容**：
- `private` schema - 內部函數
- `extensions` schema - 擴展專用
- 其他必要 schema

**依賴**：01 Extensions

**範例檔案**：
```
20241205_02_0001_create_schemas.sql
```

---

### 03 - Custom Types (自定義類型)

**目的**：建立 ENUM 和複合類型

**包含內容**：
- 帳號類型 (`account_type`, `account_status`)
- 角色類型 (`organization_role`, `team_role`, `blueprint_role`)
- 狀態類型 (`task_status`, `issue_status`, `diary_status`)
- 業務類型 (`blueprint_business_role`, `weather_type`)

**依賴**：02 Schemas

**範例檔案**：
```
20241205_03_0001_create_custom_types.sql
```

**注意**：使用 `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` 處理重複建立

---

### 04 - Foundation Tables (基礎層表)

**目的**：建立基礎層核心表

**包含內容**：
- `accounts` - 帳號表（用戶、組織、機器人）

**依賴**：03 Custom Types

**範例檔案**：
```
20241205_04_0001_create_table_accounts.sql
```

---

### 05 - Organization Tables (組織層表)

**目的**：建立組織管理相關表

**包含內容**：
- `organizations` - 組織表
- `organization_members` - 組織成員表
- `teams` - 團隊表
- `team_members` - 團隊成員表

**依賴**：04 Foundation Tables

**建立順序**：
1. `organizations` (依賴 accounts)
2. `organization_members` (依賴 organizations, accounts)
3. `teams` (依賴 organizations)
4. `team_members` (依賴 teams, accounts)

**範例檔案**：
```
20241205_05_0001_create_table_organizations.sql
20241205_05_0002_create_table_organization_members.sql
20241205_05_0003_create_table_teams.sql
20241205_05_0004_create_table_team_members.sql
```

---

### 06 - Blueprint Tables (藍圖層表)

**目的**：建立藍圖/專案管理相關表

**包含內容**：
- `blueprints` - 藍圖表
- `blueprint_roles` - 藍圖角色定義表
- `blueprint_members` - 藍圖成員表
- `blueprint_team_roles` - 藍圖團隊授權表

**依賴**：04 Foundation, 05 Organization

**建立順序**：
1. `blueprints` (依賴 accounts)
2. `blueprint_roles` (依賴 blueprints)
3. `blueprint_members` (依賴 blueprints, accounts, blueprint_roles)
4. `blueprint_team_roles` (依賴 blueprints, teams)

**範例檔案**：
```
20241205_06_0001_create_table_blueprints.sql
20241205_06_0002_create_table_blueprint_roles.sql
20241205_06_0003_create_table_blueprint_members.sql
20241205_06_0004_create_table_blueprint_team_roles.sql
```

---

### 07 - Module Tables (模組層表)

**目的**：建立業務模組相關表

**包含內容**：
- 任務模組：`tasks`, `task_attachments`, `task_acceptances`
- 日誌模組：`diaries`, `diary_attachments`, `diary_entries`
- 檢查清單：`checklists`, `checklist_items`
- 待辦事項：`todos`
- 問題追蹤：`issues`, `issue_comments`
- 通知：`notifications`

**依賴**：04 Foundation, 06 Blueprint

**建立順序**：先建立主表，再建立附屬表（如 attachments, comments）

**範例檔案**：
```
20241205_07_0001_create_table_tasks.sql
20241205_07_0002_create_table_task_attachments.sql
20241205_07_0003_create_table_diaries.sql
...
```

---

### 08 - Private Functions (私有函數)

**目的**：建立 RLS 輔助函數（SECURITY DEFINER）

**包含內容**：
- `private.get_user_account_id()`
- `private.is_account_owner()`
- `private.is_organization_member()`
- `private.is_organization_admin()`
- `private.is_team_member()`
- `private.is_team_leader()`
- `private.is_blueprint_owner()`
- `private.has_blueprint_access()`
- `private.can_write_blueprint()`
- `private.get_blueprint_business_role()`

**依賴**：04-07 所有表（函數查詢這些表）

**重要**：
- 必須設定 `SET search_path = ''`
- 使用完整表名（如 `public.accounts`）

**範例檔案**：
```
20241205_08_0001_create_private_functions.sql
```

---

### 09 - Triggers (觸發器)

**目的**：建立資料庫觸發器

**包含內容**：
- `update_updated_at()` - 更新時間戳觸發器函數
- 各表的 updated_at 觸發器
- 審計觸發器

**依賴**：04-07 所有表

**範例檔案**：
```
20241205_09_0001_create_triggers.sql
```

---

### 10 - RLS Policies (行級安全政策)

**目的**：建立 Row Level Security 政策

**包含內容**：
- 所有表的 SELECT, INSERT, UPDATE, DELETE 政策
- 使用 `private.*` 輔助函數

**依賴**：
- 04-07 所有表（政策必須建立在已存在的表上）
- 08 Private Functions（政策使用這些函數）

**重要規則**：
1. ⚠️ **政策只能參照已存在的欄位**
2. ⚠️ **如果後續遷移添加新欄位，不要在此分類修改政策**
3. ⚠️ **新欄位的政策更新應在該欄位遷移中同步進行**

**範例檔案**：
```
20241205_10_0001_create_rls_policies_foundation.sql
20241205_10_0002_create_rls_policies_organization.sql
20241205_10_0003_create_rls_policies_blueprint.sql
20241205_10_0004_create_rls_policies_modules.sql
```

---

### 11 - Auth Integration (認證整合)

**目的**：與 Supabase Auth 整合

**包含內容**：
- `handle_new_user()` - 新用戶處理函數
- `on_auth_user_created` - 認證觸發器

**依賴**：04 accounts 表

**範例檔案**：
```
20241205_11_0001_create_auth_integration.sql
```

---

### 12 - API Functions (API 函數)

**目的**：建立公開 RPC 函數

**包含內容**：
- `create_organization()` - 建立組織
- `create_team()` - 建立團隊
- `create_blueprint()` - 建立藍圖
- 其他業務 API 函數

**依賴**：04-11 所有

**範例檔案**：
```
20241205_12_0001_create_api_functions.sql
```

---

### 13 - RBAC Configuration (RBAC 配置)

**目的**：建立預設角色和權限

**包含內容**：
- `create_default_blueprint_roles()` - 建立預設藍圖角色
- `handle_new_blueprint_roles()` - 新藍圖角色觸發器
- 預設權限授予

**依賴**：06 blueprint_roles 表

**範例檔案**：
```
20241205_13_0001_create_rbac_default_roles.sql
```

---

### 14 - Container Infrastructure (容器基礎設施)

**目的**：建立容器層核心基礎設施

**包含內容**：
- 藍圖配置 (`blueprint_configs`)
- 活動時間軸 (`activities`)
- 事件系統 (`events`, `event_subscriptions`)
- 實體引用 (`entity_references`)
- 自定義欄位 (`custom_field_definitions`, `custom_field_values`)
- 生命週期 (`lifecycle_transitions`)
- 搜尋索引 (`search_index`)
- 檔案管理 (`files`, `file_shares`)
- 通知偏好 (`notification_preferences`)
- 視圖 (`user_permissions`, `blueprint_members_full`)

**依賴**：04-13 所有

**範例檔案**：
```
20241205_14_0001_create_container_infrastructure.sql
```

---

### 15 - Storage Configuration (儲存配置)

**目的**：配置 Supabase Storage

**包含內容**：
- Storage buckets 建立
- Storage policies

**依賴**：10 RLS Policies

**範例檔案**：
```
20241205_15_0001_create_storage_configuration.sql
```

---

### 16 - Realtime Configuration (即時配置)

**目的**：配置 Supabase Realtime

**包含內容**：
- Realtime 頻道配置
- Realtime 授權政策

**依賴**：10 RLS Policies

**範例檔案**：
```
20241205_16_0001_create_realtime_configuration.sql
```

---

### 17 - Business Extensions (業務擴展)

**目的**：建立業務擴展模組

**包含內容**：
- 財務模組 (`contracts`, `expenses`, `payment_requests`, `payments`)
- 品管模組 (`qc_inspections`, `qc_inspection_items`, `qc_inspection_attachments`)
- 驗收模組 (`acceptances`, `acceptance_approvals`, `acceptance_attachments`)
- 問題管理 (`problems`, `problem_actions`, `problem_comments`, `problem_attachments`)
- 審計日誌 (`audit_logs`)
- 搜尋歷史 (`search_history`)

**依賴**：04-14 所有

**重要**：每個業務擴展應包含：
1. 類型定義（如需要）
2. 表建立
3. RLS 政策
4. 觸發器
5. API 函數

**範例檔案**：
```
20241205_17_0001_add_financial_extension.sql
20241205_17_0002_create_qc_acceptance_problem.sql
20241205_17_0003_create_audit_logs.sql
20241205_17_0004_create_search_history.sql
```

---

### 18 - Documentation (文檔註解)

**目的**：添加資料庫文檔

**包含內容**：
- 表註解 (`COMMENT ON TABLE`)
- 欄位註解 (`COMMENT ON COLUMN`)
- 函數註解 (`COMMENT ON FUNCTION`)

**依賴**：01-17 所有

**範例檔案**：
```
20241205_18_0001_create_documentation_comments.sql
20241205_18_0002_create_infrastructure_documentation.sql
```

---

## 依賴關係圖

```
                           ┌─────────────────┐
                           │  01 Extensions  │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │   02 Schemas    │
                           └────────┬────────┘
                                    │
                           ┌────────▼────────┐
                           │ 03 Custom Types │
                           └────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
           ┌────────▼────────┐      │               │
           │ 04 Foundation   │      │               │
           │    Tables       │      │               │
           └────────┬────────┘      │               │
                    │               │               │
           ┌────────▼────────┐      │               │
           │ 05 Organization │      │               │
           │    Tables       │      │               │
           └────────┬────────┘      │               │
                    │               │               │
           ┌────────▼────────┐      │               │
           │ 06 Blueprint    │      │               │
           │    Tables       │      │               │
           └────────┬────────┘      │               │
                    │               │               │
           ┌────────▼────────┐      │               │
           │ 07 Module       │      │               │
           │    Tables       │      │               │
           └────────┬────────┘      │               │
                    │               │               │
           ┌────────▼────────┐      │               │
           │ 08 Private      │◄─────┘               │
           │   Functions     │                      │
           └────────┬────────┘                      │
                    │                               │
           ┌────────▼────────┐                      │
           │  09 Triggers    │                      │
           └────────┬────────┘                      │
                    │                               │
           ┌────────▼────────┐                      │
           │ 10 RLS Policies │◄─────────────────────┘
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │ 11 Auth         │
           │  Integration    │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │ 12 API          │
           │   Functions     │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │ 13 RBAC         │
           │  Configuration  │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │ 14 Container    │
           │ Infrastructure  │
           └────────┬────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼───────┐   │   ┌───────▼───────┐
│ 15 Storage    │   │   │ 16 Realtime   │
│ Configuration │   │   │ Configuration │
└───────┬───────┘   │   └───────┬───────┘
        │           │           │
        └───────────┼───────────┘
                    │
           ┌────────▼────────┐
           │ 17 Business     │
           │   Extensions    │
           └────────┬────────┘
                    │
           ┌────────▼────────┐
           │ 18 Documentation│
           └─────────────────┘
```

---

## RLS 政策安全規則

### ⚠️ 關鍵規則

1. **RLS 政策必須在表建立後建立**
   - 確保分類 10 (RLS Policies) 在分類 04-07 (Tables) 之後

2. **政策只能參照已存在的欄位**
   ```sql
   -- ❌ 錯誤：參照尚未建立的欄位
   CREATE POLICY "example" ON tasks
     USING (new_column = true);  -- new_column 還不存在！
   
   -- ✅ 正確：只使用已存在的欄位
   CREATE POLICY "example" ON tasks
     USING (status = 'active');
   ```

3. **新增欄位時同步更新 RLS**
   ```sql
   -- 如果新增欄位需要 RLS 保護，在同一遷移中處理
   
   -- 1. 新增欄位
   ALTER TABLE tasks ADD COLUMN sensitive_data TEXT;
   
   -- 2. 更新 RLS 政策
   DROP POLICY IF EXISTS "tasks_select" ON tasks;
   CREATE POLICY "tasks_select" ON tasks
     FOR SELECT TO authenticated
     USING (
       (SELECT private.has_blueprint_access(blueprint_id))
       AND (sensitive_data IS NULL OR has_sensitive_access())
     );
   ```

4. **使用 `DROP POLICY IF EXISTS` 安全更新**
   ```sql
   -- 安全更新政策模式
   DROP POLICY IF EXISTS "policy_name" ON table_name;
   CREATE POLICY "policy_name" ON table_name ...;
   ```

---

## 維護指南

### 添加新表

1. 確定表屬於哪個分類 (04-07 或 14, 17)
2. 創建遷移檔案，使用正確的分類前綴
3. 在同一遷移中或立即之後添加 RLS 政策
4. 添加觸發器（如需要）
5. 更新文檔

### 修改現有表

1. **添加欄位**：
   - 創建新遷移
   - 如果欄位需要 RLS 保護，在同一遷移更新政策

2. **修改欄位類型**：
   - 檢查是否有 RLS 政策參照該欄位
   - 必要時同步更新政策

3. **刪除欄位**：
   - 先刪除參照該欄位的政策
   - 再刪除欄位

### 添加新業務模組

1. 使用分類 17 (Business Extensions)
2. 在單一遷移檔案中包含：
   - 類型定義
   - 表建立
   - RLS 政策
   - 觸發器
   - API 函數（如需要）
3. 在分類 18 添加文檔

### 備份與回滾

1. 原始遷移備份位置：`db-backup/original-migrations-{date}/`
2. 每次重大更改前創建備份
3. 保持 DOWN (Rollback) 註解更新

---

## 檔案映射參考

### 現有遷移 → 新分類

| 原檔案 | 新分類 | 新編號 |
|--------|--------|--------|
| `20241201000001_create_extensions.sql` | 01 | 0001 |
| `20241201000002_create_schemas.sql` | 02 | 0001 |
| `20241201000003_create_custom_types.sql` | 03 | 0001 |
| `20241201000100_create_table_accounts.sql` | 04 | 0001 |
| `20241201000101_create_table_organizations.sql` | 05 | 0001 |
| `20241201000102_create_table_organization_members.sql` | 05 | 0002 |
| `20241201000103_create_table_teams.sql` | 05 | 0003 |
| `20241201000104_create_table_team_members.sql` | 05 | 0004 |
| `20241201000200_create_table_blueprints.sql` | 06 | 0001 |
| `20241201000201_create_table_blueprint_roles.sql` | 06 | 0002 |
| `20241201000202_create_table_blueprint_members.sql` | 06 | 0003 |
| `20241201000203_create_table_blueprint_team_roles.sql` | 06 | 0004 |
| `20241201000300_create_table_tasks.sql` | 07 | 0001 |
| `20241201000301_create_table_task_attachments.sql` | 07 | 0002 |
| `20241201000302_create_table_diaries.sql` | 07 | 0003 |
| `20241201000303_create_table_diary_attachments.sql` | 07 | 0004 |
| `20241201000304_create_table_checklists.sql` | 07 | 0005 |
| `20241201000305_create_table_checklist_items.sql` | 07 | 0006 |
| `20241201000306_create_table_task_acceptances.sql` | 07 | 0007 |
| `20241201000307_create_table_todos.sql` | 07 | 0008 |
| `20241201000308_create_table_issues.sql` | 07 | 0009 |
| `20241201000309_create_table_issue_comments.sql` | 07 | 0010 |
| `20241201000310_create_table_notifications.sql` | 07 | 0011 |
| `20241201000311_create_table_diary_entries.sql` | 07 | 0012 |
| `20241201000400_create_private_functions.sql` | 08 | 0001 |
| `20241201000500_create_triggers.sql` | 09 | 0001 |
| `20241201000600_create_rls_policies.sql` | 10 | 0001 |
| `20241201000700_create_auth_integration.sql` | 11 | 0001 |
| `20241201000800_create_api_functions.sql` | 12 | 0001 |
| `20241201000900_create_documentation_comments.sql` | 18 | 0001 |
| `20241201001000_create_rbac_default_roles.sql` | 13 | 0001 |
| `20241201001100_create_container_infrastructure.sql` | 14 | 0001 |
| `20241201001200_create_infrastructure_documentation.sql` | 18 | 0002 |
| `20241201001300_create_storage_configuration.sql` | 15 | 0001 |
| `20241201001400_create_realtime_configuration.sql` | 16 | 0001 |
| `20241202104900_add_financial_extension.sql` | 17 | 0001 |
| `20241203000000_create_search_history.sql` | 17 | 0002 |
| `20241203100000_create_audit_logs.sql` | 17 | 0003 |
| `20241203100002_create_qc_acceptance_problem.sql` | 17 | 0004 |
| `20241204000000_fix_blueprint_creation.sql` | 10 | 0002 |
| `20241204100000_create_audit_triggers.sql` | 09 | 0002 |
| `20241204100001_create_task_progress_calculation.sql` | 12 | 0002 |
| `20241204100002_simplify_module_types.sql` | 03 | 0002 |
| `20241205000000_fix_blueprint_business_role_enum.sql` | 03 | 0003 |

---

**版本**：1.0  
**建立日期**：2024-12-04  
**最後更新**：2024-12-04  
**維護者**：開發團隊

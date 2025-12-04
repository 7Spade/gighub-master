# 資料庫遷移架構說明

## 📁 目錄結構

```
supabase/migrations/
├── 00_foundation/           # 基礎設施 (必須最先執行)
│   ├── 001_extensions.sql   # PostgreSQL 擴展
│   ├── 002_schemas.sql      # Schema 定義 (public, private)
│   └── 003_base_types.sql   # 基礎 ENUM 類型
│
├── 01_core/                 # 核心表 (依賴 foundation)
│   ├── 010_accounts.sql     # 帳號表 + 索引
│   ├── 011_organizations.sql
│   ├── 012_organization_members.sql
│   ├── 013_teams.sql
│   └── 014_team_members.sql
│
├── 02_workspace/            # 工作區容器 (依賴 core)
│   ├── 020_blueprints.sql
│   ├── 021_blueprint_roles.sql
│   ├── 022_blueprint_members.sql
│   └── 023_blueprint_team_roles.sql
│
├── 03_modules/              # 業務模組 (依賴 workspace)
│   ├── 030_tasks/tables.sql     # 任務模組
│   ├── 031_diary/tables.sql     # 施工日誌
│   ├── 032_checklists/tables.sql # 檢查清單
│   ├── 033_issues/tables.sql    # 問題追蹤
│   ├── 034_qc/tables.sql        # 品管模組
│   ├── 035_acceptance/tables.sql # 驗收模組
│   └── 036_problems/tables.sql  # 問題管理
│
├── 04_functions/            # RLS 輔助函數 + API 函數
│   └── 040_private_helpers.sql
│
├── 05_policies/             # 集中式 RLS 政策
│   ├── 050_core_policies.sql
│   ├── 051_workspace_policies.sql
│   └── 052_module_policies.sql
│
├── 06_triggers/             # 觸發器
│   └── 060_common_triggers.sql
│
├── 07_seeds/                # 預設資料 (RBAC 角色等)
│   └── 070_rbac_default_roles.sql
│
└── 08_infrastructure/       # Storage, Realtime, Auth 等
    └── 080_auth_integration.sql
```

## 🔄 執行順序

遷移文件必須按照以下順序執行：

1. **00_foundation** → 基礎設施（擴展、Schema、類型）
2. **01_core** → 核心表（帳號、組織、團隊）
3. **02_workspace** → 工作區（藍圖容器及其成員）
4. **03_modules** → 業務模組（任務、日誌、品管等）
5. **04_functions** → RLS 輔助函數
6. **05_policies** → RLS 政策
7. **06_triggers** → 觸發器
8. **07_seeds** → 預設資料
9. **08_infrastructure** → 基礎設施整合

## 📋 命名規則

### 文件命名
- 格式：`{層級編號}{序號}_{描述}.sql`
- 範例：`010_accounts.sql`, `050_core_policies.sql`

### 政策命名
- 格式：`{table}_{operation}_{condition}`
- 範例：`tasks_select`, `blueprints_update`, `qc_inspections_delete`

### 函數命名
- 輔助函數：`private.{function_name}`
- API 函數：`public.{function_name}`

## 🔐 RLS 政策設計原則

### 存取控制層級
1. **藍圖存取** - 使用 `private.has_blueprint_access(blueprint_id)`
2. **藍圖寫入** - 使用 `private.can_write_blueprint(blueprint_id)`
3. **擁有者驗證** - 使用 `private.is_blueprint_owner(blueprint_id)`

### 常用模式
```sql
-- 查看政策：有藍圖存取權即可
CREATE POLICY "table_select" ON table_name
  FOR SELECT TO authenticated
  USING ((SELECT private.has_blueprint_access(blueprint_id)));

-- 寫入政策：需要藍圖寫入權限
CREATE POLICY "table_insert" ON table_name
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.can_write_blueprint(blueprint_id)));

-- 刪除政策：創建者或有寫入權限
CREATE POLICY "table_delete" ON table_name
  FOR DELETE TO authenticated
  USING (
    created_by = (SELECT private.get_user_account_id())
    OR (SELECT private.can_write_blueprint(blueprint_id))
  );
```

## 🚀 新專案部署

在新專案上部署數據庫：

```bash
# 1. 按順序執行遷移
supabase db push

# 2. 或者使用 Supabase MCP 依序應用
# 先應用 00_foundation，然後 01_core，依此類推
```

## ➕ 添加新模組

1. 在 `03_modules/` 下創建新目錄
2. 按照模板創建 `tables.sql`
3. 在 `05_policies/052_module_policies.sql` 中添加對應的 RLS 政策
4. 如需要，在 `06_triggers/` 中添加觸發器

## 📝 備份

原始遷移文件已備份至：`backup/migrations_original/`

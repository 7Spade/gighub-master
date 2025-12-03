# Supabase 企業級資料庫架構規劃文檔

## 📋 目錄
- [專案結構概覽](#專案結構概覽)
- [資料夾組織架構](#資料夾組織架構)
- [核心元件說明](#核心元件說明)
- [檔案命名規範](#檔案命名規範)
- [Migration 開發工作流程](#migration-開發工作流程)
- [命名規範](#命名規範)
- [最佳實踐](#最佳實踐)
- [部署流程](#部署流程)

---

## 專案結構概覽

```
/supabase
├── /migrations                 # 資料庫遷移檔案（版本控制核心）
│   ├── 20240101000000_initial_schema.sql
│   ├── 20240102000000_create_users_table.sql
│   └── 20240103000000_add_rls_policies.sql
│
├── /seed                       # 種子資料（開發/測試用）
│   ├── dev_seed.sql
│   └── test_seed.sql
│
├── /schemas                    # Schema 定義（邏輯分層）
│   ├── /public                 # 公開 schema（預設）
│   │   ├── /tables
│   │   ├── /views
│   │   ├── /materialized_views
│   │   └── /functions
│   ├── /private                # 私有 schema（內部邏輯）
│   │   ├── /tables
│   │   └── /functions
│   └── /auth                   # 認證相關（擴展 auth schema）
│       └── /functions
│
├── /functions                  # Edge Functions（Serverless API）
│   ├── /api
│   └── /webhooks
│
├── /policies                   # RLS 策略定義
│   ├── /users
│   ├── /contracts
│   └── /payments
│
├── /roles                      # 角色與權限設定
│   ├── setup_roles.sql
│   └── grant_permissions.sql
│
├── /triggers                   # 資料庫觸發器
│   ├── audit_triggers.sql
│   └── sync_triggers.sql
│
├── /types                      # 自定義類型
│   └── custom_types.sql
│
└── config.toml                 # Supabase 配置檔
```

---

## 資料夾組織架構

### 1. `/migrations` - 版本控制核心
所有資料庫變更必須透過 migration 進行，確保可追溯性與可復原性。

**命名規範：**
```
{timestamp}_{descriptive_name}.sql
```

**範例：**
```sql
-- 20240101000000_initial_schema.sql
CREATE SCHEMA IF NOT EXISTS private;
CREATE SCHEMA IF NOT EXISTS public;

-- 20240102000000_create_users_table.sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. `/schemas` - 邏輯分層架構

#### `/schemas/public/tables` - 公開資料表
存放核心業務資料，受 RLS 保護。

```sql
-- users.sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- contracts.sql
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- payments.sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `/schemas/public/views` - 檢視表（API Layer）
提供安全的資料存取介面，遮蔽敏感欄位。

```sql
-- contracts_public_view.sql
CREATE OR REPLACE VIEW public.contracts_public_view AS
SELECT 
  id,
  title,
  status,
  created_at
  -- 不暴露 user_id 或其他敏感資訊
FROM public.contracts
WHERE status != 'deleted';

-- 賦予檢視表 RLS 保護
ALTER VIEW public.contracts_public_view SET (security_invoker = true);
```

#### `/schemas/public/materialized_views` - 物化檢視（報表）
預先計算的資料快照，提升查詢效能。

```sql
-- reporting_mv.sql
CREATE MATERIALIZED VIEW public.monthly_revenue_mv AS
SELECT 
  DATE_TRUNC('month', paid_at) AS month,
  COUNT(*) AS payment_count,
  SUM(amount) AS total_revenue
FROM public.payments
GROUP BY DATE_TRUNC('month', paid_at);

-- 建立自動刷新機制
CREATE INDEX ON public.monthly_revenue_mv (month);
```

#### `/schemas/private` - 內部邏輯層
存放不應直接暴露給客戶端的資料與函數。

```sql
-- private/tables/audit_logs.sql
CREATE TABLE private.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3. `/functions` - RPC Functions（API 端點）

#### Public Functions（客戶端可呼叫）
```sql
-- insert_contract.sql
CREATE OR REPLACE FUNCTION public.insert_contract(
  p_title TEXT,
  p_status TEXT DEFAULT 'draft'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- 以定義者權限執行
SET search_path = public
AS $$
DECLARE
  v_contract_id UUID;
BEGIN
  -- RLS 會自動檢查當前使用者權限
  INSERT INTO public.contracts (user_id, title, status)
  VALUES (auth.uid(), p_title, p_status)
  RETURNING id INTO v_contract_id;
  
  RETURN v_contract_id;
END;
$$;

-- 賦予執行權限
GRANT EXECUTE ON FUNCTION public.insert_contract TO authenticated;
```

#### Private Functions（內部使用）
```sql
-- private/calculate_revenue.sql
CREATE OR REPLACE FUNCTION private.calculate_user_revenue(p_user_id UUID)
RETURNS DECIMAL
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(p.amount), 0)
  FROM public.contracts c
  JOIN public.payments p ON p.contract_id = c.id
  WHERE c.user_id = p_user_id;
$$;
```

---

### 4. `/policies` - RLS 策略集中管理

#### 策略組織結構
```
/policies
├── /users
│   ├── select.sql
│   ├── insert.sql
│   └── update.sql
├── /contracts
│   ├── select.sql
│   ├── insert.sql
│   ├── update.sql
│   └── delete.sql
└── /payments
    ├── select.sql
    └── insert.sql
```

#### 範例策略
```sql
-- policies/contracts/select.sql
CREATE POLICY "Users can view own contracts"
ON public.contracts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- policies/contracts/insert.sql
CREATE POLICY "Users can create own contracts"
ON public.contracts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- policies/contracts/update.sql
CREATE POLICY "Users can update own draft contracts"
ON public.contracts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'draft')
WITH CHECK (auth.uid() = user_id);

-- policies/contracts/delete.sql
CREATE POLICY "Users can delete own draft contracts"
ON public.contracts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'draft');
```

#### 管理員權限策略
```sql
-- policies/contracts/admin_all.sql
CREATE POLICY "Admins have full access"
ON public.contracts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

### 5. `/roles` - 角色與權限管理

```sql
-- setup_roles.sql
-- Supabase 預設角色：anon, authenticated, service_role

-- 確保基礎權限設定
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- grant_permissions.sql
-- 匿名角色（未登入）
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.contracts_public_view TO anon;

-- 認證角色（已登入）
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_contract TO authenticated;

-- Service Role（後端服務，繞過 RLS）
-- 預設已有完整權限，無需額外設定
```

---

## 核心元件說明

### 1. Tables（資料表）
**用途：** 實際存放資料的核心結構  
**特性：**
- 必須啟用 RLS（除非有特殊理由）
- 使用 UUID 作為主鍵
- 包含 `created_at` 和 `updated_at` 時間戳

**模板：**
```sql
CREATE TABLE public.{table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 業務欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- 建立更新時間觸發器
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.{table_name}
  FOR EACH ROW
  EXECUTE FUNCTION private.trigger_set_updated_at();
```

### 2. Views（檢視表）
**用途：** 提供安全的資料存取層  
**特性：**
- 唯讀（除非使用 INSTEAD OF 觸發器）
- 可遮蔽敏感欄位
- 支援 RLS（使用 `security_invoker = true`）

### 3. Materialized Views（物化檢視）
**用途：** 報表與統計資料  
**特性：**
- 需定期刷新（REFRESH MATERIALIZED VIEW）
- 適合複雜聚合查詢
- 建議建立索引提升查詢效能

### 4. Functions（RPC）
**用途：** 複雜業務邏輯與資料操作  
**安全模式：**
- `SECURITY DEFINER`: 以函數擁有者權限執行
- `SECURITY INVOKER`: 以呼叫者權限執行（預設）

### 5. Policies（RLS 策略）
**用途：** 細粒度存取控制  
**語法：**
```sql
CREATE POLICY {policy_name}
ON {table_name}
FOR {SELECT|INSERT|UPDATE|DELETE|ALL}
TO {role}
USING ({condition})      -- 查詢條件
WITH CHECK ({condition}); -- 寫入條件
```

### 6. Roles（角色）
**Supabase 預設角色：**
- `anon`: 未認證使用者
- `authenticated`: 已認證使用者
- `service_role`: 後端服務（繞過 RLS）

---

## 檔案命名規範

### Migration 檔案命名

**格式：**
```
{timestamp}_{action}_{target}[_{detail}].sql
```

**命名元素：**
| 元素 | 說明 | 範例 |
|------|------|------|
| timestamp | 14 位時間戳 (YYYYMMDDHHmmss) | `20241203120000` |
| action | 操作動詞 | `create`, `add`, `alter`, `drop`, `update` |
| target | 目標對象類型 | `table`, `view`, `function`, `policy`, `trigger`, `index` |
| detail | 詳細描述 (選填) | `users`, `contracts_status` |

**動作動詞對照表：**
| 動詞 | 使用時機 | 範例 |
|------|---------|------|
| `create` | 新建資料表、View、Function | `create_table_users` |
| `add` | 新增欄位、索引、約束 | `add_column_users_avatar` |
| `alter` | 修改欄位類型或約束 | `alter_column_users_email` |
| `drop` | 刪除資料表、欄位、索引 | `drop_column_users_legacy` |
| `update` | 更新現有函數或策略 | `update_function_calculate_revenue` |
| `enable` | 啟用 RLS 或功能 | `enable_rls_users` |
| `grant` | 授權權限 | `grant_permissions_authenticated` |

**範例：**
```
20241203000000_create_table_accounts.sql
20241203000100_create_table_organizations.sql
20241203000200_create_table_teams.sql
20241203010000_add_column_accounts_avatar.sql
20241203020000_enable_rls_accounts.sql
20241203030000_create_policy_accounts_select.sql
20241203040000_create_function_insert_contract.sql
20241203050000_create_trigger_updated_at.sql
20241203060000_create_index_contracts_status.sql
```

---

### SQL 檔案命名（非 Migration）

**Schema 定義檔案：**
```
/schemas/{schema_name}/{object_type}/{object_name}.sql
```

**範例：**
```
/schemas/public/tables/users.sql
/schemas/public/views/contracts_public_view.sql
/schemas/public/functions/insert_contract.sql
/schemas/private/tables/audit_logs.sql
/schemas/private/functions/calculate_revenue.sql
```

**RLS 策略檔案：**
```
/policies/{table_name}/{operation}.sql
```

**範例：**
```
/policies/contracts/select.sql
/policies/contracts/insert.sql
/policies/contracts/update.sql
/policies/contracts/delete.sql
/policies/contracts/admin_all.sql
```

**Edge Functions 檔案：**
```
/functions/{function_name}/index.ts
/functions/_shared/{shared_module}.ts
```

**命名規則：**
- 使用 **snake_case**（底線連接）
- 使用 **小寫英文字母**
- 使用 **連字符 (-)** 命名 Edge Functions 資料夾
- 使用 **底線前綴 (_)** 表示共享模組

---

## Migration 開發工作流程

### 1. 建立順序（依賴優先）

遵循以下順序建立資料庫物件，確保依賴關係正確：

```
┌─────────────────────────────────────────────────────────────┐
│ 第 1 階段：基礎建設                                          │
├─────────────────────────────────────────────────────────────┤
│ 1.1 Extensions (擴展)                                       │
│     - uuid-ossp, pgcrypto, pg_cron 等                       │
│ 1.2 Schemas (命名空間)                                      │
│     - private, extensions 等                                │
│ 1.3 Custom Types (自定義類型)                               │
│     - ENUM, COMPOSITE 類型                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 第 2 階段：核心資料表（無外鍵依賴）                          │
├─────────────────────────────────────────────────────────────┤
│ 2.1 基礎表                                                  │
│     - accounts（帳戶表）                                    │
│ 2.2 獨立表                                                  │
│     - 不依賴其他表的資料表                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 第 3 階段：關聯資料表（有外鍵依賴）                          │
├─────────────────────────────────────────────────────────────┤
│ 3.1 一級依賴                                                │
│     - organizations (依賴 accounts)                         │
│     - blueprints (依賴 accounts)                            │
│ 3.2 二級依賴                                                │
│     - teams (依賴 organizations)                            │
│     - tasks (依賴 blueprints)                               │
│ 3.3 多級依賴                                                │
│     - organization_members, team_members 等                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 第 4 階段：安全與存取控制                                    │
├─────────────────────────────────────────────────────────────┤
│ 4.1 啟用 RLS                                                │
│     - ALTER TABLE ... ENABLE ROW LEVEL SECURITY             │
│ 4.2 建立 RLS Helper Functions                               │
│     - private.get_user_role(), private.has_permission()     │
│ 4.3 建立 RLS Policies                                       │
│     - SELECT, INSERT, UPDATE, DELETE 策略                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 第 5 階段：業務邏輯                                          │
├─────────────────────────────────────────────────────────────┤
│ 5.1 Views (檢視表)                                          │
│     - 公開檢視、安全檢視                                    │
│ 5.2 Materialized Views (物化檢視)                           │
│     - 報表、統計用                                          │
│ 5.3 Functions (RPC 函數)                                    │
│     - 業務邏輯封裝                                          │
│ 5.4 Triggers (觸發器)                                       │
│     - 自動更新、審計日誌                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 第 6 階段：效能優化                                          │
├─────────────────────────────────────────────────────────────┤
│ 6.1 Indexes (索引)                                          │
│     - 外鍵索引、查詢條件索引、複合索引                      │
│ 6.2 Partitions (分區)                                       │
│     - 大型表分區策略                                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 第 7 階段：權限配置                                          │
├─────────────────────────────────────────────────────────────┤
│ 7.1 Roles (角色設定)                                        │
│     - anon, authenticated, service_role                     │
│ 7.2 Grants (權限授予)                                       │
│     - GRANT USAGE, SELECT, INSERT, UPDATE, DELETE           │
│ 7.3 Function Grants (函數授權)                              │
│     - GRANT EXECUTE ON FUNCTION                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. 單一 Migration 原則

每個 Migration 應遵循單一職責原則：

**✅ 正確做法（一個 Migration 做一件事）：**
```
20241203000000_create_table_accounts.sql       # 只建立 accounts 表
20241203000100_enable_rls_accounts.sql         # 只啟用 accounts 的 RLS
20241203000200_create_policy_accounts_select.sql # 只建立 select 策略
```

**❌ 錯誤做法（一個 Migration 做多件事）：**
```
20241203000000_setup_accounts.sql              # 建表 + RLS + 策略全包
```

### 3. Migration 時間戳間距規劃

**時間戳間距建議：**
| 物件類型 | 間距 | 範例 |
|---------|------|------|
| 同一資料表不同操作 | 100 (1 分鐘) | `000000` → `000100` |
| 不同資料表 | 10000 (100 分鐘) | `000000` → `010000` |
| 不同階段 | 100000 (約 16 小時) | `000000` → `100000` |

**範例時間戳規劃：**
```
# 第 1 階段：基礎建設
20241203000000_create_extensions.sql
20241203000100_create_schema_private.sql
20241203000200_create_types_account.sql

# 第 2 階段：核心表
20241203010000_create_table_accounts.sql
20241203010100_enable_rls_accounts.sql
20241203010200_create_policy_accounts_select.sql

# 第 3 階段：關聯表
20241203020000_create_table_organizations.sql
20241203020100_enable_rls_organizations.sql
20241203020200_create_policy_organizations_select.sql
```

### 4. 開發工作流命令

```bash
# 1. 建立新 Migration
supabase migration new create_table_users

# 2. 應用 Migration 到本地資料庫
supabase migration up

# 3. 重置本地資料庫（重新應用所有 Migration）
supabase db reset

# 4. 查看 Migration 狀態
supabase migration list

# 5. 從現有資料庫拉取結構（用於初始化）
supabase db pull

# 6. 產生結構差異（自動生成 Migration）
supabase db diff -f add_column_users_avatar

# 7. 推送到遠端資料庫（生產環境）
supabase db push

# 8. 推送包含種子資料
supabase db push --include-seed

# 9. 模擬推送（不實際執行）
supabase db push --dry-run

# 10. 合併多個 Migration（整理歷史）
supabase migration squash
```

---

## 命名規範

### 表格命名
- **複數形式：** `users`, `contracts`, `payments`
- **連接表：** `user_roles`, `contract_tags`
- **使用 snake_case：** `organization_members`, `blueprint_team_roles`

### 欄位命名
- **使用 snake_case：** `created_at`, `updated_at`, `user_id`
- **外鍵欄位：** `{referenced_table}_id` (如 `user_id`, `organization_id`)
- **布林欄位：** `is_` 或 `has_` 前綴 (如 `is_active`, `has_permission`)
- **時間欄位：** `_at` 後綴 (如 `created_at`, `deleted_at`)

### 檢視表命名
- **公開檢視：** `{table}_public_view`
- **物化檢視：** `{purpose}_mv`
- **使用 snake_case：** `contracts_public_view`, `monthly_revenue_mv`

### 函數命名
- **動詞開頭：** `insert_contract`, `calculate_revenue`, `get_user_role`
- **命名空間：** `public.{function}`, `private.{function}`
- **Helper 函數：** 放在 `private` schema 中
- **SECURITY DEFINER 函數：** 明確設定 `search_path = ''`

**動詞前綴對照：**
| 前綴 | 用途 | 範例 |
|-----|------|------|
| `get_` | 獲取單一值 | `get_user_role()` |
| `list_` | 獲取列表 | `list_user_organizations()` |
| `insert_` | 插入資料 | `insert_contract()` |
| `update_` | 更新資料 | `update_task_status()` |
| `delete_` | 刪除資料 | `delete_team_member()` |
| `check_` | 檢查權限/狀態 | `check_permission()` |
| `has_` | 布林檢查 | `has_role()` |
| `can_` | 權限檢查 | `can_add_post()` |
| `trigger_` | 觸發器函數 | `trigger_set_updated_at()` |

### 策略命名
- **描述性命名：** `"Users can view own contracts"`
- **格式：** `"{Subject} can {action} {object} [condition]"`
- **避免：** `policy_1`, `select_policy`

**策略命名範例：**
```sql
-- ✅ 好的命名
CREATE POLICY "Users can view own contracts"
CREATE POLICY "Admins have full access to contracts"
CREATE POLICY "Authenticated users can insert own data"
CREATE POLICY "Members can update team within organization"

-- ❌ 避免的命名
CREATE POLICY "policy_1"
CREATE POLICY "select_policy"
CREATE POLICY "p1"
```

### Trigger 命名
- **格式：** `{action}_{target}_{timing}`
- **範例：** `set_updated_at_before_update`, `log_audit_after_insert`

### Index 命名
- **格式：** `idx_{table}_{column(s)}`
- **範例：** `idx_contracts_user_id`, `idx_payments_contract_date`

### Schema 命名
- **public**: 客戶端可存取
- **private**: 內部邏輯（RLS Helper Functions）
- **auth**: 認證擴展
- **extensions**: 擴展相關

---

## 最佳實踐

### 1. RLS 必須啟用
```sql
-- ✅ 正確
CREATE TABLE public.users (...);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ❌ 錯誤（未啟用 RLS）
CREATE TABLE public.users (...);
```

### 2. 使用 `auth.uid()` 取得當前使用者
```sql
-- RLS 策略中（使用 SELECT 包裝以優化效能）
USING ((SELECT auth.uid()) = user_id)

-- Function 中
INSERT INTO contracts (user_id, ...) VALUES (auth.uid(), ...);
```

### 3. 使用 SELECT 包裝函數呼叫優化 RLS 效能

**原理：** 將 `auth.uid()` 或 Security Definer 函數包裝在 `SELECT` 中，可讓 PostgreSQL 優化器只執行一次，而非每行都執行。

```sql
-- ❌ 未優化（每行執行一次 auth.uid()）
CREATE POLICY "rls_test_select" ON test_table
TO authenticated
USING (auth.uid() = user_id);

-- ✅ 優化（只執行一次 auth.uid()）
CREATE POLICY "rls_test_select" ON test_table
TO authenticated
USING ((SELECT auth.uid()) = user_id);
```

### 4. 使用 Security Definer Helper Functions 繞過 RLS 遞迴

**問題：** RLS 策略中查詢其他受 RLS 保護的表會造成遞迴問題。

**解決方案：** 使用 `SECURITY DEFINER` 函數，並放在 `private` schema。

```sql
-- 建立 private schema
CREATE SCHEMA IF NOT EXISTS private;

-- 建立 Helper Function（繞過 RLS）
CREATE OR REPLACE FUNCTION private.get_user_org_role(org_id BIGINT, user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.org_members
  WHERE org_id = $1 AND user_id = $2;
$$;

-- 在 RLS 策略中使用（使用 SELECT 包裝）
CREATE POLICY "Members can view org data" ON public.organizations
TO authenticated
USING (
  (SELECT private.get_user_org_role(id, auth.uid())) IS NOT NULL
);
```

### 5. 敏感操作使用 Private Schema
```sql
-- ❌ 不要直接暴露
CREATE FUNCTION public.delete_all_users() ...

-- ✅ 放在 private schema
CREATE FUNCTION private.delete_all_users() ...
```

### 6. View 安全設定
```sql
-- 確保 View 繼承 RLS
ALTER VIEW public.contracts_public_view 
SET (security_invoker = true);
```

### 7. 定期刷新 Materialized View
```sql
-- 建立排程任務
SELECT cron.schedule(
  'refresh-monthly-revenue',
  '0 1 * * *', -- 每天凌晨 1 點
  $$REFRESH MATERIALIZED VIEW public.monthly_revenue_mv$$
);
```

### 8. 使用 Triggers 維護資料一致性
```sql
-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION private.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 9. 索引優化
```sql
-- 外鍵索引（必須建立）
CREATE INDEX idx_contracts_user_id ON public.contracts(user_id);

-- 查詢條件索引
CREATE INDEX idx_contracts_status ON public.contracts(status);

-- 複合索引（查詢條件多欄位時）
CREATE INDEX idx_payments_contract_date 
ON public.payments(contract_id, paid_at);
```

### 10. RLS 策略使用正確的 TO 欄位

```sql
-- ❌ 已棄用的寫法
CREATE POLICY "Public profiles are viewable by everyone."
ON profiles FOR SELECT USING (
  auth.role() = 'authenticated' OR auth.role() = 'anon'
);

-- ✅ 推薦寫法
CREATE POLICY "Public profiles are viewable by everyone."
ON profiles FOR SELECT
TO authenticated, anon
USING (true);
```

### 11. 每個操作建立獨立的 RLS 策略

```sql
-- ✅ 正確（每個操作獨立策略）
CREATE POLICY "Users can view own contracts"
ON public.contracts FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own contracts"
ON public.contracts FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own draft contracts"
ON public.contracts FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id AND status = 'draft')
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own draft contracts"
ON public.contracts FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id AND status = 'draft');

-- ❌ 錯誤（不支援多操作）
CREATE POLICY "Users can manage own contracts"
ON public.contracts FOR INSERT, DELETE -- ← 不支援
TO authenticated
...
```

### 12. SECURITY DEFINER 函數必須設定 search_path

```sql
-- ✅ 正確（設定空的 search_path）
CREATE FUNCTION public.insert_contract(p_title TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 使用完整表名 public.contracts
  INSERT INTO public.contracts (user_id, title)
  VALUES (auth.uid(), p_title)
  RETURNING id;
END;
$$;

-- ❌ 錯誤（未設定 search_path，有安全風險）
CREATE FUNCTION public.insert_contract(p_title TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
...
$$;
```

---

## 部署流程

### 本地開發
```bash
# 初始化 Supabase 專案
supabase init

# 啟動本地環境
supabase start

# 建立新 migration
supabase migration new create_users_table

# 應用 migrations
supabase migration up

# 重置本地資料庫（重新應用所有 migration + seed）
supabase db reset

# 查看 migration 狀態
supabase migration list
```

### CI/CD 流程

**GitHub Actions 範例（Staging 環境）：**
```yaml
name: Deploy Migrations to Staging

on:
  push:
    branches:
      - develop
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      SUPABASE_DB_PASSWORD: ${{ secrets.STAGING_DB_PASSWORD }}
      SUPABASE_PROJECT_ID: ${{ secrets.STAGING_PROJECT_ID }}

    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Staging Project
        run: supabase link --project-ref $SUPABASE_PROJECT_ID

      - name: Dry Run (Preview Changes)
        run: supabase db push --dry-run

      - name: Push Migrations
        run: supabase db push
```

**GitHub Actions 範例（Production 環境）：**
```yaml
name: Deploy Migrations to Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      SUPABASE_DB_PASSWORD: ${{ secrets.PRODUCTION_DB_PASSWORD }}
      SUPABASE_PROJECT_ID: ${{ secrets.PRODUCTION_PROJECT_ID }}

    steps:
      - uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Link to Production Project
        run: supabase link --project-ref $SUPABASE_PROJECT_ID

      - name: Push Migrations
        run: supabase db push
```

### Migration 管理原則
1. **永不修改已部署的 migration**
2. **使用新 migration 進行變更**
3. **保持 migration 原子性**（一個 migration 做一件事）
4. **包含 rollback 邏輯**（在註解中說明）

```sql
-- 正確的 migration 範例
-- UP
CREATE TABLE public.users (...);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- DOWN（註解說明如何回滾）
-- DROP TABLE public.users;
```

### 環境管理

**環境對應表：**
| 環境 | 分支 | 用途 |
|-----|------|------|
| Local | - | 本地開發與測試 |
| Staging | `develop` | 整合測試、QA 驗證 |
| Production | `main` | 正式環境 |

**環境切換命令：**
```bash
# 連結 Staging 環境
supabase link --project-ref $STAGING_PROJECT_ID

# 連結 Production 環境
supabase link --project-ref $PRODUCTION_PROJECT_ID

# 查看當前連結狀態
supabase projects list
```

### Migration 修復

當 migration 歷史與實際資料庫狀態不一致時：

```bash
# 標記特定 migration 為已應用
supabase migration repair 20240101120000 --status applied

# 標記特定 migration 為已回滾
supabase migration repair 20240103120000 --status reverted

# 合併多個 migration 為單一檔案（整理歷史）
supabase migration squash

# 合併到特定版本
supabase migration squash --version 20240115120000
```

---

## 安全檢查清單

### RLS 與權限
- [ ] 所有 public schema 表格已啟用 RLS
- [ ] 敏感函數放在 private schema
- [ ] Service role 僅用於後端服務
- [ ] 檢視表使用 `security_invoker = true`
- [ ] 每個操作（SELECT/INSERT/UPDATE/DELETE）有獨立 RLS 策略
- [ ] RLS 策略使用 `(SELECT auth.uid())` 優化效能
- [ ] SECURITY DEFINER 函數設定 `search_path = ''`
- [ ] Helper Functions 放在 private schema 避免 RLS 遞迴

### 資料完整性
- [ ] 外鍵設定 ON DELETE 行為（CASCADE/SET NULL/RESTRICT）
- [ ] 建立適當索引（外鍵索引必須建立）
- [ ] 使用 CHECK 約束驗證資料
- [ ] 使用 UNIQUE 約束避免重複

### 維運與監控
- [ ] 設定備份策略
- [ ] 定期審查權限設定
- [ ] 監控查詢效能
- [ ] 建立審計日誌（audit_logs）

### Migration 管理
- [ ] Migration 檔案命名符合規範
- [ ] 遵循依賴順序建立物件
- [ ] 每個 migration 單一職責
- [ ] 註解包含 rollback 邏輯

---

## 快速參考

### 常用命令速查

| 命令 | 說明 |
|-----|------|
| `supabase start` | 啟動本地環境 |
| `supabase stop` | 停止本地環境 |
| `supabase db reset` | 重置本地資料庫 |
| `supabase migration new {name}` | 建立新 migration |
| `supabase migration up` | 應用 migration |
| `supabase migration list` | 查看 migration 狀態 |
| `supabase db diff -f {name}` | 產生結構差異 |
| `supabase db push` | 推送到遠端 |
| `supabase db push --dry-run` | 模擬推送 |
| `supabase migration squash` | 合併 migrations |

### RLS 策略模板

```sql
-- SELECT 策略
CREATE POLICY "{role} can view {table}"
ON public.{table}
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- INSERT 策略
CREATE POLICY "{role} can create {table}"
ON public.{table}
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- UPDATE 策略
CREATE POLICY "{role} can update {table}"
ON public.{table}
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id AND status = 'draft')
WITH CHECK ((SELECT auth.uid()) = user_id);

-- DELETE 策略
CREATE POLICY "{role} can delete {table}"
ON public.{table}
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id AND status = 'draft');

-- Admin 全權策略
CREATE POLICY "Admins have full access to {table}"
ON public.{table}
FOR ALL
TO authenticated
USING (
  (SELECT private.get_user_role((SELECT auth.uid()))) = 'admin'
);
```

### SECURITY DEFINER 函數模板

```sql
CREATE OR REPLACE FUNCTION private.{function_name}({params})
RETURNS {return_type}
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 使用完整表名（如 public.users）
  RETURN ...;
END;
$$;
```

---

## 參考資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [Supabase CLI 參考](https://supabase.com/docs/reference/cli)
- [PostgreSQL RLS 指南](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS 最佳實踐](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)

---

**版本：** 2.0  
**最後更新：** 2024-12-03  
**維護者：** 開發團隊
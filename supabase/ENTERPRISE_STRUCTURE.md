# Supabase 企業級資料庫架構規劃文檔

## 📋 目錄
- [專案結構概覽](#專案結構概覽)
- [資料夾組織架構](#資料夾組織架構)
- [核心元件說明](#核心元件說明)
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

## 命名規範

### 表格命名
- **複數形式：** `users`, `contracts`, `payments`
- **連接表：** `user_roles`, `contract_tags`

### 檢視表命名
- **公開檢視：** `{table}_public_view`
- **物化檢視：** `{purpose}_mv`

### 函數命名
- **動詞開頭：** `insert_contract`, `calculate_revenue`
- **命名空間：** `public.{function}`, `private.{function}`

### 策略命名
- **描述性命名：** `"Users can view own contracts"`
- **避免：** `policy_1`, `select_policy`

### Schema 命名
- **public**: 客戶端可存取
- **private**: 內部邏輯
- **auth**: 認證擴展

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
-- RLS 策略中
USING (auth.uid() = user_id)

-- Function 中
INSERT INTO contracts (user_id, ...) VALUES (auth.uid(), ...);
```

### 3. 敏感操作使用 Private Schema
```sql
-- ❌ 不要直接暴露
CREATE FUNCTION public.delete_all_users() ...

-- ✅ 放在 private schema
CREATE FUNCTION private.delete_all_users() ...
```

### 4. View 安全設定
```sql
-- 確保 View 繼承 RLS
ALTER VIEW public.contracts_public_view 
SET (security_invoker = true);
```

### 5. 定期刷新 Materialized View
```sql
-- 建立排程任務
SELECT cron.schedule(
  'refresh-monthly-revenue',
  '0 1 * * *', -- 每天凌晨 1 點
  $$REFRESH MATERIALIZED VIEW public.monthly_revenue_mv$$
);
```

### 6. 使用 Triggers 維護資料一致性
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

### 7. 索引優化
```sql
-- 外鍵索引
CREATE INDEX idx_contracts_user_id ON public.contracts(user_id);

-- 查詢條件索引
CREATE INDEX idx_contracts_status ON public.contracts(status);

-- 複合索引
CREATE INDEX idx_payments_contract_date 
ON public.payments(contract_id, paid_at);
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
supabase db reset
```

### CI/CD 流程
```bash
# 1. 驗證 migrations
supabase db lint

# 2. 測試環境部署
supabase db push --db-url $TEST_DB_URL

# 3. 生產環境部署
supabase db push --db-url $PROD_DB_URL

# 4. 驗證 RLS 策略
supabase test db
```

### Migration 管理原則
1. **永不修改已部署的 migration**
2. **使用新 migration 進行變更**
3. **保持 migration 原子性**
4. **包含 rollback 邏輯**

```sql
-- 正確的 migration 範例
-- UP
CREATE TABLE public.users (...);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- DOWN（註解說明如何回滾）
-- DROP TABLE public.users;
```

---

## 安全檢查清單

- [ ] 所有 public schema 表格已啟用 RLS
- [ ] 敏感函數放在 private schema
- [ ] Service role 僅用於後端服務
- [ ] 檢視表使用 `security_invoker = true`
- [ ] 外鍵設定 ON DELETE 行為
- [ ] 建立適當索引
- [ ] 設定備份策略
- [ ] 定期審查權限設定

---

## 參考資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [PostgreSQL RLS 指南](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase CLI 參考](https://supabase.com/docs/reference/cli)

---

**版本：** 1.0  
**最後更新：** 2024-12-03  
**維護者：** 開發團隊
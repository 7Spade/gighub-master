# RLS 政策驗證工作流程

> 確保每張資料表都有適當的 Row Level Security 政策

---

## 🎯 概述

RLS 政策是資料安全的核心機制，此工作流程確保：

1. 所有資料表都啟用 RLS
2. 每張表都有適當的政策
3. 政策邏輯正確無誤
4. 無效能問題或無限遞迴

---

## 📋 檢查清單

### 1. RLS 啟用檢查

```sql
-- 查詢未啟用 RLS 的資料表
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename::text
    FROM pg_policies
    WHERE schemaname = 'public'
  );
```

### 2. 政策完整性檢查

```sql
-- 查詢每張表的政策數量
SELECT 
  t.tablename,
  COUNT(p.policyname) as policy_count,
  STRING_AGG(p.policyname, ', ') as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename::text = p.tablename::text
WHERE t.schemaname = 'public'
GROUP BY t.tablename
ORDER BY policy_count ASC;
```

### 3. 政策類型檢查

```sql
-- 檢查每張表是否有完整的 CRUD 政策
SELECT 
  tablename,
  COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
  COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
  COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
  COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
```

---

## 🔄 驗證腳本

### 自動化檢查腳本

```sql
-- 檔案：supabase/migrations/verify_rls.sql

DO $$
DECLARE
  r RECORD;
  missing_tables TEXT := '';
  missing_policies TEXT := '';
BEGIN
  -- 1. 檢查未啟用 RLS 的表
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_prisma%'
      AND NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = tablename
          AND n.nspname = 'public'
          AND c.relrowsecurity = true
      )
  LOOP
    missing_tables := missing_tables || r.tablename || ', ';
  END LOOP;

  IF missing_tables != '' THEN
    RAISE WARNING '⚠️ 以下資料表未啟用 RLS: %', TRIM(TRAILING ', ' FROM missing_tables);
  ELSE
    RAISE NOTICE '✅ 所有資料表都已啟用 RLS';
  END IF;

  -- 2. 檢查沒有任何政策的表
  FOR r IN
    SELECT t.tablename
    FROM pg_tables t
    WHERE t.schemaname = 'public'
      AND t.tablename NOT LIKE 'pg_%'
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.tablename::text = t.tablename
          AND p.schemaname = 'public'
      )
  LOOP
    missing_policies := missing_policies || r.tablename || ', ';
  END LOOP;

  IF missing_policies != '' THEN
    RAISE WARNING '⚠️ 以下資料表沒有 RLS 政策: %', TRIM(TRAILING ', ' FROM missing_policies);
  ELSE
    RAISE NOTICE '✅ 所有資料表都有 RLS 政策';
  END IF;
END;
$$;
```

### Node.js 驗證腳本

```typescript
// scripts/verify-rls.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

interface RLSCheckResult {
  table: string;
  rlsEnabled: boolean;
  hasSelectPolicy: boolean;
  hasInsertPolicy: boolean;
  hasUpdatePolicy: boolean;
  hasDeletePolicy: boolean;
}

async function verifyRLS(): Promise<void> {
  console.log('🔍 開始驗證 RLS 政策...\n');

  // 取得所有資料表
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_public_tables');

  if (tablesError) {
    console.error('❌ 無法取得資料表列表:', tablesError);
    process.exit(1);
  }

  // 取得所有 RLS 政策
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_rls_policies');

  if (policiesError) {
    console.error('❌ 無法取得 RLS 政策:', policiesError);
    process.exit(1);
  }

  const results: RLSCheckResult[] = [];
  let hasIssues = false;

  for (const table of tables) {
    const tablePolicies = policies.filter(
      (p: any) => p.tablename === table.tablename
    );

    const result: RLSCheckResult = {
      table: table.tablename,
      rlsEnabled: table.rls_enabled,
      hasSelectPolicy: tablePolicies.some((p: any) => p.cmd === 'SELECT'),
      hasInsertPolicy: tablePolicies.some((p: any) => p.cmd === 'INSERT'),
      hasUpdatePolicy: tablePolicies.some((p: any) => p.cmd === 'UPDATE'),
      hasDeletePolicy: tablePolicies.some((p: any) => p.cmd === 'DELETE'),
    };

    results.push(result);

    // 檢查問題
    if (!result.rlsEnabled) {
      console.log(`❌ ${result.table}: RLS 未啟用`);
      hasIssues = true;
    } else if (!result.hasSelectPolicy) {
      console.log(`⚠️ ${result.table}: 缺少 SELECT 政策`);
      hasIssues = true;
    } else {
      console.log(`✅ ${result.table}: OK`);
    }
  }

  console.log('\n📊 總結:');
  console.log(`- 資料表數量: ${results.length}`);
  console.log(`- RLS 啟用: ${results.filter(r => r.rlsEnabled).length}`);
  console.log(`- 完整政策: ${results.filter(r => 
    r.rlsEnabled && r.hasSelectPolicy && r.hasInsertPolicy
  ).length}`);

  if (hasIssues) {
    console.log('\n⚠️ 發現 RLS 問題，請檢查並修復！');
    process.exit(1);
  } else {
    console.log('\n✅ 所有 RLS 檢查通過！');
  }
}

verifyRLS();
```

---

## 🧪 政策測試範本

### 測試腳本結構

```sql
-- 檔案：supabase/tests/rls/{table_name}_rls_test.sql

-- ============================================
-- 資料表：{table_name}
-- 測試：RLS 政策
-- ============================================

-- 準備測試資料
BEGIN;

-- 建立測試用戶
INSERT INTO auth.users (id, email) VALUES
  ('user-1', 'user1@test.com'),
  ('user-2', 'user2@test.com'),
  ('admin-1', 'admin@test.com');

INSERT INTO accounts (id, user_id, type, name) VALUES
  ('account-1', 'user-1', 'USER', 'User 1'),
  ('account-2', 'user-2', 'USER', 'User 2'),
  ('account-3', 'admin-1', 'USER', 'Admin');

-- 建立測試藍圖
INSERT INTO blueprints (id, name, owner_id) VALUES
  ('bp-1', 'Test Blueprint', 'account-1');

-- 建立藍圖成員
INSERT INTO blueprint_members (blueprint_id, account_id, role, status) VALUES
  ('bp-1', 'account-1', 'owner', 'active'),
  ('bp-1', 'account-2', 'member', 'active');

-- 建立測試資料
INSERT INTO {table_name} (id, blueprint_id, created_by, ...) VALUES
  ('item-1', 'bp-1', 'account-1', ...);

-- ============================================
-- 測試 1: 成員可以查看資料
-- ============================================
SET LOCAL request.jwt.claims = '{"sub": "user-1"}';
SELECT * FROM {table_name} WHERE id = 'item-1';
-- 預期: 返回 1 筆資料

-- ============================================
-- 測試 2: 非成員無法查看資料
-- ============================================
SET LOCAL request.jwt.claims = '{"sub": "non-member"}';
SELECT * FROM {table_name} WHERE id = 'item-1';
-- 預期: 返回 0 筆資料

-- ============================================
-- 測試 3: 成員可以新增資料
-- ============================================
SET LOCAL request.jwt.claims = '{"sub": "user-2"}';
INSERT INTO {table_name} (blueprint_id, created_by, ...) 
VALUES ('bp-1', 'account-2', ...);
-- 預期: 成功

-- ============================================
-- 測試 4: 只能更新自己的資料
-- ============================================
SET LOCAL request.jwt.claims = '{"sub": "user-2"}';
UPDATE {table_name} SET ... WHERE id = 'item-1';
-- 預期: 0 rows affected（因為是 user-1 建立的）

-- 清理
ROLLBACK;
```

---

## 📊 報告範本

### RLS 審核報告

```markdown
# RLS 政策審核報告

**日期**: 2025-11-27
**審核人**: [名稱]

## 總覽

| 指標 | 數值 |
|------|------|
| 資料表總數 | XX |
| RLS 啟用 | XX |
| 完整政策 | XX |
| 需要關注 | XX |

## 詳細結果

| 資料表 | RLS | SELECT | INSERT | UPDATE | DELETE | 備註 |
|--------|-----|--------|--------|--------|--------|------|
| accounts | ✅ | ✅ | ✅ | ✅ | ✅ | |
| blueprints | ✅ | ✅ | ✅ | ✅ | ✅ | |
| tasks | ✅ | ✅ | ✅ | ✅ | ⚠️ | 缺少軟刪除政策 |

## 問題與建議

### 高優先級

1. **tasks 表缺少 DELETE 政策**
   - 風險：可能導致未授權刪除
   - 建議：新增軟刪除政策

### 中優先級

2. **audit_logs 表無 INSERT 政策**
   - 風險：可能無法寫入審計日誌
   - 建議：新增 service_role 專用政策

## 結論

[ ] 通過
[ ] 需要修復後重新審核
```

---

## 📚 參考資源

- [Supabase RLS 文檔](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS 政策 Blueprint](../blueprints/supabase-table.blueprint.md)
- [RLS Agent](../agents/rls-policy.agent.md)

---

**最後更新**: 2025-11-27

# Supabase RLS 政策生成 Agent

> 生成符合專案規範的 Row Level Security 政策

---

## 🎯 Agent 職責

根據資料表設計與權限需求：

1. 生成 RLS 政策 SQL
2. 建立 Helper Functions
3. 設計權限檢查邏輯
4. 避免常見 RLS 陷阱

---

## 🔒 RLS 設計原則

### 核心原則

1. **預設拒絕**：沒有政策 = 無法存取
2. **最小權限**：只授予必要的權限
3. **避免遞迴**：不在 RLS 中查詢受保護的表
4. **使用 Helper**：封裝權限邏輯到函數

### 權限層級

```
組織層級 (Organization)
  │
  ├── Owner: 完全控制
  ├── Admin: 管理權限
  └── Member: 一般存取
         │
         ▼
藍圖層級 (Blueprint)
  │
  ├── Owner: 藍圖擁有者
  ├── Admin: 藍圖管理員
  ├── Member: 一般成員
  └── Viewer: 唯讀
```

---

## 📋 Helper Functions

### 必要的 Helper Functions

```sql
-- 1. 取得當前用戶的 account_id
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM accounts 
  WHERE user_id = auth.uid() 
  LIMIT 1
$$;

-- 2. 檢查是否為組織成員
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND account_id = get_user_account_id()
    AND status = 'active'
  )
$$;

-- 3. 檢查是否為組織管理員
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND account_id = get_user_account_id()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
$$;

-- 4. 檢查是否為藍圖成員
CREATE OR REPLACE FUNCTION is_blueprint_member(bp_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blueprint_members
    WHERE blueprint_id = bp_id
    AND account_id = get_user_account_id()
    AND status = 'active'
  )
$$;

-- 5. 檢查藍圖角色
CREATE OR REPLACE FUNCTION get_blueprint_role(bp_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM blueprint_members
  WHERE blueprint_id = bp_id
  AND account_id = get_user_account_id()
  AND status = 'active'
  LIMIT 1
$$;

-- 6. 檢查是否為藍圖管理員
CREATE OR REPLACE FUNCTION is_blueprint_admin(bp_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT get_blueprint_role(bp_id) IN ('owner', 'admin')
$$;
```

---

## 🔍 政策生成流程

### 步驟 1：確定表的歸屬

```
問題：這張表屬於哪個層級？

□ 基礎層：accounts, organization_members, teams...
  └── 權限基於組織成員關係

□ 容器層：blueprints, blueprint_members...
  └── 權限基於藍圖擁有者或組織

□ 業務層：tasks, diaries, files...
  └── 權限基於藍圖成員關係
```

### 步驟 2：定義權限矩陣

```
| 角色 | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ⚠️ 限制 |
| Member | ✅ | ✅ | ⚠️ 自己的 | ❌ |
| Viewer | ✅ | ❌ | ❌ | ❌ |
```

### 步驟 3：生成 RLS SQL

---

## 💡 使用方式

### Prompt 範例

```
@agent RLS 政策

請為 `task_comments` 表生成 RLS 政策：

表結構：
- id UUID PRIMARY KEY
- task_id UUID REFERENCES tasks(id)
- author_id UUID REFERENCES accounts(id)
- content TEXT
- created_at TIMESTAMPTZ

權限需求：
- 藍圖成員可查看所有評論
- 成員可新增評論
- 只能編輯自己的評論
- 只能刪除自己的評論（或管理員可刪除所有）
```

### 輸出範例

```markdown
## RLS 政策：task_comments

### 1. 啟用 RLS

```sql
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
```

### 2. SELECT 政策

```sql
-- 藍圖成員可查看所有評論
CREATE POLICY "task_comments_select_policy"
ON task_comments
FOR SELECT
USING (
  task_id IN (
    SELECT t.id FROM tasks t
    WHERE is_blueprint_member(t.blueprint_id)
  )
);
```

### 3. INSERT 政策

```sql
-- 藍圖成員可新增評論
CREATE POLICY "task_comments_insert_policy"
ON task_comments
FOR INSERT
WITH CHECK (
  -- 確認 author_id 是當前用戶
  author_id = get_user_account_id()
  AND
  -- 確認是藍圖成員
  task_id IN (
    SELECT t.id FROM tasks t
    WHERE is_blueprint_member(t.blueprint_id)
  )
);
```

### 4. UPDATE 政策

```sql
-- 只能編輯自己的評論
CREATE POLICY "task_comments_update_policy"
ON task_comments
FOR UPDATE
USING (author_id = get_user_account_id())
WITH CHECK (author_id = get_user_account_id());
```

### 5. DELETE 政策

```sql
-- 作者或藍圖管理員可刪除
CREATE POLICY "task_comments_delete_policy"
ON task_comments
FOR DELETE
USING (
  author_id = get_user_account_id()
  OR
  task_id IN (
    SELECT t.id FROM tasks t
    WHERE is_blueprint_admin(t.blueprint_id)
  )
);
```

### 6. 測試腳本

```sql
-- 測試 1：成員可查看評論
SET LOCAL request.jwt.claims = '{"sub": "user-uuid-1"}';
SELECT * FROM task_comments WHERE task_id = 'task-uuid-1';
-- 預期：返回結果

-- 測試 2：非成員無法查看
SET LOCAL request.jwt.claims = '{"sub": "non-member-uuid"}';
SELECT * FROM task_comments WHERE task_id = 'task-uuid-1';
-- 預期：無結果

-- 測試 3：只能編輯自己的評論
SET LOCAL request.jwt.claims = '{"sub": "user-uuid-1"}';
UPDATE task_comments SET content = 'updated' WHERE author_id != get_user_account_id();
-- 預期：0 rows affected
```
```

---

## ⚠️ 常見陷阱

### 陷阱 1：無限遞迴

```sql
-- ❌ 錯誤：在 accounts 的 RLS 中查詢 organization_members
CREATE POLICY "..." ON accounts
USING (id IN (SELECT account_id FROM organization_members));
-- organization_members 的 RLS 可能又查 accounts，導致無限遞迴

-- ✅ 正確：使用 SECURITY DEFINER 函數
CREATE POLICY "..." ON accounts
USING (is_org_member(owner_id));
```

### 陷阱 2：忘記 WITH CHECK

```sql
-- ❌ 錯誤：INSERT/UPDATE 沒有 WITH CHECK
CREATE POLICY "..." ON tasks
FOR INSERT
USING (is_blueprint_member(blueprint_id));
-- USING 只在 SELECT 時生效

-- ✅ 正確：使用 WITH CHECK
CREATE POLICY "..." ON tasks
FOR INSERT
WITH CHECK (is_blueprint_member(blueprint_id));
```

### 陷阱 3：效能問題

```sql
-- ❌ 效能差：子查詢沒有索引
CREATE POLICY "..." ON tasks
USING (blueprint_id IN (SELECT ...複雜查詢...));

-- ✅ 改善：確保有適當的索引
CREATE INDEX idx_blueprint_members_account 
ON blueprint_members(account_id, blueprint_id);
```

---

## 📚 參考資源

- [Supabase RLS 文檔](https://supabase.com/docs/guides/auth/row-level-security)
- [RLS 政策參考](../../../docs/supabase/rls-policies.md)
- [資料模型](../../../docs/reference/data-model.md)

---

**最後更新**: 2025-11-27

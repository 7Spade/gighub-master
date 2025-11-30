# 權限配置問題分析報告

## 📋 執行摘要

本報告分析了 `supabase/seeds/init.sql` 中的 SECURITY DEFINER 函數和相關 RLS 策略，發現了幾個潛在的權限安全問題。

## ✅ 正確配置的部分

### 1. SECURITY DEFINER 函數設計
以下函數的設計是正確的：
- ✅ `create_organization()` - 正確檢查用戶認證和帳號存在性
- ✅ `create_team()` - 正確檢查組織管理員權限
- ✅ `create_blueprint()` - 正確檢查擁有者權限
- ✅ `handle_new_organization()` - 觸發器正確使用 SECURITY DEFINER
- ✅ `handle_new_blueprint()` - 觸發器正確使用 SECURITY DEFINER

## ⚠️ 發現的權限問題

### 問題 1: organizations 表的 INSERT policy 過於寬鬆

**位置**: `supabase/migrations/20251130061712_init_complete_schema.sql:2343-2348`

**當前配置**:
```sql
create policy "organizations_insert"
on "public"."organizations"
as permissive
for insert
to authenticated
with check (true);
```

**問題描述**:
- `with check (true)` 意味著任何已認證的用戶都可以直接插入組織記錄
- 雖然 `create_organization()` 函數有權限檢查，但如果用戶繞過函數直接插入，可以創建組織而不受限制
- 這違反了最小權限原則

**風險等級**: 🔴 **高**

**建議修復**:
```sql
-- 選項 1: 完全禁止直接插入，強制使用函數
-- 移除 organizations_insert policy，只允許通過 create_organization() 函數創建

-- 選項 2: 添加基本檢查（如果必須允許直接插入）
create policy "organizations_insert"
on "public"."organizations"
as permissive
for insert
to authenticated
with check (
  -- 確保 created_by 是當前用戶的 account_id
  created_by = (SELECT private.get_user_account_id())
  -- 或者添加其他必要的檢查
);
```

### 問題 2: tasks 表的 created_by 字段未驗證

**位置**: `supabase/migrations/20251130061712_init_complete_schema.sql:2446-2451`

**當前配置**:
```sql
create policy "tasks_insert"
on "public"."tasks"
as permissive
for insert
to authenticated
with check (( SELECT private.can_write_blueprint(tasks.blueprint_id) AS can_write_blueprint));
```

**問題描述**:
- INSERT policy 只檢查用戶是否有藍圖的寫入權限
- **沒有驗證 `created_by` 字段必須是當前用戶的 account_id**
- 用戶可以偽造任務的創建者，將 `created_by` 設置為其他用戶的 account_id

**風險等級**: 🟡 **中**

**建議修復**:
```sql
create policy "tasks_insert"
on "public"."tasks"
as permissive
for insert
to authenticated
with check (
  (SELECT private.can_write_blueprint(tasks.blueprint_id)) 
  AND created_by = (SELECT private.get_user_account_id())
);
```

### 問題 3: checklists 表的 created_by 字段未驗證

**位置**: `supabase/migrations/20251130061712_init_complete_schema.sql:2089-2094`

**當前配置**:
```sql
create policy "checklists_insert"
on "public"."checklists"
as permissive
for insert
to authenticated
with check (( SELECT private.can_write_blueprint(checklists.blueprint_id) AS can_write_blueprint));
```

**問題描述**:
- 與 tasks 表相同的問題
- 沒有驗證 `created_by` 必須是當前用戶

**風險等級**: 🟡 **中**

**建議修復**:
```sql
create policy "checklists_insert"
on "public"."checklists"
as permissive
for insert
to authenticated
with check (
  (SELECT private.can_write_blueprint(checklists.blueprint_id))
  AND created_by = (SELECT private.get_user_account_id())
);
```

### 問題 4: diaries 表的 created_by 字段未驗證

**位置**: `supabase/migrations/20251130061712_init_complete_schema.sql:2125-2130`

**當前配置**:
```sql
create policy "diaries_insert"
on "public"."diaries"
as permissive
for insert
to authenticated
with check (( SELECT private.can_write_blueprint(diaries.blueprint_id) AS can_write_blueprint));
```

**問題描述**:
- 與 tasks 表相同的問題
- 沒有驗證 `created_by` 必須是當前用戶

**風險等級**: 🟡 **中**

**建議修復**:
```sql
create policy "diaries_insert"
on "public"."diaries"
as permissive
for insert
to authenticated
with check (
  (SELECT private.can_write_blueprint(diaries.blueprint_id))
  AND created_by = (SELECT private.get_user_account_id())
);
```

### 問題 5: issues 表的 reported_by 字段未驗證

**位置**: `supabase/migrations/20251130061712_init_complete_schema.sql:2234-2239`

**當前配置**:
```sql
create policy "issues_insert"
on "public"."issues"
as permissive
for insert
to authenticated
with check (( SELECT private.can_write_blueprint(issues.blueprint_id) AS can_write_blueprint));
```

**問題描述**:
- 與 tasks 表相同的問題
- 沒有驗證 `reported_by` 必須是當前用戶

**風險等級**: 🟡 **中**

**建議修復**:
```sql
create policy "issues_insert"
on "public"."issues"
as permissive
for insert
to authenticated
with check (
  (SELECT private.can_write_blueprint(issues.blueprint_id))
  AND reported_by = (SELECT private.get_user_account_id())
);
```

## 📝 其他建議

### 1. 考慮為任務創建添加 SECURITY DEFINER 函數

雖然當前直接插入的方式可以工作，但為了保持一致性並確保數據完整性，建議創建一個 `create_task()` 函數：

```sql
CREATE OR REPLACE FUNCTION public.create_task(
  p_blueprint_id UUID,
  p_title VARCHAR(500),
  p_description TEXT DEFAULT NULL,
  p_status task_status DEFAULT 'pending',
  p_priority task_priority DEFAULT 'medium',
  -- ... 其他參數
)
RETURNS TABLE (task_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_account_id UUID;
  v_task_id UUID;
BEGIN
  -- 1. 獲取當前用戶的 account_id
  v_user_account_id := private.get_user_account_id();
  IF v_user_account_id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;

  -- 2. 驗證用戶有藍圖寫入權限
  IF NOT private.can_write_blueprint(p_blueprint_id) THEN
    RAISE EXCEPTION 'User does not have write permission for this blueprint';
  END IF;

  -- 3. 創建任務（自動設置 created_by）
  INSERT INTO public.tasks (
    blueprint_id,
    title,
    description,
    status,
    priority,
    created_by
    -- ... 其他字段
  )
  VALUES (
    p_blueprint_id,
    p_title,
    p_description,
    p_status,
    p_priority,
    v_user_account_id
    -- ... 其他值
  )
  RETURNING id INTO v_task_id;

  RETURN QUERY SELECT v_task_id;
END;
$$;
```

### 2. 審計日誌建議

考慮為關鍵操作添加審計日誌，特別是：
- 組織創建
- 團隊創建
- 藍圖創建
- 任務創建/更新

## 🔧 修復優先級

1. **高優先級** (立即修復):
   - 問題 1: organizations 表的 INSERT policy

2. **中優先級** (盡快修復):
   - 問題 2-5: created_by/reported_by 字段驗證

3. **低優先級** (建議改進):
   - 考慮添加 create_task() 函數
   - 添加審計日誌

## 📚 參考資料

- [Supabase RLS 最佳實踐](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL SECURITY DEFINER 函數](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)

---

**報告生成時間**: 2024-11-30
**分析範圍**: `supabase/seeds/init.sql` 和 `supabase/migrations/20251130061712_init_complete_schema.sql`


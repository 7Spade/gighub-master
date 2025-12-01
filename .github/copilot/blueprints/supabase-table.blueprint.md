# Supabase 資料表 Blueprint

> 資料表設計、RLS 政策、Triggers 的標準模板

---

## 📋 資料表設計模板

### 基本表結構

```sql
-- ============================================
-- 表名: {table_name}
-- 說明: {表用途說明}
-- 層級: 基礎層 / 容器層 / 業務層
-- ============================================

CREATE TABLE {table_name} (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 業務欄位
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',

  -- 關聯欄位
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES accounts(id),

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,  -- 軟刪除

  -- 版本控制（樂觀鎖）
  version INTEGER NOT NULL DEFAULT 1,

  -- 約束
  CONSTRAINT {table_name}_status_check CHECK (status IN ('active', 'inactive', 'archived'))
);

-- 索引
CREATE INDEX idx_{table_name}_blueprint_id ON {table_name}(blueprint_id);
CREATE INDEX idx_{table_name}_created_by ON {table_name}(created_by);
CREATE INDEX idx_{table_name}_status ON {table_name}(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_{table_name}_deleted_at ON {table_name}(deleted_at) WHERE deleted_at IS NOT NULL;

-- 註解
COMMENT ON TABLE {table_name} IS '{表用途說明}';
COMMENT ON COLUMN {table_name}.id IS '主鍵 UUID';
COMMENT ON COLUMN {table_name}.status IS '狀態：active, inactive, archived';
COMMENT ON COLUMN {table_name}.deleted_at IS '軟刪除時間戳，NULL 表示未刪除';
```

---

## 🔒 RLS 政策模板

### 啟用 RLS

```sql
-- 啟用 Row Level Security
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- 強制 RLS（包含表擁有者）
ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;
```

### SELECT 政策

```sql
-- 藍圖成員可查看
CREATE POLICY "{table_name}_select_policy"
ON {table_name}
FOR SELECT
USING (
  is_blueprint_member(blueprint_id)
  AND deleted_at IS NULL
);
```

### INSERT 政策

```sql
-- 藍圖成員可新增
CREATE POLICY "{table_name}_insert_policy"
ON {table_name}
FOR INSERT
WITH CHECK (
  is_blueprint_member(blueprint_id)
  AND created_by = get_user_account_id()
);
```

### UPDATE 政策

```sql
-- 建立者或藍圖管理員可更新
CREATE POLICY "{table_name}_update_policy"
ON {table_name}
FOR UPDATE
USING (
  (created_by = get_user_account_id() OR is_blueprint_admin(blueprint_id))
  AND deleted_at IS NULL
)
WITH CHECK (
  created_by = get_user_account_id() OR is_blueprint_admin(blueprint_id)
);
```

### DELETE 政策

```sql
-- 建立者或藍圖管理員可刪除（軟刪除）
CREATE POLICY "{table_name}_delete_policy"
ON {table_name}
FOR DELETE
USING (
  created_by = get_user_account_id() OR is_blueprint_admin(blueprint_id)
);
```

---

## ⚡ Triggers 模板

### 自動更新 updated_at

```sql
-- 更新時間戳記 Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 觸發器
CREATE TRIGGER {table_name}_updated_at_trigger
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 版本號自動遞增（樂觀鎖）

```sql
-- 版本遞增 Function
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 檢查版本是否匹配（樂觀鎖）
  IF OLD.version != NEW.version - 1 THEN
    RAISE EXCEPTION 'Version conflict: expected %, got %', OLD.version + 1, NEW.version;
  END IF;
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

-- 觸發器
CREATE TRIGGER {table_name}_version_trigger
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();
```

### 審計日誌

```sql
-- 審計日誌 Function
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    user_id,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid(),
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 觸發器
CREATE TRIGGER {table_name}_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();
```

---

## 📊 完整範例：tasks 表

```sql
-- ============================================
-- 表名: tasks
-- 說明: 任務管理主表
-- 層級: 業務層
-- ============================================

-- 建立表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本資訊
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  task_type VARCHAR(50) NOT NULL DEFAULT 'task',

  -- 時間資訊
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- 進度
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- 層級關係
  parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  depth INTEGER NOT NULL DEFAULT 0 CHECK (depth >= 0 AND depth <= 10),
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- 關聯
  blueprint_id UUID NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES accounts(id),

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- 版本控制
  version INTEGER NOT NULL DEFAULT 1,

  -- 約束
  CONSTRAINT tasks_status_check CHECK (status IN ('pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'highest')),
  CONSTRAINT tasks_type_check CHECK (task_type IN ('task', 'milestone', 'bug', 'feature', 'improvement'))
);

-- 索引
CREATE INDEX idx_tasks_blueprint_id ON tasks(blueprint_id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE deleted_at IS NULL AND due_date IS NOT NULL;

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_policy" ON tasks
FOR SELECT USING (is_blueprint_member(blueprint_id) AND deleted_at IS NULL);

CREATE POLICY "tasks_insert_policy" ON tasks
FOR INSERT WITH CHECK (is_blueprint_member(blueprint_id) AND created_by = get_user_account_id());

CREATE POLICY "tasks_update_policy" ON tasks
FOR UPDATE
USING ((created_by = get_user_account_id() OR assignee_id = get_user_account_id() OR is_blueprint_admin(blueprint_id)) AND deleted_at IS NULL)
WITH CHECK (created_by = get_user_account_id() OR assignee_id = get_user_account_id() OR is_blueprint_admin(blueprint_id));

CREATE POLICY "tasks_delete_policy" ON tasks
FOR DELETE USING (created_by = get_user_account_id() OR is_blueprint_admin(blueprint_id));

-- Triggers
CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 註解
COMMENT ON TABLE tasks IS '任務管理主表';
```

---

## 📚 Helper Functions

```sql
-- 取得當前用戶的 account_id
CREATE OR REPLACE FUNCTION get_user_account_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM accounts WHERE user_id = auth.uid() LIMIT 1
$$;

-- 檢查是否為藍圖成員
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

-- 檢查是否為藍圖管理員
CREATE OR REPLACE FUNCTION is_blueprint_admin(bp_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM blueprint_members
    WHERE blueprint_id = bp_id
    AND account_id = get_user_account_id()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  )
$$;
```

---

**最後更新**: 2025-11-27

# Supabase 遷移指南

本指南說明如何管理 GigHub 專案的 Supabase 資料庫遷移。

## 📋 目錄

1. [快速開始](#快速開始)
2. [遷移目錄結構](#遷移目錄結構)
3. [遷移命令](#遷移命令)
4. [創建新遷移](#創建新遷移)
5. [種子數據管理](#種子數據管理)
6. [最佳實踐](#最佳實踐)
7. [故障排除](#故障排除)

---

## 快速開始

### 安裝 Supabase CLI

```bash
# Windows (使用 Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 或使用 npm
npm install -g supabase

# 或使用 Homebrew (Mac/Linux)
brew install supabase/tap/supabase
```

### 初始化本地環境

```bash
# 在項目根目錄執行
cd gighub-master

# 啟動本地 Supabase
supabase start

# 應用所有遷移
supabase db reset
```

---

## 遷移目錄結構

```
supabase/
├── config.toml              # Supabase 配置
├── MIGRATION_GUIDE.md       # 本指南
├── STRUCTURE.md             # 完整結構說明
│
├── migrations/              # 遷移文件目錄
│   ├── 20241203000000_create_search_history.sql
│   ├── 20241203100000_create_audit_logs.sql
│   ├── 20241203100001_create_diaries.sql
│   └── 20241203100002_create_qc_acceptance_problem.sql
│
└── seeds/                   # 種子數據目錄
    ├── README.md            # 種子數據說明
    ├── seed.sql             # 主種子文件 (基礎架構)
    ├── seed_diaries.sql
    ├── seed_qc_inspections.sql
    ├── seed_acceptances.sql
    ├── seed_problems.sql
    ├── seed_audit_logs.sql
    └── seed_search_history.sql
```

詳細結構說明請參考 [STRUCTURE.md](./STRUCTURE.md)

---

## 遷移命令

### 常用命令

```bash
# 查看遷移狀態
supabase migration list

# 創建新遷移
supabase migration new <migration_name>

# 應用遷移
supabase migration up

# 重置資料庫 (執行所有遷移 + 種子)
supabase db reset

# 檢查語法
supabase db lint

# 生成 TypeScript 類型
supabase gen types typescript --local > src/types/database.ts
```

### 遠程操作

```bash
# 鏈接到遠程項目
supabase link --project-ref your-project-ref

# 推送遷移到遠程
supabase db push

# 拉取遠程 schema
supabase db pull
```

---

## 創建新遷移

### 方法 1: 使用 CLI (推薦)

```bash
# 創建新遷移
supabase migration new add_feature_name

# 這會創建: supabase/migrations/YYYYMMDDHHMMSS_add_feature_name.sql
```

### 方法 2: 手動創建

在 `supabase/migrations/` 目錄下創建文件，命名格式：
```
YYYYMMDDHHMMSS_description.sql
```

### 遷移文件模板

```sql
-- Migration: [簡短描述]
-- Description: [詳細說明]
-- Prerequisites: [依賴遷移]
-- Created: [日期]

-- ============================================================================
-- 1. Enums (如需要)
-- ============================================================================

CREATE TYPE IF NOT EXISTS new_status AS ENUM ('pending', 'active', 'completed');

-- ============================================================================
-- 2. Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status new_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 3. Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_new_table_status ON new_table(status);

-- ============================================================================
-- 4. RLS Policies
-- ============================================================================

ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY new_table_select_policy ON new_table
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 5. Triggers
-- ============================================================================

CREATE TRIGGER trg_new_table_updated_at
  BEFORE UPDATE ON new_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 6. Comments
-- ============================================================================

COMMENT ON TABLE new_table IS '新表說明';
```

---

## 種子數據管理

### 執行順序

種子文件必須按照依賴順序執行：

```bash
# 1. 基礎架構 (必須先執行)
supabase db seed --file seeds/seed.sql

# 2. 業務模組 (按依賴順序)
supabase db seed --file seeds/seed_diaries.sql
supabase db seed --file seeds/seed_qc_inspections.sql
supabase db seed --file seeds/seed_acceptances.sql
supabase db seed --file seeds/seed_problems.sql
supabase db seed --file seeds/seed_audit_logs.sql
supabase db seed --file seeds/seed_search_history.sql
```

### 或使用 db reset

```bash
# 一次執行所有遷移和種子
supabase db reset
```

---

## 最佳實踐

### 1. 冪等性 (Idempotency)

確保遷移可以安全地重複執行：

```sql
-- 好的做法
CREATE TABLE IF NOT EXISTS my_table (...);
CREATE INDEX IF NOT EXISTS idx_name ON my_table(...);
DROP POLICY IF EXISTS policy_name ON my_table;
CREATE POLICY policy_name ON my_table ...;

-- 避免
CREATE TABLE my_table (...);  -- 會失敗如果表已存在
```

### 2. 原子性 (Atomicity)

每個遷移應該是完整的邏輯單元：

```sql
-- 好的做法: 一個遷移包含相關的所有變更
-- 20241203_add_comments_feature.sql
CREATE TABLE comments (...);
CREATE INDEX idx_comments_post_id ON comments(...);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comments_policy ON comments ...;
```

### 3. 依賴順序

確保遷移按正確順序執行：

```sql
-- 錯誤: 外鍵指向不存在的表
CREATE TABLE child (
  parent_id UUID REFERENCES parent(id)  -- parent 表還不存在
);

-- 正確: 先創建父表
CREATE TABLE parent (...);
CREATE TABLE child (
  parent_id UUID REFERENCES parent(id)
);
```

### 4. RLS 政策

使用優化的 RLS 查詢：

```sql
-- 好的做法: 使用 (select auth.uid()) 避免重複計算
CREATE POLICY select_policy ON my_table
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- 避免: 多次調用 auth.uid()
CREATE POLICY select_policy ON my_table
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());  -- 每行都會調用
```

### 5. 索引策略

適當使用索引：

```sql
-- 常用查詢的列
CREATE INDEX idx_table_user_id ON my_table(user_id);

-- 複合索引 (考慮查詢模式)
CREATE INDEX idx_table_user_status ON my_table(user_id, status);

-- 部分索引 (只索引需要的行)
CREATE INDEX idx_active_users ON users(id) WHERE deleted_at IS NULL;
```

---

## 故障排除

### 遷移失敗

```bash
# 查看遷移狀態
supabase migration list

# 查看詳細錯誤
supabase db reset --debug

# 手動修復後重試
supabase migration up
```

### 類型衝突

```sql
-- 如果需要修改 ENUM
-- 1. 創建新類型
CREATE TYPE new_status_v2 AS ENUM ('a', 'b', 'c');

-- 2. 更新列使用新類型
ALTER TABLE my_table 
  ALTER COLUMN status TYPE new_status_v2 
  USING status::text::new_status_v2;

-- 3. 刪除舊類型
DROP TYPE old_status;
```

### 外鍵問題

```sql
-- 如果需要刪除被引用的表
-- 1. 先刪除外鍵約束
ALTER TABLE child DROP CONSTRAINT child_parent_id_fkey;

-- 2. 再刪除表
DROP TABLE parent;
```

### 權限問題

```sql
-- 確保正確授權
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

## 相關文件

- [STRUCTURE.md](./STRUCTURE.md) - 完整結構說明
- [seeds/README.md](./seeds/README.md) - 種子數據說明
- [config.toml](./config.toml) - Supabase 配置

---

*最後更新: 2024-12-03*

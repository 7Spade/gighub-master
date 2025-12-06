# 版本控制檔案空間設計文檔

## 📋 目錄
- [概述](#概述)
- [需求分析](#需求分析)
- [系統架構](#系統架構)
- [資料庫設計](#資料庫設計)
- [Storage Bucket 設計](#storage-bucket-設計)
- [RLS 安全策略](#rls-安全策略)
- [API 設計](#api-設計)
- [版本控制機制](#版本控制機制)
- [實作步驟](#實作步驟)
- [附錄](#附錄)

---

## 概述

### 專案背景

GigHub 工地施工進度追蹤管理系統需要一個帶有版本控制的檔案空間系統，以支援不同層級的檔案管理需求：

| 空間類型 | 說明 | 擁有者 |
|---------|------|--------|
| **個人空間** | 使用者私人檔案儲存 | Account (User) |
| **組織空間** | 組織層級的共享檔案 | Organization |
| **團隊空間** | 團隊協作檔案區 | Team |
| **藍圖空間** | 專案/藍圖相關文件 | Blueprint |

### 技術棧

- **Backend**: Supabase (PostgreSQL + Storage)
- **Frontend**: Angular 20 + ng-alain + ng-zorro-antd
- **認證**: Supabase Auth + @delon/auth
- **版本**: Supabase JS ^2.86.0

---

## 需求分析

### 功能需求

#### FR-001: 多層級空間支援
- 個人空間：每個帳號擁有獨立的私人檔案空間
- 組織空間：組織成員可存取的共享空間
- 團隊空間：團隊成員專用的協作空間
- 藍圖空間：專案相關的文件空間（已存在 `files` 表）

#### FR-002: 版本控制
- 檔案版本歷史記錄
- 版本回溯與恢復
- 版本比較（文字檔案）
- 版本註解

#### FR-003: 檔案管理
- 資料夾結構支援（階層式）
- 檔案上傳（支援可續傳）
- 檔案下載與預覽
- 檔案搜尋
- 檔案分享

#### FR-004: 權限控制
- 基於空間類型的預設權限
- 細粒度檔案/資料夾權限
- 分享連結權限設定
- 到期時間設定

### 非功能需求

#### NFR-001: 效能
- 支援大型檔案上傳（>100MB）使用可續傳協議
- 檔案列表分頁載入
- 版本歷史懶加載

#### NFR-002: 安全性
- Row Level Security (RLS) 保護
- 空間隔離
- 敏感檔案加密選項

#### NFR-003: 可擴展性
- 支援未來新增空間類型
- 配額管理機制
- 外部整合 API

---

## 系統架構

### 整體架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                         Angular Frontend                         │
├─────────────────────────────────────────────────────────────────┤
│  FileSpaceFacade  │  FileVersionFacade  │  FileShareFacade      │
├─────────────────────────────────────────────────────────────────┤
│  FileSpaceService │  FileVersionService │  FileShareService     │
├─────────────────────────────────────────────────────────────────┤
│  FileSpaceRepository  │  FileVersionRepository                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Backend                            │
├──────────────────┬──────────────────┬───────────────────────────┤
│   PostgreSQL     │   Supabase       │   Edge Functions          │
│   (資料表)        │   Storage        │   (進階處理)               │
│                  │   (檔案存儲)      │                           │
│  - file_spaces   │  - personal      │  - zip-extract            │
│  - file_entries  │  - organization  │  - version-diff           │
│  - file_versions │  - team          │  - thumbnail-gen          │
│  - file_shares   │  - blueprint     │                           │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### 空間層級關係

```
Account (帳號)
├── Personal Space (個人空間)
│   └── files, folders
│
├── Organization (組織)
│   ├── Organization Space (組織空間)
│   │   └── files, folders
│   │
│   └── Team (團隊)
│       └── Team Space (團隊空間)
│           └── files, folders
│
└── Blueprint (藍圖) - 可由個人或組織擁有
    └── Blueprint Space (藍圖空間)
        └── files, folders
```

---

## 資料庫設計

### ER 圖

```
file_spaces                    file_entries                   file_versions
┌───────────────────┐         ┌────────────────────┐         ┌────────────────────┐
│ id (PK)           │◄────────│ space_id (FK)      │         │ id (PK)            │
│ space_type        │         │ id (PK)            │◄────────│ file_entry_id (FK) │
│ owner_id (FK)     │         │ parent_id (FK)     │         │ version_number     │
│ name              │         │ name               │         │ storage_key        │
│ description       │         │ type               │         │ size               │
│ storage_bucket    │         │ current_version_id │         │ mime_type          │
│ quota_bytes       │         │ size               │         │ checksum           │
│ used_bytes        │         │ mime_type          │         │ comment            │
│ settings          │         │ status             │         │ created_by         │
│ created_by        │         │ metadata           │         │ created_at         │
│ created_at        │         │ created_by         │         └────────────────────┘
│ updated_at        │         │ created_at         │
│ deleted_at        │         │ updated_at         │
└───────────────────┘         │ deleted_at         │
                              └────────────────────┘
                                      │
                                      ▼
                              file_shares (現有)
                              ┌────────────────────┐
                              │ id (PK)            │
                              │ file_id (FK)       │
                              │ shared_with        │
                              │ permission         │
                              │ shared_by          │
                              │ expires_at         │
                              │ created_at         │
                              └────────────────────┘
```

### 資料表定義

#### 1. file_spaces - 檔案空間表

```sql
-- ============================================================================
-- Table: file_spaces
-- Description: 檔案空間管理 - 統一管理個人/組織/團隊/藍圖的檔案空間
-- ============================================================================

-- 空間類型枚舉
CREATE TYPE file_space_type AS ENUM (
  'personal',      -- 個人空間
  'organization',  -- 組織空間
  'team',          -- 團隊空間
  'blueprint'      -- 藍圖空間
);

CREATE TABLE file_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 空間類型與擁有者
  space_type file_space_type NOT NULL,
  owner_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- 空間資訊
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Storage 配置
  storage_bucket VARCHAR(255) NOT NULL,  -- 對應的 Supabase Storage bucket
  storage_prefix VARCHAR(500),           -- 在 bucket 中的路徑前綴
  
  -- 配額管理
  quota_bytes BIGINT NOT NULL DEFAULT 5368709120,  -- 預設 5GB
  used_bytes BIGINT NOT NULL DEFAULT 0,
  
  -- 空間設定
  settings JSONB DEFAULT '{
    "versioning_enabled": true,
    "max_versions": 10,
    "auto_cleanup": true,
    "allowed_extensions": [],
    "max_file_size": 104857600
  }'::jsonb,
  
  -- 審計欄位
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  -- 約束
  CONSTRAINT unique_owner_space_type UNIQUE (owner_id, space_type)
);

-- 索引
CREATE INDEX idx_file_spaces_owner ON file_spaces(owner_id);
CREATE INDEX idx_file_spaces_type ON file_spaces(space_type);
CREATE INDEX idx_file_spaces_bucket ON file_spaces(storage_bucket);

-- 啟用 RLS
ALTER TABLE file_spaces ENABLE ROW LEVEL SECURITY;
```

#### 2. file_entries - 檔案條目表

```sql
-- ============================================================================
-- Table: file_entries
-- Description: 統一的檔案與資料夾條目管理
-- ============================================================================

-- 條目類型枚舉
CREATE TYPE file_entry_type AS ENUM (
  'file',    -- 檔案
  'folder'   -- 資料夾
);

-- 條目狀態枚舉
CREATE TYPE file_entry_status AS ENUM (
  'active',     -- 正常
  'uploading',  -- 上傳中
  'processing', -- 處理中
  'archived',   -- 已歸檔
  'deleted'     -- 已刪除
);

CREATE TABLE file_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 所屬空間
  space_id UUID NOT NULL REFERENCES file_spaces(id) ON DELETE CASCADE,
  
  -- 階層結構
  parent_id UUID REFERENCES file_entries(id) ON DELETE CASCADE,
  
  -- 條目資訊
  name VARCHAR(500) NOT NULL,
  type file_entry_type NOT NULL DEFAULT 'file',
  path TEXT NOT NULL,  -- 完整路徑，例如 /documents/project/report.pdf
  
  -- 當前版本（針對檔案）
  current_version_id UUID,  -- 將在 file_versions 建立後添加外鍵
  
  -- 檔案資訊（針對檔案類型）
  size BIGINT NOT NULL DEFAULT 0,
  mime_type VARCHAR(255),
  
  -- 狀態
  status file_entry_status NOT NULL DEFAULT 'active',
  
  -- 擴展元資料
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- 審計欄位
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  -- 約束：同一父目錄下名稱唯一
  CONSTRAINT unique_name_in_parent UNIQUE (space_id, parent_id, name)
);

-- 索引
CREATE INDEX idx_file_entries_space ON file_entries(space_id);
CREATE INDEX idx_file_entries_parent ON file_entries(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_file_entries_path ON file_entries(path);
CREATE INDEX idx_file_entries_type ON file_entries(type);
CREATE INDEX idx_file_entries_status ON file_entries(status);
CREATE INDEX idx_file_entries_name_search ON file_entries USING gin(name gin_trgm_ops);

-- 啟用 RLS
ALTER TABLE file_entries ENABLE ROW LEVEL SECURITY;
```

#### 3. file_versions - 檔案版本表

```sql
-- ============================================================================
-- Table: file_versions
-- Description: 檔案版本歷史管理
-- ============================================================================

CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 所屬檔案
  file_entry_id UUID NOT NULL REFERENCES file_entries(id) ON DELETE CASCADE,
  
  -- 版本資訊
  version_number INTEGER NOT NULL,
  
  -- 儲存資訊
  storage_key TEXT NOT NULL,  -- Supabase Storage 中的物件 key
  size BIGINT NOT NULL,
  mime_type VARCHAR(255),
  
  -- 完整性驗證
  checksum VARCHAR(64),  -- SHA-256 hash
  
  -- 版本註解
  comment TEXT,
  
  -- 版本狀態
  is_current BOOLEAN NOT NULL DEFAULT false,
  
  -- 審計欄位
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 約束：同一檔案的版本號唯一
  CONSTRAINT unique_file_version UNIQUE (file_entry_id, version_number)
);

-- 索引
CREATE INDEX idx_file_versions_entry ON file_versions(file_entry_id);
CREATE INDEX idx_file_versions_current ON file_versions(file_entry_id) WHERE is_current = true;
CREATE INDEX idx_file_versions_created ON file_versions(created_at DESC);

-- 啟用 RLS
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

-- 添加 file_entries 的外鍵約束
ALTER TABLE file_entries
ADD CONSTRAINT fk_current_version
FOREIGN KEY (current_version_id) REFERENCES file_versions(id);
```

#### 4. 更新現有 file_shares 表

```sql
-- ============================================================================
-- Migration: 更新 file_shares 表以支援新的檔案空間系統
-- ============================================================================

-- 添加新欄位
ALTER TABLE file_shares ADD COLUMN IF NOT EXISTS share_type VARCHAR(20) DEFAULT 'file';
ALTER TABLE file_shares ADD COLUMN IF NOT EXISTS file_entry_id UUID REFERENCES file_entries(id) ON DELETE CASCADE;
ALTER TABLE file_shares ADD COLUMN IF NOT EXISTS access_code VARCHAR(32);  -- 分享連結存取碼
ALTER TABLE file_shares ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;  -- 存取次數
ALTER TABLE file_shares ADD COLUMN IF NOT EXISTS max_access_count INTEGER;  -- 最大存取次數限制
ALTER TABLE file_shares ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 索引
CREATE INDEX IF NOT EXISTS idx_file_shares_entry ON file_shares(file_entry_id) WHERE file_entry_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_shares_access_code ON file_shares(access_code) WHERE access_code IS NOT NULL;
```

### 觸發器與函數

```sql
-- ============================================================================
-- Triggers: 自動化邏輯
-- ============================================================================

-- 1. 更新空間使用量
CREATE OR REPLACE FUNCTION private.update_space_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.file_spaces
    SET used_bytes = (
      SELECT COALESCE(SUM(size), 0)
      FROM public.file_entries
      WHERE space_id = NEW.space_id
        AND type = 'file'
        AND deleted_at IS NULL
    )
    WHERE id = NEW.space_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.file_spaces
    SET used_bytes = (
      SELECT COALESCE(SUM(size), 0)
      FROM public.file_entries
      WHERE space_id = OLD.space_id
        AND type = 'file'
        AND deleted_at IS NULL
    )
    WHERE id = OLD.space_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_space_usage
AFTER INSERT OR UPDATE OR DELETE ON file_entries
FOR EACH ROW
EXECUTE FUNCTION private.update_space_usage();

-- 2. 自動設定路徑
CREATE OR REPLACE FUNCTION private.set_file_entry_path()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  parent_path TEXT;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT path INTO parent_path
    FROM public.file_entries
    WHERE id = NEW.parent_id;
    
    NEW.path := parent_path || '/' || NEW.name;
  ELSE
    NEW.path := '/' || NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_file_entry_path
BEFORE INSERT ON file_entries
FOR EACH ROW
EXECUTE FUNCTION private.set_file_entry_path();

-- 3. 版本控制邏輯
CREATE OR REPLACE FUNCTION private.manage_file_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  max_versions INTEGER;
  version_count INTEGER;
  oldest_version_id UUID;
BEGIN
  -- 獲取空間的最大版本設定
  SELECT (settings->>'max_versions')::INTEGER INTO max_versions
  FROM public.file_spaces fs
  JOIN public.file_entries fe ON fe.space_id = fs.id
  WHERE fe.id = NEW.file_entry_id;
  
  max_versions := COALESCE(max_versions, 10);
  
  -- 設定當前版本
  UPDATE public.file_versions
  SET is_current = false
  WHERE file_entry_id = NEW.file_entry_id
    AND id != NEW.id;
  
  NEW.is_current := true;
  
  -- 更新 file_entries 的 current_version_id
  UPDATE public.file_entries
  SET current_version_id = NEW.id,
      size = NEW.size,
      mime_type = NEW.mime_type,
      updated_at = now()
  WHERE id = NEW.file_entry_id;
  
  -- 檢查是否超過最大版本數
  SELECT COUNT(*) INTO version_count
  FROM public.file_versions
  WHERE file_entry_id = NEW.file_entry_id;
  
  -- 如果超過，刪除最舊的版本
  IF version_count > max_versions THEN
    SELECT id INTO oldest_version_id
    FROM public.file_versions
    WHERE file_entry_id = NEW.file_entry_id
      AND is_current = false
    ORDER BY version_number ASC
    LIMIT 1;
    
    DELETE FROM public.file_versions WHERE id = oldest_version_id;
    -- 注意：需要在刪除前清理 Storage 中的檔案
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_manage_file_version
BEFORE INSERT ON file_versions
FOR EACH ROW
EXECUTE FUNCTION private.manage_file_version();
```

---

## Storage Bucket 設計

### Bucket 結構

基於 Supabase Storage 最佳實踐，設計以下 bucket 結構：

```
supabase-storage/
├── personal/           # 個人空間 bucket
│   └── {account_id}/
│       └── {file_path}
│
├── organization/       # 組織空間 bucket
│   └── {organization_account_id}/
│       └── {file_path}
│
├── team/               # 團隊空間 bucket
│   └── {team_id}/
│       └── {file_path}
│
└── blueprint/          # 藍圖空間 bucket (現有)
    └── {blueprint_id}/
        └── {file_path}
```

### Bucket 設定 SQL

```sql
-- ============================================================================
-- Storage Buckets Setup
-- ============================================================================

-- 1. 個人空間 bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'personal',
  'personal',
  false,
  52428800,  -- 50MB per file
  ARRAY['image/*', 'application/pdf', 'text/*', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.*']
);

-- 2. 組織空間 bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization',
  'organization',
  false,
  104857600,  -- 100MB per file
  NULL  -- 允許所有類型
);

-- 3. 團隊空間 bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team',
  'team',
  false,
  104857600,  -- 100MB per file
  NULL
);

-- 4. 藍圖空間 bucket (如果不存在)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blueprint',
  'blueprint',
  false,
  209715200,  -- 200MB per file
  NULL
)
ON CONFLICT (id) DO NOTHING;
```

---

## RLS 安全策略

### file_spaces 表 RLS

```sql
-- ============================================================================
-- RLS Policies: file_spaces
-- ============================================================================

-- 個人空間：只有擁有者可以存取
CREATE POLICY "Users can view own personal space"
ON file_spaces
FOR SELECT
TO authenticated
USING (
  space_type = 'personal'
  AND owner_id = (
    SELECT id FROM accounts 
    WHERE auth_user_id = (SELECT auth.uid())
  )
);

-- 組織空間：組織成員可以存取
CREATE POLICY "Organization members can view org space"
ON file_spaces
FOR SELECT
TO authenticated
USING (
  space_type = 'organization'
  AND owner_id IN (
    SELECT o.account_id
    FROM organizations o
    JOIN organization_members om ON om.organization_id = o.id
    WHERE om.account_id = (
      SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid())
    )
  )
);

-- 團隊空間：團隊成員可以存取
CREATE POLICY "Team members can view team space"
ON file_spaces
FOR SELECT
TO authenticated
USING (
  space_type = 'team'
  AND owner_id IN (
    SELECT t.id
    FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.account_id = (
      SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid())
    )
  )
);

-- 藍圖空間：藍圖成員可以存取
CREATE POLICY "Blueprint members can view blueprint space"
ON file_spaces
FOR SELECT
TO authenticated
USING (
  space_type = 'blueprint'
  AND owner_id IN (
    SELECT b.id
    FROM blueprints b
    LEFT JOIN blueprint_members bm ON bm.blueprint_id = b.id
    WHERE b.owner_id = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
       OR bm.account_id = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
  )
);
```

### file_entries 表 RLS

```sql
-- ============================================================================
-- RLS Policies: file_entries
-- ============================================================================

-- 基於空間權限的存取控制
CREATE POLICY "Users can view file entries in accessible spaces"
ON file_entries
FOR SELECT
TO authenticated
USING (
  space_id IN (
    SELECT id FROM file_spaces
    -- 這會觸發 file_spaces 的 RLS 策略
  )
  AND deleted_at IS NULL
);

-- 插入權限
CREATE POLICY "Users can insert file entries in accessible spaces"
ON file_entries
FOR INSERT
TO authenticated
WITH CHECK (
  space_id IN (
    SELECT id FROM file_spaces
  )
);

-- 更新權限（需要寫入權限）
CREATE POLICY "Users can update own file entries"
ON file_entries
FOR UPDATE
TO authenticated
USING (
  space_id IN (SELECT id FROM file_spaces)
  AND (
    created_by = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
    OR private.has_space_permission(space_id, 'write')
  )
)
WITH CHECK (
  space_id IN (SELECT id FROM file_spaces)
);

-- 刪除權限
CREATE POLICY "Users can delete own file entries"
ON file_entries
FOR DELETE
TO authenticated
USING (
  space_id IN (SELECT id FROM file_spaces)
  AND (
    created_by = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
    OR private.has_space_permission(space_id, 'admin')
  )
);
```

### Storage RLS 策略

```sql
-- ============================================================================
-- Storage RLS Policies
-- ============================================================================

-- 個人空間存取
CREATE POLICY "Users can access own personal files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'personal'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM accounts WHERE auth_user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'personal'
  AND (storage.foldername(name))[1] = (
    SELECT id::text FROM accounts WHERE auth_user_id = (SELECT auth.uid())
  )
);

-- 組織空間存取
CREATE POLICY "Org members can access org files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'organization'
  AND (storage.foldername(name))[1] IN (
    SELECT o.account_id::text
    FROM organizations o
    JOIN organization_members om ON om.organization_id = o.id
    WHERE om.account_id = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
  )
)
WITH CHECK (
  bucket_id = 'organization'
  AND (storage.foldername(name))[1] IN (
    SELECT o.account_id::text
    FROM organizations o
    JOIN organization_members om ON om.organization_id = o.id
    WHERE om.account_id = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
  )
);

-- 團隊空間存取
CREATE POLICY "Team members can access team files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'team'
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text
    FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.account_id = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
  )
)
WITH CHECK (
  bucket_id = 'team'
  AND (storage.foldername(name))[1] IN (
    SELECT t.id::text
    FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.account_id = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
  )
);

-- 藍圖空間存取
CREATE POLICY "Blueprint members can access blueprint files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'blueprint'
  AND (storage.foldername(name))[1] IN (
    SELECT b.id::text
    FROM blueprints b
    LEFT JOIN blueprint_members bm ON bm.blueprint_id = b.id
    WHERE b.owner_id = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
       OR bm.account_id = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
  )
)
WITH CHECK (
  bucket_id = 'blueprint'
  AND (storage.foldername(name))[1] IN (
    SELECT b.id::text
    FROM blueprints b
    LEFT JOIN blueprint_members bm ON bm.blueprint_id = b.id
    WHERE b.owner_id = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
       OR bm.account_id = (SELECT id FROM accounts WHERE auth_user_id = (SELECT auth.uid()))
  )
);
```

---

## API 設計

### RPC 函數

```sql
-- ============================================================================
-- API Functions
-- ============================================================================

-- 1. 創建或獲取個人空間
CREATE OR REPLACE FUNCTION public.get_or_create_personal_space()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_account_id UUID;
  v_space_id UUID;
BEGIN
  -- 獲取當前使用者的 account_id
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE auth_user_id = auth.uid();
  
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  
  -- 嘗試獲取現有空間
  SELECT id INTO v_space_id
  FROM public.file_spaces
  WHERE owner_id = v_account_id
    AND space_type = 'personal';
  
  -- 如果不存在，創建新空間
  IF v_space_id IS NULL THEN
    INSERT INTO public.file_spaces (
      space_type, owner_id, name, storage_bucket, storage_prefix, created_by
    )
    VALUES (
      'personal', v_account_id, 'My Files', 'personal', v_account_id::text, v_account_id
    )
    RETURNING id INTO v_space_id;
  END IF;
  
  RETURN v_space_id;
END;
$$;

-- 2. 上傳檔案並創建版本
CREATE OR REPLACE FUNCTION public.upload_file_with_version(
  p_space_id UUID,
  p_parent_id UUID,
  p_name VARCHAR(500),
  p_storage_key TEXT,
  p_size BIGINT,
  p_mime_type VARCHAR(255),
  p_checksum VARCHAR(64) DEFAULT NULL,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_account_id UUID;
  v_entry_id UUID;
  v_version_id UUID;
  v_version_number INTEGER;
  v_existing_entry_id UUID;
BEGIN
  -- 獲取當前使用者
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE auth_user_id = auth.uid();
  
  -- 檢查是否已存在同名檔案
  SELECT id INTO v_existing_entry_id
  FROM public.file_entries
  WHERE space_id = p_space_id
    AND COALESCE(parent_id, '00000000-0000-0000-0000-000000000000') = 
        COALESCE(p_parent_id, '00000000-0000-0000-0000-000000000000')
    AND name = p_name
    AND type = 'file'
    AND deleted_at IS NULL;
  
  IF v_existing_entry_id IS NOT NULL THEN
    -- 存在：創建新版本
    v_entry_id := v_existing_entry_id;
    
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM public.file_versions
    WHERE file_entry_id = v_entry_id;
  ELSE
    -- 不存在：創建新條目
    INSERT INTO public.file_entries (
      space_id, parent_id, name, type, size, mime_type, status, created_by
    )
    VALUES (
      p_space_id, p_parent_id, p_name, 'file', p_size, p_mime_type, 'active', v_account_id
    )
    RETURNING id INTO v_entry_id;
    
    v_version_number := 1;
  END IF;
  
  -- 創建版本記錄
  INSERT INTO public.file_versions (
    file_entry_id, version_number, storage_key, size, mime_type, checksum, comment, created_by
  )
  VALUES (
    v_entry_id, v_version_number, p_storage_key, p_size, p_mime_type, p_checksum, p_comment, v_account_id
  )
  RETURNING id INTO v_version_id;
  
  RETURN jsonb_build_object(
    'entry_id', v_entry_id,
    'version_id', v_version_id,
    'version_number', v_version_number,
    'is_new', v_existing_entry_id IS NULL
  );
END;
$$;

-- 3. 創建資料夾
CREATE OR REPLACE FUNCTION public.create_folder(
  p_space_id UUID,
  p_parent_id UUID,
  p_name VARCHAR(500)
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_account_id UUID;
  v_folder_id UUID;
BEGIN
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE auth_user_id = auth.uid();
  
  INSERT INTO public.file_entries (
    space_id, parent_id, name, type, status, created_by
  )
  VALUES (
    p_space_id, p_parent_id, p_name, 'folder', 'active', v_account_id
  )
  RETURNING id INTO v_folder_id;
  
  RETURN v_folder_id;
END;
$$;

-- 4. 獲取檔案版本歷史
CREATE OR REPLACE FUNCTION public.get_file_versions(p_entry_id UUID)
RETURNS TABLE (
  id UUID,
  version_number INTEGER,
  size BIGINT,
  mime_type VARCHAR(255),
  checksum VARCHAR(64),
  comment TEXT,
  is_current BOOLEAN,
  created_by UUID,
  created_by_name VARCHAR(255),
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  SELECT 
    fv.id,
    fv.version_number,
    fv.size,
    fv.mime_type,
    fv.checksum,
    fv.comment,
    fv.is_current,
    fv.created_by,
    a.name as created_by_name,
    fv.created_at
  FROM file_versions fv
  LEFT JOIN accounts a ON a.id = fv.created_by
  WHERE fv.file_entry_id = p_entry_id
  ORDER BY fv.version_number DESC;
$$;

-- 5. 回復到指定版本
CREATE OR REPLACE FUNCTION public.restore_file_version(
  p_entry_id UUID,
  p_version_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_account_id UUID;
  v_version_record RECORD;
  v_new_version_number INTEGER;
  v_new_version_id UUID;
BEGIN
  SELECT id INTO v_account_id
  FROM public.accounts
  WHERE auth_user_id = auth.uid();
  
  -- 獲取要回復的版本
  SELECT * INTO v_version_record
  FROM public.file_versions
  WHERE id = p_version_id
    AND file_entry_id = p_entry_id;
  
  IF v_version_record IS NULL THEN
    RAISE EXCEPTION 'Version not found';
  END IF;
  
  -- 獲取新版本號
  SELECT MAX(version_number) + 1 INTO v_new_version_number
  FROM public.file_versions
  WHERE file_entry_id = p_entry_id;
  
  -- 創建新版本（從舊版本複製）
  INSERT INTO public.file_versions (
    file_entry_id, version_number, storage_key, size, mime_type, checksum, 
    comment, created_by
  )
  VALUES (
    p_entry_id, v_new_version_number, v_version_record.storage_key, 
    v_version_record.size, v_version_record.mime_type, v_version_record.checksum,
    'Restored from version ' || v_version_record.version_number, v_account_id
  )
  RETURNING id INTO v_new_version_id;
  
  RETURN v_new_version_id;
END;
$$;

-- 授權
GRANT EXECUTE ON FUNCTION public.get_or_create_personal_space() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upload_file_with_version(UUID, UUID, VARCHAR, TEXT, BIGINT, VARCHAR, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_folder(UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_file_versions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_file_version(UUID, UUID) TO authenticated;
```

---

## 版本控制機制

### 版本控制流程

```
1. 檔案上傳
   ┌────────────────────────────────────────────────────────────┐
   │ Client                                                      │
   │   │                                                         │
   │   ▼                                                         │
   │ FileService.uploadFile(spaceId, file)                       │
   │   │                                                         │
   │   ├─► 1. 計算檔案 checksum (SHA-256)                        │
   │   ├─► 2. 上傳到 Supabase Storage (TUS resumable)           │
   │   ├─► 3. 調用 upload_file_with_version RPC                  │
   │   │     └─► 自動判斷：新檔案 vs 新版本                       │
   │   └─► 4. 返回 entry_id, version_id                          │
   └────────────────────────────────────────────────────────────┘

2. 版本歷史查看
   ┌────────────────────────────────────────────────────────────┐
   │ FileVersionService.getVersions(entryId)                     │
   │   │                                                         │
   │   └─► 調用 get_file_versions RPC                            │
   │       └─► 返回版本列表（含建立者、時間、註解）              │
   └────────────────────────────────────────────────────────────┘

3. 版本回復
   ┌────────────────────────────────────────────────────────────┐
   │ FileVersionService.restoreVersion(entryId, versionId)       │
   │   │                                                         │
   │   └─► 調用 restore_file_version RPC                         │
   │       ├─► 複製指定版本的 storage_key                        │
   │       ├─► 創建新版本記錄                                    │
   │       └─► 返回新版本 ID                                     │
   └────────────────────────────────────────────────────────────┘
```

### Storage 路徑規範

```
{bucket}/{owner_id}/v{version_id}/{filename}

範例：
- personal/abc-123/v1/report.pdf
- personal/abc-123/v2/report.pdf
- organization/xyz-789/v1/contract.docx
- team/team-001/v3/design.fig
- blueprint/bp-456/v1/schedule.xlsx
```

### 版本清理策略

```sql
-- 定期清理過期版本的排程任務
SELECT cron.schedule(
  'cleanup-old-versions',
  '0 3 * * 0',  -- 每週日凌晨 3 點
  $$
  WITH spaces_to_clean AS (
    SELECT id, (settings->>'max_versions')::int as max_versions
    FROM file_spaces
    WHERE (settings->>'auto_cleanup')::boolean = true
  ),
  versions_to_delete AS (
    SELECT fv.id, fv.storage_key
    FROM file_versions fv
    JOIN file_entries fe ON fe.id = fv.file_entry_id
    JOIN spaces_to_clean s ON s.id = fe.space_id
    WHERE fv.is_current = false
      AND fv.version_number < (
        SELECT MAX(version_number) - s.max_versions + 1
        FROM file_versions
        WHERE file_entry_id = fv.file_entry_id
      )
  )
  DELETE FROM file_versions
  WHERE id IN (SELECT id FROM versions_to_delete);
  $$
);
```

---

## 實作步驟

### Migration 順序

```
supabase/migrations/
├── YYYYMMDDHHMMSS_01_file_space_types.sql        # 新增枚舉類型
├── YYYYMMDDHHMMSS_02_table_file_spaces.sql       # 建立 file_spaces 表
├── YYYYMMDDHHMMSS_03_table_file_entries.sql      # 建立 file_entries 表
├── YYYYMMDDHHMMSS_04_table_file_versions.sql     # 建立 file_versions 表
├── YYYYMMDDHHMMSS_05_update_file_shares.sql      # 更新 file_shares 表
├── YYYYMMDDHHMMSS_06_file_space_triggers.sql     # 建立觸發器
├── YYYYMMDDHHMMSS_07_file_space_rls.sql          # 建立 RLS 策略
├── YYYYMMDDHHMMSS_08_storage_buckets.sql         # 設置 Storage buckets
├── YYYYMMDDHHMMSS_09_storage_rls.sql             # Storage RLS 策略
├── YYYYMMDDHHMMSS_10_file_space_api.sql          # API 函數
└── YYYYMMDDHHMMSS_11_helper_functions.sql        # 輔助函數
```

### Angular 前端實作

```
src/app/
├── core/infra/
│   ├── types/
│   │   └── file-space/
│   │       ├── file-space.types.ts
│   │       ├── file-entry.types.ts
│   │       ├── file-version.types.ts
│   │       └── index.ts
│   └── repositories/
│       └── file-space/
│           ├── file-space.repository.ts
│           ├── file-entry.repository.ts
│           ├── file-version.repository.ts
│           └── index.ts
│
├── shared/
│   ├── models/
│   │   └── file-space/
│   │       ├── file-space.models.ts
│   │       └── index.ts
│   └── services/
│       └── file-space/
│           ├── file-space.service.ts
│           ├── file-upload.service.ts
│           ├── file-version.service.ts
│           └── index.ts
│
├── core/facades/
│   └── file-space/
│       ├── file-space.facade.ts
│       └── index.ts
│
└── routes/
    └── files/
        ├── routes.ts
        ├── space-selector/
        │   └── space-selector.component.ts
        ├── file-browser/
        │   └── file-browser.component.ts
        ├── file-upload/
        │   └── file-upload.component.ts
        ├── version-history/
        │   └── version-history.component.ts
        └── file-share/
            └── file-share.component.ts
```

---

## 附錄

### A. 與現有 files 表的整合策略

現有的 `files` 表（用於藍圖附件）可以透過以下方式整合：

1. **保留現有表**：維持現有 `files` 表用於藍圖內的簡單附件
2. **新系統用於進階場景**：`file_entries` + `file_versions` 用於需要版本控制的場景
3. **漸進式遷移**：未來可考慮將 `files` 表資料遷移到新系統

### B. 配額計算公式

```sql
-- 個人空間預設配額：5GB
-- 組織空間預設配額：50GB
-- 團隊空間預設配額：20GB
-- 藍圖空間預設配額：10GB

-- 配額使用率計算
SELECT 
  fs.name,
  fs.used_bytes,
  fs.quota_bytes,
  ROUND((fs.used_bytes::numeric / fs.quota_bytes) * 100, 2) as usage_percent
FROM file_spaces fs;
```

### C. 版本差異比較（文字檔案）

建議使用 Edge Function 實作：

```typescript
// supabase/functions/version-diff/index.ts
import { diffLines } from 'diff';

Deno.serve(async (req) => {
  const { versionA, versionB } = await req.json();
  
  // 從 Storage 下載兩個版本的內容
  // 計算差異
  const diff = diffLines(contentA, contentB);
  
  return new Response(JSON.stringify({ diff }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### D. 參考資源

- [Supabase Storage 文檔](https://supabase.com/docs/guides/storage)
- [Supabase RLS 最佳實踐](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [TUS Resumable Upload Protocol](https://tus.io/)
- [GigHub 企業級資料庫架構規劃](../supabase/ENTERPRISE_STRUCTURE.md)

---

**版本：** 1.0  
**建立日期：** 2024-12-06  
**作者：** GigHub 開發團隊  
**狀態：** 設計階段

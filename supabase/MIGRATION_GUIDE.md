# 如何將 Seed 文件轉換為 Migration

本指南說明如何將 `supabase/seeds/init.sql` 的內容轉換為 Supabase migration 文件。

> 📚 **相關文檔**:
> - [結構化遷移指南](../docs/supabase/migrations/STRUCTURED_MIGRATION_GUIDE.md) - 完整命名規範與設計原則
> - [遷移結構樹速查表](../docs/supabase/migrations/MIGRATION_STRUCTURE_TREE.md) - 視覺化結構參考

## 方法 1: 使用 Supabase CLI（推薦）

### 步驟 1: 安裝 Supabase CLI

```bash
# Windows (使用 Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 或使用 npm
npm install -g supabase

# 或使用 Homebrew (Mac/Linux)
brew install supabase/tap/supabase
```

### 步驟 2: 初始化 Supabase 項目（如果尚未初始化）

```bash
# 在項目根目錄執行
supabase init
```

### 步驟 3: 創建新的 Migration 文件

```bash
# 創建新的 migration 文件（會自動生成時間戳）
supabase migration new fix_rls_policies_and_functions
```

這會創建一個新文件，例如：`supabase/migrations/20241130120000_fix_rls_policies_and_functions.sql`

### 步驟 4: 複製 Seed 內容到 Migration

將 `supabase/seeds/init.sql` 的內容複製到新創建的 migration 文件中。

## 方法 2: 手動創建 Migration 文件

### 步驟 1: 創建 Migration 文件

在 `supabase/migrations/` 目錄下創建新文件，命名格式為：
```
YYYYMMDDHHMMSS_description.sql
```

例如：
```
20241130120000_fix_rls_policies_and_functions.sql
```

### 步驟 2: 複製內容

將 `supabase/seeds/init.sql` 的完整內容複製到新創建的 migration 文件中。

## 方法 3: 使用 PowerShell 腳本（Windows）

在項目根目錄創建並執行以下 PowerShell 腳本：

```powershell
# create_migration.ps1
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$migrationName = "fix_rls_policies_and_functions"
$migrationFile = "supabase\migrations\${timestamp}_${migrationName}.sql"

# 創建 migrations 目錄（如果不存在）
New-Item -ItemType Directory -Force -Path "supabase\migrations" | Out-Null

# 複製 seed 文件內容到 migration
Copy-Item "supabase\seeds\init.sql" -Destination $migrationFile

Write-Host "Migration 文件已創建: $migrationFile" -ForegroundColor Green
```

執行：
```powershell
.\create_migration.ps1
```

## 方法 4: 使用 Bash 腳本（Mac/Linux/Git Bash）

在項目根目錄創建並執行以下 Bash 腳本：

```bash
#!/bin/bash
# create_migration.sh

TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_NAME="fix_rls_policies_and_functions"
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_${MIGRATION_NAME}.sql"

# 創建 migrations 目錄（如果不存在）
mkdir -p supabase/migrations

# 複製 seed 文件內容到 migration
cp supabase/seeds/init.sql "$MIGRATION_FILE"

echo "Migration 文件已創建: $MIGRATION_FILE"
```

執行：
```bash
chmod +x create_migration.sh
./create_migration.sh
```

## 驗證 Migration

創建 migration 後，可以使用以下指令驗證：

```bash
# 檢查 migration 文件語法（需要連接到數據庫）
supabase db lint

# 或直接查看 migration 文件
cat supabase/migrations/[新創建的文件名].sql
```

## 應用 Migration

### 本地開發環境

```bash
# 重置本地數據庫並應用所有 migrations
supabase db reset

# 或只應用新的 migrations
supabase migration up
```

### 遠程 Supabase 項目

```bash
# 鏈接到遠程項目
supabase link --project-ref your-project-ref

# 應用 migrations
supabase db push
```

## 注意事項

1. **Migration 文件命名**：必須使用時間戳格式 `YYYYMMDDHHMMSS_description.sql`，確保按時間順序執行。

2. **Idempotency（冪等性）**：Migration 文件應該可以安全地重複執行。使用 `CREATE OR REPLACE` 和 `DROP ... IF EXISTS` 來確保這一點。

3. **順序依賴**：確保 migration 中的函數和觸發器在相關表創建之後執行。

4. **測試**：在應用 migration 到生產環境之前，先在本地或測試環境中測試。

## 快速指令總結

```bash
# 1. 安裝 Supabase CLI
npm install -g supabase

# 2. 初始化（如果需要）
supabase init

# 3. 創建 migration
supabase migration new fix_rls_policies_and_functions

# 4. 複製 seed 內容到新創建的 migration 文件

# 5. 應用 migration（本地）
supabase db reset

# 或推送到遠程
supabase db push
```


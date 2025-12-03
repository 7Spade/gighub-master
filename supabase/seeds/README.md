# Supabase Seeds 種子數據

本目錄包含 GigHub 資料庫的種子數據文件，用於開發和測試環境的資料初始化。

## 📋 文件清單

| 文件 | 說明 | 依賴 |
|------|------|------|
| `seed.sql` | 主種子文件 - 建立基礎架構 | 無 |
| `seed_diaries.sql` | 施工日誌種子數據 | seed.sql |
| `seed_qc_inspections.sql` | 品管檢查種子數據 | seed.sql, seed_diaries.sql |
| `seed_acceptances.sql` | 驗收記錄種子數據 | seed.sql, seed_qc_inspections.sql |
| `seed_problems.sql` | 問題管理種子數據 | seed.sql, seed_qc_inspections.sql, seed_acceptances.sql |
| `seed_audit_logs.sql` | 審計日誌種子數據 | seed.sql |
| `seed_search_history.sql` | 搜尋歷史種子數據 | seed.sql |

## 🔄 執行順序

種子文件必須按照以下順序執行：

```bash
# 1. 基礎架構 (必須先執行)
supabase db seed --file seeds/seed.sql

# 2. 日誌模組
supabase db seed --file seeds/seed_diaries.sql

# 3. 品管模組
supabase db seed --file seeds/seed_qc_inspections.sql

# 4. 驗收模組
supabase db seed --file seeds/seed_acceptances.sql

# 5. 問題模組
supabase db seed --file seeds/seed_problems.sql

# 6. 審計模組
supabase db seed --file seeds/seed_audit_logs.sql

# 7. 搜尋歷史 (可獨立執行)
supabase db seed --file seeds/seed_search_history.sql
```

## 📦 seed.sql 內容概覽

主種子文件包含以下部分：

### PART 1-2: 列舉類型與私有 Schema
- `account_type`, `account_status`, `organization_role` 等
- 私有 Schema 用於 RLS 輔助

### PART 3-4: 核心表
- `accounts`, `organizations`, `organization_members`
- `teams`, `team_members`
- `blueprints`, `blueprint_members`, `blueprint_teams`, `blueprint_roles`

### PART 5: 業務模組表
- `tasks`, `task_assignments`, `task_comments`, `task_attachments`
- `issues`, `checklists`, `files`
- `acceptances`, `notifications`

### PART 6-8: RLS 與安全
- RLS 輔助函數
- 通用觸發器
- 資料列安全政策

### PART 9-13: API 與整合
- Auth → Account 自動建立
- 組織/團隊/藍圖 API 函數
- RBAC 預設角色

### PART 14-17: 基礎設施
- 藍圖配置中心
- 時間軸服務
- 事件總線
- 關聯管理
- 元數據系統
- 生命週期管理
- 搜尋引擎基礎設施
- 檔案管理
- 權限系統視圖
- API 閘道函數
- 通知中心增強
- 儲存與即時配置

## ⚠️ 注意事項

1. **僅限開發環境**: 種子數據僅用於開發和測試，不要在生產環境執行
2. **依賴順序**: 必須按照指定順序執行，否則會因外鍵約束失敗
3. **冪等性**: 大部分種子文件使用 `IF NOT EXISTS`，可重複執行
4. **資料重置**: 使用 `supabase db reset` 會清除所有資料並重新執行種子

## 🔧 開發工作流程

### 完整重置
```bash
# 重置資料庫並執行所有種子
supabase db reset
```

### 增量執行
```bash
# 只執行特定種子文件
supabase db seed --file seeds/seed_new_module.sql
```

### 驗證種子數據
```bash
# 檢查資料表是否正確建立
supabase db lint
```

## 📝 新增種子文件指南

1. 創建新文件 `seed_<module_name>.sql`
2. 在文件頭部添加依賴說明
3. 使用 `IF NOT EXISTS` 確保冪等性
4. 更新本 README 的文件清單和執行順序
5. 測試完整的種子執行流程

---

*相關文件: [STRUCTURE.md](../STRUCTURE.md) | [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)*

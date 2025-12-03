# Supabase Backup Files

此目錄包含原始 SQL 備份檔案，用於參考和歷史記錄。

## 檔案狀態

### 已整合至 migrations 目錄

以下備份檔案的內容已完整整合至 `migrations/` 目錄中的對應遷移檔案：

| 備份檔案 | 已整合至遷移檔案 | 狀態 |
|---------|-----------------|------|
| `20241203000000_create_search_history.sql` | `migrations/20241203000000_create_search_history.sql` | ✅ 已整合 |
| `20241203100000_create_audit_logs.sql` | `migrations/20241203100000_create_audit_logs.sql` | ✅ 已整合 |
| `20241203100002_create_qc_acceptance_problem.sql` | `migrations/20241203100002_create_qc_acceptance_problem.sql` | ✅ 已整合 |
| `migrations_audit_logs.sql` | `migrations/20241203100000_create_audit_logs.sql` | ✅ 已整合 |
| `migrations_search_history.sql` | `migrations/20241203000000_create_search_history.sql` | ✅ 已整合 |

### 已合併的模組遷移

以下備份檔案的內容已合併至單一遷移檔案：

| 備份檔案 | 合併至 | 狀態 |
|---------|-------|------|
| `migrations_qc_inspections.sql` | `migrations/20241203100002_create_qc_acceptance_problem.sql` | ✅ 已合併 |
| `migrations_acceptances.sql` | `migrations/20241203100002_create_qc_acceptance_problem.sql` | ✅ 已合併 |
| `migrations_problems.sql` | `migrations/20241203100002_create_qc_acceptance_problem.sql` | ✅ 已合併 |

### 日誌模組整合

`migrations_diaries.sql` 的內容已分解整合至：

| 內容 | 遷移檔案 | 狀態 |
|-----|---------|------|
| `diary_status` enum | `migrations/20241201000003_create_custom_types.sql` | ✅ 已整合 |
| `diaries` 表 | `migrations/20241201000302_create_table_diaries.sql` | ✅ 已整合 |
| `diary_attachments` 表 | `migrations/20241201000303_create_table_diary_attachments.sql` | ✅ 已整合 |
| `diary_entries` 表 + `work_item_type` enum | `migrations/20241201000311_create_table_diary_entries.sql` | ✅ 已整合 |
| RLS Policies | 各自的遷移檔案中 | ✅ 已整合 |

### 原始合併檔案 (僅供參考)

| 檔案 | 說明 |
|-----|------|
| `migrations.sql` | 原始合併的種子檔案，包含所有基礎架構。僅供參考，不再使用。 |

## 注意事項

1. **請勿直接執行備份檔案** - 所有內容已整合至 `migrations/` 目錄
2. **備份檔案僅供參考** - 用於追蹤歷史變更和原始設計
3. **如需修改** - 請更新 `migrations/` 目錄中對應的遷移檔案

## 遷移結構符合 ENTERPRISE_STRUCTURE.md

所有備份內容已按照 `ENTERPRISE_STRUCTURE.md` 規範重新組織：

- 類型定義 → `migrations/20241201000003_create_custom_types.sql`
- 表格建立 → `migrations/2024120100XXXX_create_table_*.sql`
- 觸發器 → `migrations/20241201000500_create_triggers.sql`
- RLS 策略 → `migrations/20241201000600_create_rls_policies.sql`
- 函數 → `migrations/20241201000400_create_private_functions.sql` 和 `migrations/20241201000800_create_api_functions.sql`

---

**最後更新：** 2024-12-03

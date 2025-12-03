# 🌲 Supabase 遷移結構樹

> 快速參考：GigHub 專案最佳遷移檔案結構

---

## 📊 視覺化結構樹

```
supabase/migrations/
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  LAYER 0: CORE INFRASTRUCTURE (核心基礎設施) - 00xxx                  ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
├── 00000_extensions.sql                  # pg_trgm, uuid-ossp 等擴展
├── 00001_create_schemas.sql              # public, private Schema
├── 00002_create_enums.sql                # 所有 ENUM 類型
├── 00003_create_helper_functions.sql     # updated_at 等通用函數
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  LAYER 1: FOUNDATION (基礎層) - 01xxx                                 ║
│  ║  帳戶 (accounts) / 組織 (organizations) / 團隊 (teams)               ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
├── 01000_foundation_accounts.sql         # accounts 表
├── 01001_foundation_organizations.sql    # organizations 表
├── 01002_foundation_org_members.sql      # organization_members 表
├── 01003_foundation_teams.sql            # teams 表
├── 01004_foundation_team_members.sql     # team_members 表
├── 01005_foundation_team_bots.sql        # team_bots 表
├── 01006_foundation_notifications.sql    # notifications 表
│   │
│   ├── 01100_foundation_rls_helpers.sql  # RLS Helper 函數
│   ├── 01101_foundation_auth_triggers.sql # Auth 觸發器
│   └── 01102_foundation_api_functions.sql # API 函數
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  LAYER 2: CONTAINER (容器層) - 02xxx                                  ║
│  ║  藍圖 (blueprints) / 權限 / 配置                                      ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
├── 02000_container_blueprints.sql        # blueprints 表
├── 02001_container_bp_members.sql        # blueprint_members 表
├── 02002_container_bp_roles.sql          # blueprint_roles 表
├── 02003_container_bp_team_roles.sql     # blueprint_team_roles 表
├── 02004_container_bp_configs.sql        # blueprint_configs 表
├── 02005_container_bp_modules.sql        # blueprint_modules 表
│   │
│   ├── 02100_container_activity.sql      # 時間軸服務
│   ├── 02101_container_events.sql        # 事件總線
│   ├── 02102_container_metadata.sql      # 元數據系統
│   ├── 02103_container_entity_refs.sql   # 關聯管理
│   ├── 02104_container_lifecycle.sql     # 生命週期管理
│   │
│   ├── 02200_container_rls_helpers.sql   # RLS Helper 函數
│   ├── 02201_container_api_functions.sql # API 函數
│   └── 02202_container_rbac_setup.sql    # RBAC 設置
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  LAYER 3: BUSINESS MODULES (業務層) - 03xxx                           ║
│  ║  任務 / 日誌 / 檢查清單 / 問題追蹤 / 檔案 / 待辦                       ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
│  [Tasks 任務管理 - 030xx]
├── 03000_business_tasks.sql              # tasks 表
├── 03001_business_task_attachments.sql   # task_attachments 表
├── 03002_business_task_comments.sql      # task_comments 表
├── 03003_business_task_acceptances.sql   # task_acceptances 表
├── 03004_business_task_labels.sql        # task_labels 表
│
│  [Diaries 施工日誌 - 031xx]
├── 03100_business_diaries.sql            # diaries 表
├── 03101_business_diary_attachments.sql  # diary_attachments 表
├── 03102_business_diary_entries.sql      # diary_entries 表
│
│  [Checklists 檢查清單 - 032xx]
├── 03200_business_checklists.sql         # checklists 表
├── 03201_business_checklist_items.sql    # checklist_items 表
│
│  [Issues 問題追蹤 - 033xx]
├── 03300_business_issues.sql             # issues 表
├── 03301_business_issue_comments.sql     # issue_comments 表
├── 03302_business_issue_attachments.sql  # issue_attachments 表
│
│  [Files 檔案管理 - 034xx]
├── 03400_business_files.sql              # files 表
├── 03401_business_file_versions.sql      # file_versions 表
├── 03402_business_file_shares.sql        # file_shares 表
│
│  [Todos 待辦事項 - 035xx]
├── 03500_business_todos.sql              # todos 表
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  LAYER 4: EXTENDED MODULES (擴展模組) - 04xxx                         ║
│  ║  品管 / 驗收 / 問題報告 / 財務                                         ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
│  [QC 品質管理 - 040xx]
├── 04000_qc_inspections.sql              # qc_inspections 表
├── 04001_qc_inspection_items.sql         # qc_inspection_items 表
├── 04002_qc_attachments.sql              # qc_inspection_attachments 表
│
│  [Acceptance 驗收管理 - 041xx]
├── 04100_acceptance_records.sql          # acceptances 表
├── 04101_acceptance_items.sql            # acceptance_items 表
├── 04102_acceptance_decisions.sql        # acceptance_decisions 表
│
│  [Problems 問題管理 - 042xx]
├── 04200_problem_reports.sql             # problems 表
├── 04201_problem_history.sql             # problem_history 表
├── 04202_problem_attachments.sql         # problem_attachments 表
│
│  [Financial 財務管理 - 043xx] (可選)
├── 04300_financial_contracts.sql         # contracts 表
├── 04301_financial_payments.sql          # payments 表
├── 04302_financial_invoices.sql          # invoices 表
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  LAYER 5: CROSS-CUTTING (跨切面功能) - 05xxx                          ║
│  ║  審計日誌 / 搜尋                                                       ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
├── 05000_audit_logs.sql                  # audit_logs 表
├── 05001_search_history.sql              # search_history 表
├── 05002_search_index.sql                # 搜尋索引配置
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  LAYER 6: STORAGE & REALTIME (存儲與即時) - 06xxx                     ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
├── 06000_storage_buckets.sql             # Storage Buckets
├── 06001_storage_policies.sql            # Storage RLS
├── 06002_realtime_config.sql             # Realtime 配置
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  LAYER 7: VIEWS (視圖) - 07xxx                                        ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
├── 07000_views_permissions.sql           # 權限視圖
├── 07001_views_statistics.sql            # 統計視圖
├── 07002_views_reports.sql               # 報表視圖
│
│  ╔═══════════════════════════════════════════════════════════════════════╗
│  ║  LAYER 8: DOCUMENTATION (文件) - 08xxx                                ║
│  ╚═══════════════════════════════════════════════════════════════════════╝
│
└── 08000_table_comments.sql              # 資料表註解
```

---

## �� 層級編碼速查

| 層級碼 | 層級 | 內容 |
|--------|------|------|
| `00xxx` | Core | 擴展、Schema、Enum、Helper |
| `01xxx` | Foundation | accounts, organizations, teams |
| `02xxx` | Container | blueprints, permissions, configs |
| `03xxx` | Business | tasks, diaries, checklists, issues, files, todos |
| `04xxx` | Extended | QC, acceptance, problems, financial |
| `05xxx` | Cross-Cutting | audit_logs, search |
| `06xxx` | Storage/Realtime | buckets, policies, realtime |
| `07xxx` | Views | permissions, statistics, reports |
| `08xxx` | Documentation | table comments |

---

## 🔗 模組編碼速查

| 模組碼 | 模組 | 說明 |
|--------|------|------|
| `030xx` | Tasks | 任務管理 |
| `031xx` | Diaries | 施工日誌 |
| `032xx` | Checklists | 檢查清單 |
| `033xx` | Issues | 問題追蹤 |
| `034xx` | Files | 檔案管理 |
| `035xx` | Todos | 待辦事項 |
| `040xx` | QC | 品質管理 |
| `041xx` | Acceptance | 驗收管理 |
| `042xx` | Problems | 問題報告 |
| `043xx` | Financial | 財務管理 |

---

## ➡️ 依賴關係圖

```
Layer 0 (Core Infrastructure)
    ↓
Layer 1 (Foundation)
    ↓
Layer 2 (Container)
    ↓
Layer 3 & 4 (Business & Extended)
    ↓
Layer 5 (Cross-Cutting)
    ↓
Layer 6 & 7 (Storage, Views)
    ↓
Layer 8 (Documentation)
```

---

**詳細指南**: [STRUCTURED_MIGRATION_GUIDE.md](./STRUCTURED_MIGRATION_GUIDE.md)

**最後更新**: 2025-12-03

---

## 📂 現有遷移檔案清單

以下是目前專案中已建立的結構化遷移檔案：

| 檔案名稱 | 層級 | 模組 | 說明 |
|----------|------|------|------|
| `03100_business_diaries.sql` | Business | Diaries | 施工日誌模組 |
| `04000_extended_qc_inspections.sql` | Extended | QC | 品質管理檢查模組 |
| `04100_extended_acceptances.sql` | Extended | Acceptances | 驗收管理模組 |
| `04200_extended_problems.sql` | Extended | Problems | 問題管理模組 |
| `05000_cross_cutting_audit_logs.sql` | Cross-Cutting | Audit Logs | 審計日誌模組 |
| `05001_cross_cutting_search_history.sql` | Cross-Cutting | Search | 搜尋歷史模組 |

### 未來待建立的遷移檔案

| 建議檔案名稱 | 層級 | 說明 |
|--------------|------|------|
| `00000_extensions.sql` | Core | PostgreSQL 擴展 |
| `00001_create_schemas.sql` | Core | Schema 定義 |
| `00002_create_enums.sql` | Core | 所有 ENUM 類型 |
| `01000_foundation_accounts.sql` | Foundation | 帳戶表 |
| `01001_foundation_organizations.sql` | Foundation | 組織表 |
| `02000_container_blueprints.sql` | Container | 藍圖表 |
| `03000_business_tasks.sql` | Business | 任務表 |
| `06000_storage_buckets.sql` | Storage | 儲存桶配置 |

---

**更新日期**: 2025-12-03

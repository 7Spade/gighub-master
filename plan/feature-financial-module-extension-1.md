---
goal: 為 GigHub 工地施工進度追蹤系統實現金融模組擴展
version: 1.0
date_created: 2024-12-02
last_updated: 2024-12-02
owner: 7Spade
status: 'Proposed'
tags: ['feature', 'financial', 'budget', 'expense', 'invoice', 'supabase']
---

# Introduction

![Status: Proposed](https://img.shields.io/badge/status-Proposed-yellow)

本計劃文件描述 GigHub 工地施工進度追蹤系統的金融模組擴展。金融模組將提供預算管理、費用追蹤、付款記錄和發票管理等功能，與現有的 Blueprint（藍圖）架構完美整合。

## 1. Requirements & Constraints

### 1.1 功能需求

- **REQ-001**: 預算管理 - 支援多層次預算結構，按類別追蹤預算與實際支出
- **REQ-002**: 費用記錄 - 記錄實際發生的費用，支援附件上傳和審批流程
- **REQ-003**: 付款管理 - 追蹤付款記錄，支援分期付款
- **REQ-004**: 發票管理 - 管理開立和收到的發票，包含明細項目
- **REQ-005**: 預算快照 - 定期記錄預算狀態，追蹤預算變更歷史
- **REQ-006**: 財務報表 - 提供預算摘要和財務總覽 API

### 1.2 與現有架構整合

- **INT-001**: 整合 Blueprint 容器 - 所有金融資料皆隸屬於特定藍圖
- **INT-002**: 整合 Task 模組 - 費用可關聯到特定任務
- **INT-003**: 整合 Files 模組 - 支援收據等附件上傳
- **INT-004**: 整合 Activity 時間軸 - 金融操作記錄到活動時間軸
- **INT-005**: 整合 RBAC 系統 - 使用現有的 finance 業務角色進行權限控制

### 1.3 安全與權限約束

- **SEC-001**: 遵循現有 RLS 政策模式，使用 private schema 函數
- **SEC-002**: 財務資料僅限 finance 和 project_manager 角色可寫入
- **SEC-003**: 刪除操作僅限 project_manager 角色
- **SEC-004**: 一般成員可查看財務資料（唯讀）

### 1.4 技術約束

- **CON-001**: 遵循現有資料庫設計模式（UUID 主鍵、時間戳欄位）
- **CON-002**: 使用 PostgreSQL ENUM 類型保持資料一致性
- **CON-003**: 支援軟刪除（deleted_at 欄位）
- **CON-004**: 啟用 Realtime 訂閱以支援即時更新

## 2. Database Schema Analysis

### 2.1 新增資料表

| 資料表 | 說明 | 關聯 |
|--------|------|------|
| budgets | 預算計劃 | blueprints, accounts |
| expenses | 費用記錄 | blueprints, budgets, tasks, files, accounts |
| expense_attachments | 費用附件 | expenses, accounts |
| payments | 付款記錄 | blueprints, expenses, invoices, accounts |
| invoices | 發票記錄 | blueprints, accounts |
| invoice_items | 發票明細 | invoices |
| budget_snapshots | 預算快照 | budgets, accounts |

### 2.2 新增 ENUM 類型

| ENUM 類型 | 說明 | 值 |
|-----------|------|-----|
| budget_category | 預算類別 | labor, material, equipment, subcontract, overhead, other |
| expense_status | 費用狀態 | draft, submitted, approved, rejected, paid |
| payment_status | 付款狀態 | pending, partial, completed, cancelled |
| invoice_type | 發票類型 | invoice, receipt, credit_note, debit_note |
| invoice_status | 發票狀態 | draft, issued, sent, paid, overdue, cancelled |
| currency_code | 幣別代碼 | TWD, USD, CNY, JPY |

### 2.3 擴展現有 ENUM

- **module_type**: 添加 'finance' 值以啟用金融模組

## 3. Compatibility Analysis with init.sql

### 3.1 ✅ 完美銜接項目

| 項目 | 說明 | 銜接方式 |
|------|------|----------|
| 藍圖整合 | 使用 blueprint_id 外鍵 | REFERENCES blueprints(id) ON DELETE CASCADE |
| 帳號整合 | 使用 account_id 外鍵 | REFERENCES accounts(id) ON DELETE SET NULL |
| 任務整合 | 費用可關聯任務 | REFERENCES tasks(id) ON DELETE SET NULL |
| 檔案整合 | 使用 files 表儲存附件 | REFERENCES files(id) ON DELETE SET NULL |
| RLS 函數 | 使用現有權限函數 | private.has_blueprint_access(), private.can_write_blueprint() |
| 業務角色 | 使用 finance 角色 | private.get_blueprint_business_role() |
| 時間戳觸發器 | 使用現有觸發器函數 | public.update_updated_at() |
| 活動記錄 | 使用現有活動函數 | public.log_activity() |

### 3.2 ⚠️ 注意事項

| 項目 | 風險 | 解決方案 |
|------|------|----------|
| ENUM 擴展 | PostgreSQL 不支援直接刪除 ENUM 值 | 使用 DO 區塊安全添加，包含 IF NOT EXISTS 檢查 |
| Realtime | 需確認 supabase_realtime 存在 | 使用 DO 區塊包裝 ALTER PUBLICATION，處理 duplicate_object 異常 |
| entity_type | log_activity 需要 expense 類型 | 遷移文件會自動添加 'expense', 'budget', 'payment', 'invoice' 到 entity_type |
| activity_type | 核准操作需要記錄活動 | 使用 init.sql 中已定義的 'approval' activity_type |

### 3.3 ✅ 驗證通過項目

經分析，以下 init.sql 中的依賴項目皆存在且相容：

- [x] `blueprints` 資料表存在
- [x] `accounts` 資料表存在
- [x] `tasks` 資料表存在
- [x] `files` 資料表存在
- [x] `private.has_blueprint_access()` 函數存在
- [x] `private.can_write_blueprint()` 函數存在
- [x] `private.get_blueprint_business_role()` 函數存在
- [x] `private.get_user_account_id()` 函數存在
- [x] `public.update_updated_at()` 函數存在
- [x] `public.log_activity()` 函數存在
- [x] `blueprint_business_role` ENUM 包含 'finance' 值
- [x] `activity_type` ENUM 包含 'approval' 值 (用於費用核准)
- [x] `supabase_realtime` PUBLICATION 存在

### 3.4 ⚠️ 需遷移擴展的 ENUM

以下 ENUM 類型需要在遷移中擴展（init.sql 中未包含）：

| ENUM 類型 | 新增值 | 說明 |
|-----------|--------|------|
| entity_type | expense, budget, payment, invoice | 支援金融實體的活動記錄 |
| module_type | finance | 啟用金融模組 |

這些擴展已包含在遷移文件中，使用安全的 DO 區塊處理。

## 4. Implementation Steps

### Phase 1: 資料庫遷移

| Task | Description | Status |
|------|-------------|--------|
| TASK-001 | 創建 migrations 目錄結構 | ✅ |
| TASK-002 | 創建金融 ENUM 類型 | ✅ |
| TASK-003 | 創建金融資料表 | ✅ |
| TASK-004 | 創建 RLS 政策 | ✅ |
| TASK-005 | 創建 API 函數 | ✅ |
| TASK-006 | 創建觸發器 | ✅ |
| TASK-007 | 配置 Realtime | ✅ |
| TASK-008 | 添加文件註解 | ✅ |

### Phase 2: 前端整合 (未來工作)

| Task | Description | Status |
|------|-------------|--------|
| TASK-009 | 創建金融類型定義 (TypeScript) | 📋 待規劃 |
| TASK-010 | 創建金融 Repository | 📋 待規劃 |
| TASK-011 | 創建金融 Service | 📋 待規劃 |
| TASK-012 | 創建金融 Facade | 📋 待規劃 |
| TASK-013 | 創建預算管理 UI 組件 | 📋 待規劃 |
| TASK-014 | 創建費用管理 UI 組件 | 📋 待規劃 |
| TASK-015 | 創建發票管理 UI 組件 | 📋 待規劃 |
| TASK-016 | 創建財務報表 UI 組件 | 📋 待規劃 |

## 5. RLS Policy Summary

### 5.1 權限矩陣

| 資料表 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| budgets | 藍圖成員 | PM, Finance | PM, Finance | PM |
| expenses | 藍圖成員 | 寫入權限成員 | 建立者, PM, Finance | PM, Finance |
| payments | 藍圖成員 | PM, Finance | PM, Finance | PM |
| invoices | 藍圖成員 | PM, Finance | PM, Finance | PM |
| invoice_items | 藍圖成員 | PM, Finance | PM, Finance | PM |
| budget_snapshots | 藍圖成員 | PM, Finance | - | - |

- **PM**: project_manager 業務角色
- **Finance**: finance 業務角色

## 6. API Functions Summary

| 函數名稱 | 說明 | 參數 |
|----------|------|------|
| get_budget_summary | 取得預算類別摘要 | blueprint_id |
| get_financial_overview | 取得財務總覽 | blueprint_id |
| approve_expense | 核准/駁回費用 | expense_id, approved |
| create_budget_snapshot | 建立預算快照 | budget_id, notes |

## 7. Files

- **FILE-001**: `supabase/migrations/20241202104900_add_financial_extension.sql` - 金融模組遷移文件
- **FILE-002**: `plan/feature-financial-module-extension-1.md` - 本計劃文件

## 8. Testing

### 8.1 資料庫測試

- **TEST-001**: 驗證遷移文件語法正確
- **TEST-002**: 驗證所有外鍵約束正確
- **TEST-003**: 驗證 RLS 政策按預期運作
- **TEST-004**: 驗證 API 函數返回正確結果

### 8.2 整合測試

- **TEST-005**: 驗證費用記錄正確更新預算實際金額
- **TEST-006**: 驗證活動時間軸正確記錄金融操作
- **TEST-007**: 驗證 Realtime 訂閱正常運作

## 9. Risks & Assumptions

### 9.1 風險

- **RISK-001**: ENUM 類型擴展需要謹慎處理，避免影響現有資料
- **RISK-002**: 金額計算需注意精度問題 (使用 DECIMAL(15,2))
- **RISK-003**: 逾期發票狀態更新依賴觸發器，需確保定期檢查

### 9.2 假設

- **ASSUMPTION-001**: init.sql 已成功執行並建立所有基礎架構
- **ASSUMPTION-002**: Supabase 專案已正確配置 Realtime 功能
- **ASSUMPTION-003**: 用戶具有 finance 業務角色才能進行金融操作

## 10. Conclusion

### 10.1 適用性評估

✅ **適用於本專案未來擴展**

金融模組擴展設計完全符合 GigHub 現有架構：
- 遵循 Blueprint 容器設計模式
- 整合現有 RBAC 權限系統
- 使用現有 RLS 輔助函數
- 支援活動時間軸記錄
- 支援 Realtime 即時更新

### 10.2 與 init.sql 銜接性

✅ **完美銜接**

遷移文件設計考量：
- 所有外鍵參照皆指向 init.sql 中已存在的資料表
- 使用 init.sql 中定義的權限函數
- 遵循 init.sql 的設計模式和命名約定
- 使用 ON CONFLICT 避免重複執行問題
- 使用 DO 區塊安全處理 ENUM 擴展

### 10.3 建議執行順序

1. 確保 init.sql 已成功應用
2. 執行 `20241202104900_add_financial_extension.sql` 遷移
3. 驗證遷移結果
4. 進行前端整合開發

## 11. Related Specifications / Further Reading

- [supabase/seeds/init.sql](../supabase/seeds/init.sql) - 基礎資料庫架構
- [MIGRATION_GUIDE.md](../supabase/MIGRATION_GUIDE.md) - 遷移指南
- [feature-blueprint-module-1.md](./feature-blueprint-module-1.md) - 藍圖模組實現計劃

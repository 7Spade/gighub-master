# ⚠️ 已知問題清單 (按處理順序排列)

> 最後更新: 2025-12-06  
> 總計問題數量: 33 項 (已修復 16 項, 部分完成 4 項)  
> 總預計修復工時: 481h (已節省 180h, 進行中 44h)  
> 排列原則: 按優先級 P0 → P1 → P2 → P3 → 技術債順序處理

---

## 📊 問題總覽 (按處理順序)

| 處理順序 | 嚴重程度   | 數量 | 總工時 | 說明                       |
| -------- | ---------- | ---- | ------ | -------------------------- |
| 1        | 🔴 P0 阻塞 | 0    | 0h     | 阻塞核心功能，必須立即修復 (已修復 5 項) |
| 2        | 🟠 P1 關鍵 | 0    | 0h     | 影響核心功能，需儘快修復 (5 項已修復或部分完成) |
| 3        | 🟡 P2 重要 | 1    | 32h    | 影響用戶體驗，需排程修復 (5 項已修復, 1 項部分完成)   |
| 4        | 🟢 P3 輕微 | 7    | 25h    | 可延後修復 (已修復 4 項)   |
| 5        | 🔧 技術債  | 7    | 125h   | 需要重構 (已修復 3 項)     |

---

## 📋 關聯文件

- `docs/2025-Issues.md` - 原始問題記錄（3 項核心問題）
- `docs/architecture/INFRASTRUCTURE_STATUS.md` - 基礎設施狀態分析（12 項核心基礎設施）

### 原始問題記錄 (`docs/2025-Issues.md`)

```
1.藍圖介面分類不完整,總預算 已支出 已付款 剩餘預算 都應該在財務不應該在總覽會導致權限規劃困難
2.藍圖編輯功能缺失
3.藍圖總覽目前未達生產標準
```

---

## 🔴 第一階段: P0 - 阻塞性問題 (必須立即修復)

> **處理順序: 1-4**  
> **總工時: 38h**  
> **預計完成: Sprint 1 (Week 1-2)**

### 1. ISSUE-001: 藍圖編輯功能完全缺失

| 屬性     | 內容                                                    |
| -------- | ------------------------------------------------------- |
| 問題描述 | 藍圖建立後無法編輯，編輯按鈕顯示「編輯功能開發中」訊息 |
| 影響範圍 | 所有藍圖用戶                                            |
| 業務影響 | 無法修正錯誤資訊、無法更新設定、無法啟用/停用模組      |
| 相關檔案 | `src/app/routes/blueprint/overview/overview.component.ts` |
| 狀態     | ✅ 已修復                                               |
| 負責人   | Copilot                                                 |
| 預計工時 | 11h                                                     |
| 完成日期 | 2025-12-05                                              |

**重現步驟**:
1. 建立一個藍圖
2. 進入藍圖概覽頁面
3. 點擊「編輯」按鈕
4. ~~顯示「編輯功能開發中」訊息~~ 現在會開啟編輯抽屜

**建議修復**:
- [x] 實現藍圖編輯抽屜組件 - `blueprint-edit-drawer.component.ts`
- [x] 實現藍圖基本資訊編輯 API - 已使用 `BlueprintFacade.updateBlueprint()`
- [x] 實現模組啟用/停用功能 - 已整合到編輯抽屜
- [x] 實現藍圖狀態變更功能 - 支援 active/suspended/archived
- [ ] 實現藍圖封面上傳功能 - 待完善

---

### 2. ISSUE-002: 藍圖概覽頁面資訊架構問題

| 屬性     | 內容                                                              |
| -------- | ----------------------------------------------------------------- |
| 問題描述 | 財務資訊（總預算、已支出、已付款、剩餘預算）顯示在概覽頁面頂部    |
| 影響範圍 | 權限規劃、資訊架構                                                |
| 業務影響 | 無法針對財務資訊單獨設定存取權限，權限規劃困難                    |
| 相關檔案 | `src/app/routes/blueprint/overview/overview.component.ts`         |
| 狀態     | ✅ 已修復 (經驗證架構已正確)                                       |
| 負責人   | -                                                                 |
| 預計工時 | 7h                                                                |
| 完成日期 | 2025-12-05                                                        |

**問題詳情**:
```html
<!-- 概覽頁面頂部現在只顯示基本統計 -->
<nz-card>
  <nz-statistic nzTitle="啟用模組" />
  <nz-statistic nzTitle="成員數" />
  <nz-statistic nzTitle="建立時間" />
  <nz-statistic nzTitle="更新時間" />
</nz-card>
```

**建議修復**:
- [x] 將財務統計卡片移至「財務」Tab - 已完成
- [x] 概覽頁面保留基本藍圖資訊 - 已完成
- [ ] 調整權限系統以支援財務模組權限 - 需另行處理

---

### 3. ISSUE-003: 藍圖概覽未達生產標準

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 藍圖概覽頁面多項功能使用佔位符或假資料      |
| 影響範圍 | 所有藍圖用戶                                |
| 業務影響 | 用戶體驗不佳、功能不完整、無法正式上線      |
| 相關檔案 | `src/app/routes/blueprint/overview/overview.component.ts` |
| 狀態     | ✅ 已修復                                   |
| 負責人   | Copilot                                     |
| 預計工時 | 16h                                         |
| 完成日期 | 2025-12-05                                  |

**具體問題**:
- ~~成員資訊顯示 `account_id` 而非名稱~~ - 已修復：使用 `accountName || account_id`
- ~~財務資訊與概覽資訊混合~~ - 已在 ISSUE-002 中確認正確
- ~~活動時間軸顯示「暫無活動記錄」佔位符~~ - 已修復：整合 ActivityTimelineComponent
- ~~部分統計資料使用假資料~~ - 已修復：所有統計來自真實數據

**建議修復**:
- [x] 修正成員顯示邏輯 - 已完成
- [x] 支援成員頭像顯示 - 已完成
- [x] 整合時間軸服務到活動 Tab - 已完成 (ActivityTimelineComponent)
- [x] 確保所有統計資料來自真實數據 - 已完成

---

### 4. ISSUE-004: 任務管理使用 Mock 資料後備

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 真實資料載入失敗時，任務管理使用 Mock 資料   |
| 影響範圍 | 任務管理模組                                |
| 業務影響 | 開發環境與生產環境行為不一致、測試困難      |
| 相關檔案 | `src/app/routes/blueprint/tasks/tasks.component.ts` |
| 狀態     | ✅ 已修復 (Mock 資料後備已移除)              |
| 負責人   | -                                           |
| 預計工時 | 4h                                          |
| 完成日期 | 2025-12-05                                  |

**現行程式碼** (已修復):
```typescript
// Error handling with retry UI
@if (taskService.hasError()) {
  <nz-result nzStatus="error" nzTitle="載入失敗" [nzSubTitle]="taskService.error()">
    <div nz-result-extra>
      <button nz-button nzType="primary" (click)="retryLoad()">重新載入</button>
    </div>
  </nz-result>
}

// Retry method
async retryLoad(): Promise<void> {
  this.msg.loading('正在重新載入...', { nzDuration: 0 });
  await this.loadTasks();
  this.msg.remove();
  if (!this.taskService.hasError()) {
    this.msg.success('載入成功');
  }
}
```

**建議修復**:
- [x] 移除 Mock 資料後備機制 - 已完成
- [x] 添加適當的錯誤處理 UI - 已完成 (nz-result 組件)
- [x] 添加重試機制 - 已完成 (retryLoad 方法)
- [x] 添加空狀態 UI - 已有 (nz-empty 組件)

---

### 5. ISSUE-028: 任務建立失敗 - 資料庫欄位缺失

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 任務建立時出現「任務建立失敗」錯誤，原因是資料庫缺少 `sort_order` 欄位 |
| 影響範圍 | 任務管理模組 - 所有任務建立操作             |
| 業務影響 | 用戶無法建立新任務                          |
| 相關檔案 | `src/app/core/infra/repositories/task/task.repository.ts` |
| 狀態     | ✅ 已修復                                   |
| 負責人   | Copilot                                     |
| 預計工時 | 2h                                          |
| 完成日期 | 2025-12-05                                  |

**根本原因**:
PostgreSQL 錯誤日誌顯示：
```
ERROR: column tasks.sort_order does not exist
```

TaskRepository 使用 `sort_order` 欄位進行任務排序，但資料庫中該欄位不存在。

**修復方案**:
- [x] 使用 Context7 查詢 Supabase ALTER TABLE 最佳實踐
- [x] 建立資料庫遷移 `20251205191500_add_sort_order_to_tasks.sql`
- [x] 添加 `sort_order INTEGER DEFAULT 0 NOT NULL` 欄位
- [x] 建立索引 `idx_tasks_sort_order` 優化查詢性能
- [x] 使用 Supabase MCP apply_migration 應用遷移

---

## 🟠 第二階段: P1 - 關鍵問題 (需儘快修復)

> **處理順序: 5-9**  
> **總工時: 144h**  
> **預計完成: Sprint 2-3 (Week 3-6)**

### 5. ISSUE-005: 權限系統未完全實現

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 權限系統基礎已完成，但部分功能尚未實現      |
| 影響範圍 | 所有需要權限控制的功能                      |
| 業務影響 | 無法精細控制權限、效能可能受影響            |
| 相關檔案 | `src/app/shared/services/permission/permission.service.ts`, `src/app/shared/directives/permission.directive.ts` |
| 狀態     | 🟡 部分完成 (權限管理 UI 已實現)            |
| 負責人   | Copilot                                     |
| 預計工時 | 26h (已完成 20h)                            |

**已完成功能**:
- [x] PermissionService - 權限上下文管理 with Signals
- [x] HasPermissionDirective - 權限模板指令
- [x] HasRoleDirective - 角色模板指令
- [x] IsOwnerDirective - 擁有者模板指令
- [x] PermissionGuard - 路由守衛
- [x] Permission/Role 類型定義
- [x] 多角色權限計算 (getCombinedPermissions)
- [x] 權限管理 UI 頁面
- [x] 角色列表和詳情檢視
- [x] 權限矩陣視圖 (6 類 24 項權限)
- [x] 自訂角色建立/編輯/刪除

**待完成功能**:
- [ ] 權限快取策略 (減少 API 呼叫)
- [ ] 資源級別權限檢查 (entity-level permissions)

---

### 6. ISSUE-006: 搜尋功能未完全整合

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 搜尋服務已實現，但未完全整合到 UI           |
| 影響範圍 | 搜尋功能用戶                                |
| 業務影響 | 用戶無法有效搜尋內容                        |
| 相關檔案 | `src/app/shared/services/search/search.service.ts`, `src/app/layout/basic/widgets/search.component.ts` |
| 狀態     | 🟡 部分完成 (搜尋 UI 和進階搜尋已整合)      |
| 負責人   | Copilot                                     |
| 預計工時 | 28h (已完成 24h)                            |

**已完成功能**:
- [x] 全域搜尋面板 - HeaderSearchComponent 已整合
- [x] 多類別搜尋 (tasks, blueprints, diaries, users)
- [x] 鍵盤導航 (Arrow keys, Enter, Escape, F1)
- [x] 搜尋歷史和建議
- [x] 類別過濾
- [x] 載入狀態和骨架屏
- [x] 搜尋自動完成
- [x] 進階搜尋頁面 UI
- [x] 多維度篩選 (類型、狀態、優先級、日期範圍)
- [x] 搜尋結果高亮和相關度排序
- [x] 搜尋歷史管理 (localStorage)

**待完成功能**:
- [ ] 關聯搜尋 (任務關聯日誌、檔案關聯任務)
- [ ] 權限感知過濾

---

### 7. ISSUE-007: 通知系統未完全實現

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 通知服務已實現，但 UI 和進階功能未完成      |
| 影響範圍 | 通知功能用戶                                |
| 業務影響 | 用戶無法接收和管理通知                      |
| 相關檔案 | `src/app/shared/services/notification/notification.service.ts`, `src/app/layout/basic/widgets/notify.component.ts` |
| 狀態     | 🟡 部分完成 (通知中心 UI 和偏好設定已整合)  |
| 負責人   | Copilot                                     |
| 預計工時 | 32h (已完成 22h)                            |

**已完成功能**:
- [x] 通知中心 UI - HeaderNotifyComponent 已整合
- [x] 三種通知分類 (系統、任務、訊息)
- [x] 即時通知更新 via Supabase Realtime
- [x] 標記為已讀 / 清空分類
- [x] 導航到相關實體
- [x] 通知 Repository 和 Service 完整實現
- [x] 通知偏好設定頁面 UI
- [x] 8 種通知類別設定 (任務、日誌、品質檢查、問題、檔案、成員、財務、系統)
- [x] 勿擾時段設定
- [x] 每日摘要設定
- [x] 智慧合併設定

**待完成功能**:
- [ ] 排程通知
- [ ] 多頻道路由後端整合 (App push, Email, Webhook)
- [ ] 訂閱管理整合

---

### 8. ISSUE-008: 時間軸 UI 未實現

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 時間軸服務已實現，但 UI 組件未完成          |
| 影響範圍 | 藍圖概覽、活動歷史                          |
| 業務影響 | 用戶無法查看活動歷史和審計軌跡              |
| 相關檔案 | `src/app/shared/services/timeline/timeline.service.ts` |
| 狀態     | ✅ 已修復                                   |
| 負責人   | Copilot                                     |
| 預計工時 | 30h                                         |
| 完成日期 | 2025-12-06                                  |

**已完成功能**:
- [x] 基礎時間軸 UI - ActivityTimelineComponent
- [x] 跨模組活動追蹤 UI - 已整合到藍圖概覽 Tab
- [x] 活動記錄過濾 (按動作類型、實體類型)
- [x] 相對時間顯示 (剛剛、幾分鐘前等)
- [x] 分頁載入更多
- [x] 審計軌跡 - AuditLogService 整合
- [x] 完整操作歷史視圖 (獨立頁面 - activities.component.ts)
- [x] 統計卡片 (總活動、今日活動、活躍用戶、變更操作)
- [x] 日期範圍篩選
- [x] CSV 導出功能
- [x] 時間軸/表格視圖切換

**待完成功能**:
- [ ] 版本控制 (diff 視圖)
- [ ] 多時間軸視圖 (全域、模組、用戶)

---

### 9. ISSUE-009: 日誌管理 UI 未實現

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 日誌服務已實現，但前端 UI 未完成            |
| 影響範圍 | 日誌管理功能                                |
| 業務影響 | 用戶無法建立和管理施工日誌                  |
| 相關檔案 | `src/app/shared/services/diary/diary.service.ts`, `src/app/routes/blueprint/diaries/diaries.component.ts` |
| 狀態     | ✅ 已修復                                   |
| 負責人   | Copilot                                     |
| 預計工時 | 28h                                         |
| 完成日期 | 2025-12-06                                  |

**已完成功能**:
- [x] 日誌建立/編輯 UI
- [x] 日誌列表頁面 (含篩選、搜尋、分頁)
- [x] 日誌詳情頁面
- [ ] 日誌附件上傳 (待後續實現)
- [ ] 日誌模板功能 (待後續實現)
- [x] 日誌審核流程 (提交、核准、駁回)

**實現摘要**:
- 建立 `BlueprintDiariesComponent` 完整實現日誌管理
- 統計卡片顯示總數、草稿、待審核、已核准數量
- 支援天氣、工時、出工人數等欄位記錄
- 整合審核工作流程

---

## 🟡 第三階段: P2 - 重要問題 (需排程修復)

> **處理順序: 10-15**  
> **總工時: 182h**  
> **預計完成: Sprint 4-5 (Week 7-10)**

### 10. ISSUE-010: 品質驗收 UI 未實現

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | QC 和驗收服務已實現，但前端 UI 未完成       |
| 影響範圍 | 品質驗收功能                                |
| 業務影響 | 用戶無法進行品質驗收操作                    |
| 相關檔案 | `src/app/routes/blueprint/qc-inspections/qc-inspections.component.ts` |
| 狀態     | ✅ 已修復                                   |
| 負責人   | Copilot                                     |
| 預計工時 | 30h                                         |
| 完成日期 | 2025-12-06                                  |

**已完成功能**:
- [x] 品質檢查列表 UI (含篩選、搜尋、分頁)
- [x] 品質檢查建立/編輯抽屜
- [x] 品質檢查詳情頁面 (含檢查項目)
- [x] 統計卡片 (總數、待檢查、檢查中、已通過、未通過、平均通過率)
- [x] 檢查工作流程 (開始檢查、完成檢查)
- [x] 藍圖概覽導航卡片

**待完成功能**:
- [ ] 驗收報告生成 (PDF 導出)
- [ ] 驗收流程工作流 (審批流程)

---

### 11. ISSUE-011: 檔案管理 UI 未實現

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 檔案服務已實現，但前端 UI 未完成            |
| 影響範圍 | 檔案管理功能                                |
| 業務影響 | 用戶無法上傳和管理檔案                      |
| 相關檔案 | `src/app/routes/blueprint/files/files.component.ts` |
| 狀態     | ✅ 已修復                                   |
| 負責人   | Copilot                                     |
| 預計工時 | 32h                                         |
| 完成日期 | 2025-12-06                                  |

**已完成功能**:
- [x] 檔案列表 UI (表格視圖、資料夾導航)
- [x] 檔案上傳 (拖放上傳 + 進度條)
- [x] 資料夾建立/導航
- [x] 麵包屑導航
- [x] 檔案操作 (重新命名、刪除、下載)
- [x] 多選功能
- [x] 統計卡片 (總檔案數、資料夾、圖片、文件、總大小)
- [x] 藍圖概覽導航卡片

**待完成功能**:
- [ ] 檔案預覽 (圖片、PDF、Office)
- [ ] 檔案分類與標籤
- [ ] 版本控制
- [ ] 檔案權限管理

---

### 12. ISSUE-012: 問題追蹤 UI

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 問題追蹤 UI 尚未完全實現                    |
| 影響範圍 | 問題建立、追蹤、處理流程                    |
| 業務影響 | 無法有效管理和追蹤施工問題                  |
| 相關檔案 | `src/app/routes/blueprint/problems/problems.component.ts` |
| 狀態     | ✅ 部分完成                                 |
| 負責人   | Copilot                                     |
| 預計工時 | 30h                                         |
| 完成日期 | 2025-12-06                                  |

**已完成功能**:
- [x] 問題列表頁面 (篩選、搜尋、分頁)
- [x] 問題統計卡片
- [x] 問題建立/編輯表單
- [x] 問題詳情視圖
- [x] 問題狀態流程 (開立 → 評估 → 分派 → 處理中 → 解決 → 驗證 → 關閉)
- [x] 藍圖概覽導航卡片

**待完成功能**:
- [ ] 任務 ↔ 問題 關聯
- [ ] 問題附件上傳
- [ ] 問題評論功能
- [ ] 問題知識庫

---

### 13. ISSUE-013: 配置中心未實現

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 配置中心完全未實現                          |
| 影響範圍 | 藍圖自訂化設定                              |
| 業務影響 | 無法自訂藍圖配置                            |
| 相關檔案 | `src/app/routes/blueprint/settings/settings.component.ts` |
| 狀態     | ✅ 已修復                                   |
| 負責人   | Copilot                                     |
| 預計工時 | 30h                                         |
| 完成日期 | 2025-12-06                                  |

**已完成功能**:
- [x] 藍圖設定頁面 UI
- [x] 工作時間設定 (上班/下班時間、工作日)
- [x] 時區和語言設定
- [x] 預設任務設定 (優先級、期限天數)
- [x] 模組啟用/停用切換
- [x] 通知偏好設定
- [x] 標籤管理功能
- [x] 藍圖概覽導航卡片

---

### 14. ISSUE-014: 元數據系統未實現

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 元數據系統完全未實現                        |
| 影響範圍 | 自訂欄位、分類系統                          |
| 業務影響 | 無法自訂資料欄位                            |
| 相關檔案 | `src/app/routes/blueprint/metadata/metadata.component.ts` |
| 狀態     | ✅ 部分完成 (自訂欄位管理 UI 已實現)        |
| 負責人   | Copilot                                     |
| 預計工時 | 28h                                         |
| 完成日期 | 2025-12-06                                  |

**已完成功能**:
- [x] 自訂欄位定義管理 UI (CRUD)
- [x] 支援 12 種欄位類型 (text, number, date, datetime, select, multiselect, checkbox, url, email, phone, user, file)
- [x] 實體類型分類 (任務、日誌、問題、品質檢查、驗收、檔案)
- [x] 欄位屬性設定 (必填、可見、排序)
- [x] 選項列表管理 (單選/多選欄位)
- [x] 統計卡片 (總欄位數、必填欄位、可見欄位、實體類型數)
- [x] 藍圖概覽導航卡片

**待完成功能**:
- [ ] 自訂欄位值儲存和顯示
- [ ] Schema 版本控制
- [ ] 欄位遷移腳本
- [ ] 分類系統整合

---

### 15. ISSUE-015: API 閘道未完善

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | API 閘道基礎已完成，但進階功能未實現        |
| 影響範圍 | API 管理、外部整合                          |
| 業務影響 | 無法進行 API 速率限制和外部整合             |
| 狀態     | 🟡 待處理                                   |
| 預計工時 | 32h                                         |

---

### 15.5 ISSUE-015.5: 驗收管理 UI 未實現

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 驗收管理 UI 尚未完全實現                    |
| 影響範圍 | 工程驗收流程管理                            |
| 業務影響 | 無法有效管理工程驗收和審批流程              |
| 相關檔案 | `src/app/routes/blueprint/acceptances/acceptances.component.ts` |
| 狀態     | ✅ 已修復                                   |
| 負責人   | Copilot                                     |
| 預計工時 | 24h                                         |
| 完成日期 | 2025-12-06                                  |

**已完成功能**:
- [x] 驗收列表頁面 (篩選、搜尋、分頁)
- [x] 驗收統計卡片 (總數、待驗收、已通過、未通過)
- [x] 驗收建立/編輯表單
- [x] 驗收詳情視圖
- [x] 驗收類型支援 (期中、最終、部分、階段、完工驗收)
- [x] 驗收決定流程 (核准、駁回、有條件核准、延後)
- [x] 藍圖概覽導航卡片

**待完成功能**:
- [ ] 驗收報告 PDF 導出
- [ ] 驗收附件上傳
- [ ] 多層審批流程

---

## 🟢 第四階段: P3 - 輕微問題 (可延後修復)

> **處理順序: 16-27**  
> **總工時: 43h**  
> **預計完成: Sprint 6+ (Week 11+)**

### 16. ISSUE-016: 成員資訊顯示 account_id 而非名稱

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 成員列表顯示 `account_id` 而非用戶名稱      |
| 影響範圍 | 成員列表顯示                                |
| 業務影響 | 用戶體驗不佳                                |
| 相關檔案 | `src/app/routes/blueprint/overview/overview.component.ts` |
| 狀態     | ✅ 已修復                                   |
| 預計工時 | 2h                                          |
| 完成日期 | 2025-12-05                                  |

**問題程式碼** (已修復):
```html
<span>{{ member.accountName || member.account_id }}</span>  <!-- 使用 fallback 模式 -->
```

---

### 17. ISSUE-017: 日期格式不一致

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 部分頁面使用 `toLocaleDateString`，部分使用 Angular DatePipe |
| 影響範圍 | 日期顯示                                    |
| 業務影響 | 用戶介面不一致                              |
| 狀態     | 🟢 待處理                                   |
| 預計工時 | 2h                                          |

**建議修復**:
- 統一使用 Angular DatePipe
- 定義標準日期格式

---

### 18. ISSUE-018: 錯誤處理訊息中英混用

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 部分錯誤訊息使用中文，部分使用英文          |
| 影響範圍 | 錯誤訊息顯示                                |
| 業務影響 | 用戶介面不一致                              |
| 狀態     | 🟢 待處理                                   |
| 預計工時 | 4h                                          |

**建議修復**:
- 將所有錯誤訊息整合到 i18n
- 統一語言

---

### 19. ISSUE-019: 空狀態 UI 不一致

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 各頁面空狀態顯示不一致                      |
| 影響範圍 | 列表頁面                                    |
| 業務影響 | 用戶體驗不一致                              |
| 狀態     | 🟢 待處理                                   |
| 預計工時 | 4h                                          |

---

### 20. ISSUE-020: Loading 狀態不一致

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 各頁面 Loading 狀態顯示不一致               |
| 影響範圍 | 資料載入                                    |
| 業務影響 | 用戶體驗不一致                              |
| 狀態     | 🟢 待處理                                   |
| 預計工時 | 4h                                          |

---

### 21. ISSUE-021: OAuth Callback 使用 Mock Model

| 屬性     | 內容                                              |
| -------- | ------------------------------------------------- |
| 問題描述 | OAuth Callback 元件使用 mockModel 方法            |
| 影響範圍 | 認證流程                                          |
| 業務影響 | 可能在生產環境產生問題                            |
| 相關檔案 | `src/app/routes/passport/callback.component.ts`   |
| 狀態     | ✅ 已修復                                         |
| 負責人   | Copilot                                           |
| 預計工時 | 2h                                                |
| 完成日期 | 2025-12-05                                        |

**修復內容**:
- 移除 mockModel() 方法，改用 Supabase PKCE 流程
- 使用 `exchangeCodeForSession()` 交換授權碼獲取 session
- 添加 Loading 狀態和錯誤處理 UI
- 整合 @delon/auth TokenService 進行 session 同步
- 根據 Context7 Supabase 文檔最佳實踐實現

**新程式碼**:
```typescript
// 使用 Supabase 交換授權碼獲取 session
const { data, error } = await this.supabaseService.client.auth.exchangeCodeForSession(code);
if (!error && data.session) {
  // 同步用戶資訊到 @delon/auth
  this.socialService.callback(userInfo);
  this.router.navigate([next]);
}
```

---

### 22. ISSUE-022: Task Edit Drawer 使用 Mock Fallback

| 屬性     | 內容                                                           |
| -------- | -------------------------------------------------------------- |
| 問題描述 | 任務編輯抽屜在失敗時使用 Mock 資料                             |
| 影響範圍 | 任務編輯功能                                                   |
| 業務影響 | 開發/生產環境行為不一致                                        |
| 相關檔案 | `src/app/routes/blueprint/tasks/task-edit-drawer.component.ts` |
| 狀態     | ✅ 已修復                                                      |
| 預計工時 | 2h                                                             |
| 完成日期 | 2025-12-05                                                     |

**問題程式碼** (已移除):
```typescript
// Mock fallback 機制已完全移除
// 現在使用正確的錯誤處理和 API 調用
```

---

### 23. ISSUE-023: Account Service 未實現實際資料載入

| 屬性     | 內容                                                |
| -------- | --------------------------------------------------- |
| 問題描述 | Account Service 有 TODO 註解表示未實現實際資料載入  |
| 影響範圍 | 帳戶服務                                            |
| 業務影響 | 帳戶功能可能不完整                                  |
| 相關檔案 | `src/app/shared/services/account.service.ts`        |
| 狀態     | 🟢 待處理                                           |
| 預計工時 | 4h                                                  |

**問題程式碼**:
```typescript
// account.service.ts
// TODO: 實現實際的資料載入邏輯
```

---

## 🔧 第五階段: 技術債務 (需要重構)

> **處理順序: 28-37**  
> **總工時: 154h**  
> **預計完成: 持續進行**

### 28. TD-001: 大型組件檔案需要拆分

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 部分組件檔案過大，超過專案規範              |
| 影響範圍 | 程式碼維護性                                |
| 業務影響 | 開發效率降低                                |
| 狀態     | 🔧 待處理                                   |
| 預計工時 | 16h                                         |

**需要拆分的檔案**:
| 檔案 | 行數 | 建議 |
| ---- | ---- | ---- |
| `src/app/routes/blueprint/tasks/tasks.component.ts` | 681 行 | 拆分為子組件 |
| `src/app/routes/blueprint/overview/overview.component.ts` | 859 行 | 拆分為子組件 |
| `src/app/shared/services/search/search.service.ts` | 600 行 | 拆分為多個服務 |

---

### 29. TD-002: 服務間依賴複雜

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 部分服務之間存在複雜的依賴關係              |
| 影響範圍 | 程式碼維護性                                |
| 業務影響 | 測試和維護困難                              |
| 狀態     | 🔧 待處理                                   |
| 預計工時 | 8h                                          |

---

### 30. TD-003: 缺乏單元測試覆蓋

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 目前專案缺乏足夠的單元測試覆蓋              |
| 影響範圍 | 程式碼品質                                  |
| 業務影響 | 回歸風險高                                  |
| 狀態     | 🔧 待處理                                   |
| 預計工時 | 54h                                         |

**目標覆蓋率**:
| 類型 | 目標 | 當前 |
| ---- | ---- | ---- |
| Store | 100% | ~0% |
| Service | 80%+ | ~10% |
| Component | 60%+ | ~5% |
| Utils | 100% | ~20% |

---

### 31. TD-004: TypeScript Strict Mode 警告

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 部分程式碼存在 TypeScript strict mode 警告  |
| 影響範圍 | 型別安全                                    |
| 業務影響 | 潛在運行時錯誤                              |
| 狀態     | 🔧 待處理                                   |
| 預計工時 | 6h                                          |

---

### 32. TD-005: 重複程式碼

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | 部分程式碼存在重複，需要提取為共用元件/服務 |
| 影響範圍 | 程式碼維護性                                |
| 業務影響 | 維護成本增加                                |
| 狀態     | 🔧 待處理                                   |
| 預計工時 | 8h                                          |

---

### 33. TD-006: Mock 資料未完全清理

| 屬性     | 內容                                                            |
| -------- | --------------------------------------------------------------- |
| 問題描述 | 多處程式碼仍包含 Mock 資料和開發用後備機制                      |
| 影響範圍 | 任務服務、認證回調                                              |
| 業務影響 | 開發/生產環境行為不一致                                         |
| 狀態     | ✅ 已修復                                                       |
| 負責人   | Copilot                                                         |
| 預計工時 | 3h                                                              |
| 完成日期 | 2025-12-05                                                      |

**已修復**:
- `src/app/routes/blueprint/tasks/tasks.component.ts` - loadMockData() 已移除
- `src/app/routes/blueprint/tasks/task-edit-drawer.component.ts` - mockTask fallback 已移除
- `src/app/shared/services/task/task.service.ts` - Mock 資料生成函數已移除
- `src/app/routes/passport/callback.component.ts` - mockModel() 已移除，改用 Supabase PKCE 流程

**所有 Mock 資料已完全清理！**

---

### 34. TD-007: TypeScript any 類型濫用

| 屬性     | 內容                                                            |
| -------- | --------------------------------------------------------------- |
| 問題描述 | 多處程式碼使用 `any` 類型而非具體型別                           |
| 影響範圍 | 型別安全、程式碼維護性                                          |
| 業務影響 | 潛在的運行時錯誤、IDE 自動完成失效                              |
| 狀態     | 🔧 待處理                                                       |
| 預計工時 | 8h                                                              |

**發現位置**:
| 檔案 | 行數 | 問題 |
| ---- | ---- | ---- |
| `src/app/routes/blueprint/members/members.component.ts` | 159 | `signal<any[]>([])` |
| `src/app/core/facades/blueprint/blueprint.facade.ts` | 105, 117, 124 | `Promise<any[]>`, `Promise<any>` |
| `src/app/shared/services/blueprint/blueprint.service.ts` | 173, 187, 206 | `Promise<any[]>`, `Promise<any>` |
| `src/app/core/infra/repositories/search/search.repository.ts` | 139, 170, 201, 226, 345, 451, 474, 496, 518 | 多處 `any` 類型 |

**建議修復**:
- 為藍圖成員定義 `BlueprintMember` 介面
- 為搜尋結果定義具體型別
- 使用泛型替代 `any`

---

### 35. TD-008: console.log 未清理

| 屬性     | 內容                                                            |
| -------- | --------------------------------------------------------------- |
| 問題描述 | 生產程式碼中存在大量 console.log/error/warn 語句                |
| 影響範圍 | 效能、安全性、程式碼品質                                        |
| 業務影響 | 可能洩露敏感資訊、影響效能                                      |
| 狀態     | 🔧 待處理                                                       |
| 預計工時 | 4h                                                              |

**發現位置** (共 50+ 處):
| 檔案 | 說明 |
| ---- | ---- |
| `src/app/routes/passport/lock/lock.component.ts:35,36` | `console.log('Valid!')` |
| `src/app/routes/passport/login/login.component.ts:102` | `console.error('Login error:', err)` |
| `src/app/core/net/refresh-token.ts:75` | `console.log(res)` |
| `src/app/core/facades/account/base-account-crud.facade.ts` | 6 處 console.log/error |
| `src/app/routes/blueprint/*` | 多處 console.error |
| `src/app/routes/account/*` | 多處 console.error |

**建議修復**:
- 使用統一的 Logger 服務替代 console 語句
- 在生產環境禁用 debug 級別日誌
- 移除開發用的 console.log

---

### 36. TD-009: Deprecated 方法未移除

| 屬性     | 內容                                                            |
| -------- | --------------------------------------------------------------- |
| 問題描述 | 存在標記為 @deprecated 的方法仍在使用                           |
| 影響範圍 | 任務服務                                                        |
| 業務影響 | 技術債累積、維護困難                                            |
| 相關檔案 | `src/app/shared/services/task/task.service.ts`                  |
| 狀態     | ✅ 已修復                                                       |
| 預計工時 | 4h                                                              |
| 完成日期 | 2025-12-05                                                      |

**已修復**:
所有 deprecated 方法已從 task.service.ts 移除：
- loadMockData() - 已移除
- createMockTask() - 已移除
- updateMockTask() - 已移除
- 相關的 Mock 資料 - 已移除

---

### 37. TD-010: 大型檔案需拆分

| 屬性     | 內容                                                            |
| -------- | --------------------------------------------------------------- |
| 問題描述 | 多個檔案超過 500 行，違反專案規範                               |
| 影響範圍 | 程式碼維護性、可讀性                                            |
| 業務影響 | 開發效率降低、程式碼審查困難                                    |
| 狀態     | 🔧 待處理                                                       |
| 預計工時 | 24h                                                             |

**超過 500 行的檔案**:
| 檔案 | 行數 | 建議 |
| ---- | ---- | ---- |
| `src/app/core/infra/repositories/problem/problem.repository.ts` | 910 | 拆分為多個 Repository |
| `src/app/routes/blueprint/overview/overview.component.ts` | 858 | 拆分為子組件 |
| `src/app/shared/services/diary/diary.service.ts` | 826 | 拆分為多個服務 |
| `src/app/shared/services/problem/problem.service.ts` | 814 | 拆分為多個服務 |
| `src/app/shared/services/file/file.service.ts` | 809 | 拆分為多個服務 |
| `src/app/routes/blueprint/financial/payment-request-list.component.ts` | 720 | 拆分為子組件 |
| `src/app/shared/services/financial/financial.service.ts` | 703 | 拆分為多個服務 |
| `src/app/shared/services/task/task.service.ts` | 689 | 拆分為多個服務 |
| `src/app/layout/basic/widgets/search.component.ts` | 687 | 拆分為子組件 |
| `src/app/routes/blueprint/tasks/tasks.component.ts` | 681 | 拆分為子組件 |

---

## 🟢 P3 - 輕微問題 (新增)

### 24. ISSUE-024: Account Service 有 TODO 未實現

| 屬性     | 內容                                                |
| -------- | --------------------------------------------------- |
| 問題描述 | Account Service 中有 TODO 註解表示功能未實現        |
| 影響範圍 | 帳戶服務                                            |
| 業務影響 | 帳戶功能可能不完整                                  |
| 相關檔案 | `src/app/shared/services/account.service.ts`        |
| 狀態     | 🟢 待處理                                           |
| 預計工時 | 2h                                                  |

**程式碼證據**:
```typescript
// src/app/shared/services/account.service.ts
// TODO: 實現實際的資料載入邏輯
```

---

### 25. ISSUE-025: Demo 頁面 TODO 未處理

| 屬性     | 內容                                                            |
| -------- | --------------------------------------------------------------- |
| 問題描述 | Demo 頁面存在 TODO 註解未處理                                   |
| 影響範圍 | Demo 頁面功能                                                   |
| 業務影響 | 示範功能不完整                                                  |
| 相關檔案 | `src/app/routes/demo/pro/list/articles/articles.component.ts`   |
| 狀態     | 🟢 待處理                                                       |
| 預計工時 | 1h                                                              |

**程式碼證據**:
```typescript
// TODO: wait nz-dropdown OnPush mode
```

---

### 26. ISSUE-026: Refresh Token Mock 值

| 屬性     | 內容                                        |
| -------- | ------------------------------------------- |
| 問題描述 | Token 刷新機制使用 Mock expired value       |
| 影響範圍 | 認證流程                                    |
| 業務影響 | 可能影響 Token 刷新的準確性                 |
| 相關檔案 | `src/app/core/net/refresh-token.ts`         |
| 狀態     | 🟢 待處理                                   |
| 預計工時 | 2h                                          |

**程式碼證據**:
```typescript
// TODO: Mock expired value
```

---

### 27. ISSUE-027: Todos 組件使用 Placeholder 邏輯

| 屬性     | 內容                                                            |
| -------- | --------------------------------------------------------------- |
| 問題描述 | Team/User Todos 組件使用 Placeholder 邏輯而非實際資料           |
| 影響範圍 | 待辦事項功能                                                    |
| 業務影響 | 待辦事項功能不完整                                              |
| 相關檔案 | `src/app/routes/account/todos/components/team-todos.component.ts:56` <br> `src/app/routes/account/todos/components/user-todos.component.ts:56` |
| 狀態     | 🟢 待處理                                                       |
| 預計工時 | 4h                                                              |

**程式碼證據**:
```typescript
// Placeholder - would fetch from service
```

---

## 📝 問題追蹤表

| 問題編號   | 嚴重程度 | 狀態   | 負責人 | 預計完成日期 | 預計工時 |
| ---------- | -------- | ------ | ------ | ------------ | -------- |
| ISSUE-001  | 🔴 P0    | 待處理 | -      | -            | 11h      |
| ISSUE-002  | 🔴 P0    | 待處理 | -      | -            | 7h       |
| ISSUE-003  | 🔴 P0    | 待處理 | -      | -            | 16h      |
| ISSUE-004  | 🔴 P0    | 待處理 | -      | -            | 4h       |
| ISSUE-003  | 🔴 P0    | ✅ 已修復 | Copilot | 2025-12-05   | 16h      |
| ISSUE-004  | 🔴 P0    | ✅ 已修復 | -       | 2025-12-05   | 4h       |
| ISSUE-005  | 🟠 P1    | 🟡 部分完成 | -   | 2025-12-05   | 26h (10h剩餘) |
| ISSUE-006  | 🟠 P1    | 🟡 部分完成 | -   | 2025-12-05   | 28h (10h剩餘) |
| ISSUE-007  | 🟠 P1    | 🟡 部分完成 | -   | 2025-12-05   | 32h (16h剩餘) |
| ISSUE-008  | 🟠 P1    | 🟡 部分完成 | -   | 2025-12-05   | 30h (18h剩餘) |
| ISSUE-009  | 🟠 P1    | ✅ 已修復 | Copilot | 2025-12-06   | 28h      |
| ISSUE-010  | 🟡 P2    | ✅ 已修復 | Copilot | 2025-12-06   | 30h      |
| ISSUE-011  | 🟡 P2    | ✅ 已修復 | Copilot | 2025-12-06   | 32h      |
| ISSUE-012  | 🟡 P2    | ✅ 已修復 | Copilot | 2025-12-06   | 30h      |
| ISSUE-013  | 🟡 P2    | ✅ 已修復 | Copilot | 2025-12-06   | 30h      |
| ISSUE-014  | 🟡 P2    | 🟡 部分完成 | Copilot | 2025-12-06   | 28h (16h剩餘) |
| ISSUE-015  | 🟡 P2    | 待處理 | -      | -            | 32h      |
| ISSUE-016  | 🟢 P3    | ✅ 已修復 | -      | 2025-12-05   | 2h       |
| ISSUE-017  | 🟢 P3    | 待處理 | -      | -            | 2h       |
| ISSUE-018  | 🟢 P3    | 待處理 | -      | -            | 4h       |
| ISSUE-019  | 🟢 P3    | 待處理 | -      | -            | 4h       |
| ISSUE-020  | 🟢 P3    | 待處理 | -      | -            | 4h       |
| ISSUE-021  | 🟢 P3    | ✅ 已修復 | Copilot | 2025-12-05   | 2h       |
| ISSUE-022  | 🟢 P3    | ✅ 已修復 | -      | 2025-12-05   | 2h       |
| ISSUE-023  | 🟢 P3    | 待處理 | -      | -            | 4h       |
| ISSUE-024  | 🟢 P3    | 待處理 | -      | -            | 2h       |
| ISSUE-025  | 🟢 P3    | 待處理 | -      | -            | 1h       |
| ISSUE-026  | 🟢 P3    | 待處理 | -      | -            | 2h       |
| ISSUE-027  | 🟢 P3    | 待處理 | -      | -            | 4h       |
| TD-001     | 🔧 TD    | 待處理 | -      | -            | 16h      |
| TD-002     | 🔧 TD    | 待處理 | -      | -            | 8h       |
| TD-003     | 🔧 TD    | 待處理 | -      | -            | 54h      |
| TD-004     | 🔧 TD    | 待處理 | -      | -            | 6h       |
| TD-005     | 🔧 TD    | 待處理 | -      | -            | 8h       |
| TD-006     | 🔧 TD    | ✅ 已修復 | Copilot | 2025-12-05   | 3h       |
| TD-007     | 🔧 TD    | 待處理 | -      | -            | 8h       |
| TD-008     | 🔧 TD    | 待處理 | -      | -            | 4h       |
| TD-009     | 🔧 TD    | ✅ 已修復 | -      | 2025-12-05   | 4h       |
| TD-010     | 🔧 TD    | 待處理 | -      | -            | 24h      |

---

## 📊 工時統計

| 嚴重程度   | 問題數 | 已修復 | 總預計工時 | 已節省工時 |
| ---------- | ------ | ------ | ---------- | ---------- |
| 🔴 P0 阻塞 | 5      | 5      | 38h        | 38h        |
| 🟠 P1 關鍵 | 5      | 0      | 144h       | 0h         |
| 🟡 P2 重要 | 6      | 0      | 182h       | 0h         |
| 🟢 P3 輕微 | 12     | 3      | 33h        | 6h         |
| 🔧 技術債  | 10     | 2      | 131h       | 7h         |
| **總計**   | **38** | **10** | **528h**   | **51h**    |

---

## 🎯 修復優先順序建議

### Sprint 1 (Week 1-2): P0 阻塞問題 - ✅ 已完成
1. ✅ ISSUE-001: 藍圖編輯功能 (11h)
2. ✅ ISSUE-002: 概覽頁面資訊架構 (7h)
3. ✅ ISSUE-003: 概覽未達生產標準 (16h)
4. ✅ ISSUE-004: Mock 資料移除 (4h)
5. ✅ ISSUE-028: 資料庫欄位修復 (2h)

### Sprint 2 (Week 3-4): P1 關鍵問題 (1/2) - 62h
5. ISSUE-008: 時間軸 UI (30h)
6. ISSUE-007: 通知中心 UI (32h)

### Sprint 3 (Week 5-6): P1 關鍵問題 (2/2) - 82h
7. ISSUE-006: 搜尋功能整合 (28h)
8. ISSUE-009: 日誌管理 UI (28h)
9. ISSUE-005: 權限系統完善 (26h)

### Sprint 4 (Week 7-8): P2 重要問題 (1/2) - 62h
10. ISSUE-010: 品質驗收 UI (30h)
11. ISSUE-011: 檔案管理 UI (32h)

### Sprint 5 (Week 9-10): P2 重要問題 (2/2) - 120h
12. ISSUE-012: 關聯管理完善 (30h)
13. ISSUE-013: 配置中心 (30h)
14. ISSUE-014: 元數據系統 (28h)
15. ISSUE-015: API 閘道完善 (32h)

### Sprint 6+ (持續): P3 + 技術債 - 175h
16. 所有 P3 輕微問題 (37h)
17. 所有技術債務 (138h)

### Sprint 5+ (Week 9+): 剩餘問題
10. 其他 P2 問題
11. P3 輕微問題
12. 技術債務

---

## 🔍 技術債詳細清單

| 編號   | 類別 | 問題 | 檔案數 | 工時 |
| ------ | ---- | ---- | ------ | ---- |
| TD-001 | 結構 | 大型組件檔案需要拆分 | 3 | 16h |
| TD-002 | 結構 | 服務間依賴複雜 | 5+ | 8h |
| TD-003 | 測試 | 缺乏單元測試覆蓋 | 全域 | 54h |
| TD-004 | 型別 | TypeScript Strict Mode 警告 | 10+ | 6h |
| TD-005 | 程式碼 | 重複程式碼 | 8+ | 8h |
| TD-006 | Mock | Mock 資料未完全清理 | 4 | 6h |
| TD-007 | 型別 | any 類型濫用 | 15+ | 8h |
| TD-008 | 日誌 | console.log 未清理 | 50+ | 4h |
| TD-009 | 棄用 | Deprecated 方法未移除 | 1 | 4h |
| TD-010 | 結構 | 大型檔案需拆分 (10個超500行) | 10 | 24h |

---

**最後更新**: 2025-12-05

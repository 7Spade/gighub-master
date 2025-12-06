# GigHub 開發規劃筆記

> 參考文件：`docs\NEXT_DEVELOPMENT_GUIDE.md`  
> 實施前請先使用 Context7 查詢相關技術文件確保品質要求

---

## 📋 測試帳號資訊

- **帳號**: `ac7x@pm.me`
- **密碼**: `123123`

---

## 🎯 開發品質要求（通用標準）

### 核心品質原則

| 分類 | 要求項目 |
|------|---------|
| **基礎品質** | 現代化 (Modernization)、企業化 (Enterprise-readiness)、結構化 (Structured Architecture) |
| **生產級標準** | 生產級 (Production-grade)、可預測性 (Predictability)、一致性 (Consistency) |
| **可用性** | 高可用 (High Availability)、可靠性 (Reliability) |
| **擴展性** | 可擴展性 / 延展性 (Scalability)、可維護性 (Maintainability) |
| **安全性** | 安全性 (Security)、合規性 (Compliance) |
| **可追蹤性** | 可追蹤性 (Traceability / Auditing)、可觀測性 (Observability) |
| **用戶體驗** | 用戶體驗 (User Experience)、開發者體驗 (Developer Experience) |
| **架構設計** | 模組化 (Modular / Componentized)、解耦 (Decoupled / Loose Coupling)、聚合根（DDD）、領域邊界 (Bounded Context) |
| **運行監控** | 可觀測性 (Observability)、運行指標 (Metrics)、健康檢查 (Health Check / Heartbeat) |
| **工作流** | 生命週期管理 (Lifecycle Management)、狀態機 (State Machine)、事件驅動 (Event-driven Architecture / EDA) |
| **管理原則** | 閉環管理 (Closed-loop Control)、回饋迴路 (Feedback Loop)、標準化 (Standardization)、責任分界 (Responsibility Segregation) |

### 資料管理特殊要求

| 項目 | 要求 |
|------|------|
| **不可變性** | 不可變性 (Immutable Records)、Append-only Storage、審計證據鏈 (Evidence Chain) |
| **性能** | 高吞吐量 (High Throughput)、延遲敏感 (Latency-sensitive)、批次與流式處理 (Batch & Streaming) |
| **資料管理** | 冷熱資料分層 (Hot/Cold Storage)、TTL / 資料生命周期管理 (Data Retention / Lifecycle Policy) |
| **彈性** | 水平擴展 (Horizontal Scaling)、分散式架構 (Distributed-ready) |

### UI/UX 要求

- 可視化審計日誌 (Audit Visualization)
- Timeline Animation
- Context-aware Rendering
- 響應式設計 (Responsive / Adaptive UI)
- 可訪問性 (Accessibility / a11y)
- 互動與提示 (Interactive / Feedback / Loading Indicators / Skeleton Screens)
- 與 ng-zorro-antd 良好搭配

---

## 📦 模組一：審計與日誌系統

### 1.1 操作審計日誌 (Audit Log)

**核心概念**:
- 行為證據鏈 (Activity Chain)
- 操作上下文 (Execution Context)
- 審計事件分類 (Event Taxonomy)
- 跨系統事件聚合 (Cross-domain Aggregation)

**特殊要求**:
- 不可變性 (Immutable Records)
- Append-only Storage
- 審計證據鏈 (Evidence Chain)

### 1.2 時間軸服務 (Timeline Service)

**核心概念**:
- 事件時間序 (Temporal Ordering)
- 因果一致性 (Causal Consistency)
- 跨模組事件對齊 (Cross Module Sync)
- 視圖投影 (Projection Model)

**適用場景**:
- 時間軸服務特別適用於水平擴展 (Horizontal Scaling) 和分散式架構 (Distributed-ready)

### 1.3 施工日誌模組 (Diary Module)

**核心概念**:
- 現場證據紀錄 (Field Evidence Records)
- 施工上下文 (Construction Context)
- 工作流連結 (Workflow-bound Notes)
- 人機協作註記 (Human-in-the-loop Logging)

**職責**:
- 現場紀錄、照片、材料、進度、證據勾選
- **不做判斷，僅做「事實紀錄」**

---

## 🔄 模組二：品管與驗收工作流

### 2.1 工作流程圖

```
任務提交 (Task Submission)
        ↓
日誌紀錄與勾選 (Diary / Evidence Logging)
        ↓
品管檢查 (Quality Control / QC Inspection)
        ↓
驗收流程 (Acceptance)
        ├── 驗收成功 → 任務結案 (Close Task)
        └── 驗收失敗 → 問題模組 (Problem Management)
                         ↓
                    問題處置流程 (Problem Handling Workflow)
                         ↓
               回到「品管檢查」或「驗收」，直到成功
```

### 2.2 模組職責劃分

| 模組 | 職責 | 不做的事 |
|------|------|---------|
| **任務模組 (Task Module)** | 任務建立、分派、進度、提交完成事件 | 不做日誌/品管/驗收邏輯 |
| **施工日誌模組 (Diary Module)** | 現場紀錄、照片、材料、進度、證據勾選 | 不做判斷，僅做「事實紀錄」 |
| **品管模組 (Quality Control Module)** | 依標準檢查日誌與成果，產生「可否進入驗收」的認定 | 不做結案與合格裁決 |
| **驗收模組 (Acceptance Module)** | 最終合格判斷、審批、證明文件、可追溯審計 | 不進行缺失處理 |
| **問題模組 (Problem Module)** | 問題管理、處置、驗證 | - |

### 2.3 問題模組 (Problem Management Module)

| Classification | Keyword | Description / Purpose |
| -------------- | ------- | --------------------- |
| 核心概念 | Problem Management | 統一管理所有非預期事項 |
| 問題類型 | Issue Type | Defect, Risk, Gap, Improvement Request, CR |
| 問題路徑 | Problem Lifecycle | Open → Assess → Assign → Resolve → Verify → Close |
| 問題評估 | Impact Assessment | 影響層級、成本、風險、時程影響 |
| 問題分派 | Assignment Matrix | 依角色權限與責任進行分派 |
| 處置流程 | Resolution Workflow | 修復、替代方案、流程改善、教育訓練等 |
| 驗證流程 | Resolution Verification | 回到 QC 或驗收重新檢查 |
| 優先級管理 | Severity / Priority | Critical / High / Medium / Low |
| 風險預警 | Risk Flag | 高風險任務需額外審核 |
| 可追蹤性 | Traceability | 問題串聯任務、日誌、檔案、責任人 |
| 知識回饋 | Knowledge Base | 問題解決後轉為知識資料 |
| 報表輸出 | Problem Insights | 問題統計、趨勢、責任項追蹤 |

### 2.4 相關術語對照

| 中文詞條 | 英文詞條 |
|---------|---------|
| 品管模組 | Quality Control Module (QC Module) |
| 驗收模組 | Acceptance Module |
| 問題模組 | Problem Management Module |
| 問題生命周期 | Problem Lifecycle |
| 問題池 | Issue Pool |
| 整改 / 處置流程 | Resolution Workflow |
| 再驗證 / 再驗收 | Re-verification / Re-acceptance |

---

## 💰 模組三：財務管理

### 3.1 擴展計劃

**目標**: 從 `supabase\seeds\init.sql` 擴展財務功能

**核心表結構**:
- `contracts`（合約／預算起點）
- `expenses`（成本支出紀錄）
- `payment_requests`（請款單，使用生命周期 lifecycle）
- `payments`（付款紀錄）

**設計原則**:
- 每張表皆帶 `blueprint_id`
- 權限沿用 `blueprint_members / roles`，不需改動
- 狀態機沿用 `lifecycle_transitions`，不新增 status enum
- 可擴展性高，後續可加入 `change_orders / vendors / tax / retainage`

### 3.2 資料表設計

#### (1) contracts — 合約 & 預算起點

```sql
CREATE TABLE contracts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blueprint_id BIGINT NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  vendor_name TEXT,           -- 可擴展 vendor 模組
  contract_amount NUMERIC(18,2) NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### (2) expenses — 成本實際投入紀錄

```sql
CREATE TABLE expenses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blueprint_id BIGINT NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  contract_id BIGINT REFERENCES contracts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### (3) payment_requests — 請款單 (使用 lifecycle)

```sql
CREATE TABLE payment_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blueprint_id BIGINT NOT NULL REFERENCES blueprints(id) ON DELETE CASCADE,
  contract_id BIGINT REFERENCES contracts(id) ON DELETE SET NULL,
  requested_amount NUMERIC(18,2) NOT NULL,
  lifecycle blueprint_lifecycle NOT NULL DEFAULT 'draft',  -- 🔥 用現有 enum
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### (4) payments — 實際付款紀錄

```sql
CREATE TABLE payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_request_id BIGINT NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
  paid_amount NUMERIC(18,2) NOT NULL,
  paid_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 狀態機觸發器

```sql
CREATE OR REPLACE FUNCTION payment_request_lifecycle_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lifecycle IS DISTINCT FROM OLD.lifecycle THEN
    INSERT INTO lifecycle_transitions (
      entity_type,
      entity_id,
      from_state,
      to_state,
      changed_by,
      metadata
    ) VALUES (
      'payment_request',
      NEW.id,
      OLD.lifecycle,
      NEW.lifecycle,
      auth.uid(),
      jsonb_build_object('note', 'lifecycle changed')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3.4 實施步驟

1. 使用 Supabase MCP 查看既有數據庫
2. 分析如何擴展財務功能（涉及多次收付款與請款狀態、收款狀態等）
3. 使用 Context7 查看最現代化的相關文件並分析如何實現
4. 回覆在 RP（Review Process）

---

## 📊 模組四：Dashboard 系統

### 4.1 Dashboard 類型與適用場景

| Dashboard | 個人 | 組織 | 團隊 | 藍圖 |
|-----------|:----:|:----:|:----:|:----:|
| Analysis | ❌ | ✅ | ❌ | ✅ |
| Monitor | ❌ | ✅ | ❌ | ✅ |
| V1 | ✅ | ❌ | ✅ | ❌ |
| Workplace | ✅ | ❌ | ✅ | ❌ |

### 4.2 Dashboard 路徑對照

| 用途 | URL |
|------|-----|
| 財務 | `http://localhost:4200/#/dashboard/analysis` |
| 組織 | `http://localhost:4200/#/dashboard/monitor` |
| 藍圖 | `http://localhost:4200/#/dashboard/workplace` |
| 個人/團隊 | `http://localhost:4200/#/dashboard/v1` |

### 4.3 Dashboard 檔案位置

**路徑**: `src\app\routes\demo\dashboard`

- `analysis` - 適合財務
- `v1` - 適合個人 / 團隊
- `monitor` - 適合組織
- `workplace` - 適合藍圖

**改造要求**:
- 使用 Context7 查詢設計文件
- 對 UI 構建，使樣式更現代化（選用）

---

## 🧩 模組五：Widget 改造

### 5.1 待改造的 Widget 元件

| Widget | 檔案路徑 | 改造目標 |
|--------|---------|---------|
| 任務 Widget | `src\app\layout\basic\widgets\task.component.ts` | 成為規劃中的助力而不是 DEMO |
| 通知 Widget | `src\app\layout\basic\widgets\notify.component.ts` | 成為規劃中的助力而不是 DEMO |
| 圖標 Widget | `src\app\layout\basic\widgets\icon.component.ts` | 成為規劃中的助力而不是 DEMO |
| 搜尋 Widget | `src\app\layout\basic\widgets\search.component.ts` | 成為規劃中的助力而不是 DEMO |

### 5.2 改造要求

- 參考 `docs\NEXT_DEVELOPMENT_GUIDE.md`
- 確保符合開發品質要求
- 與 ng-zorro-antd 良好搭配

---

## 📁 模組六：檔案管理基礎

### 6.1 規劃目標

**實現**: "檔案管理基礎 (File Infrastructure)"  
**技術**: 使用 Supabase Storage  
**改造**: 使 `src\app\layout\basic\widgets\icon.component.ts` 成為規劃中的助力而不是 DEMO

### 6.2 品質要求

- 現代化 (Modernization)
- 企業化 (Enterprise-readiness)
- 結構化 (Structured)
- 高可用 (High Availability / Reliability)
- 安全性 (Security)
- 可擴展性 (Scalability)
- 可追蹤性 (Traceability / Auditing)
- 可維護性 (Maintainability)
- 用戶體驗 (User Experience / Developer Experience)
- 與 ng-zorro-antd 良好搭配

---

## 🔍 模組七：搜尋引擎

### 7.1 規劃目標

**實現**: "搜尋引擎 (Search Engine)"  
**改造**: 使 `src\app\layout\basic\widgets\search.component.ts` 成為規劃中的助力而不是 DEMO

### 7.2 核心功能要求

| 分類 | 要求項目 |
|------|---------|
| **搜尋性能** | 高效搜尋 (Efficient Search / Fast Querying)：優化查詢邏輯，支援索引、全文檢索、分頁 |
| **響應速度** | 低延遲 (Low Latency / Response Time)：確保用戶操作及時反饋 |
| **緩存策略** | 緩存策略 (Caching / Memoization)：減少重複請求，提高效率 |
| **架構設計** | 模組化 (Modular / Componentized)、微服務兼容 (Microservices-ready / API-first)、分層架構 (Layered / Clean Architecture) |
| **安全性** | 授權與認證 (Authentication / Authorization)、資料隱私 (Data Privacy / GDPR / PII-safe)、輸入驗證 (Input Validation / Sanitization) |
| **可觀測性** | 日誌與追蹤 (Logging / Auditing / Tracing)、監控與警報 (Monitoring / Alerts / Metrics) |
| **測試與品質** | 單元測試 / 集成測試 (Unit Test / Integration Test / Test Coverage)、代碼規範 (Coding Standards / Lint / Prettier)、文檔與注釋 (Documentation / Docstrings) |
| **用戶體驗** | 響應式設計 (Responsive / Adaptive UI)、可訪問性 (Accessibility / a11y)、互動與提示 (Interactive / Feedback / Loading Indicators / Skeleton Screens) |
| **開發體驗** | 開發者工具友好 (DevTools-friendly / Hot Reload / Storybook) |
| **進階功能** | 智能搜尋 (Intelligent / AI-assisted / Relevance Ranking / Synonyms / Fuzzy Matching)、高級過濾 (Advanced Filtering / Faceted Search / Multi-criteria Search)、自動補全 (Autocomplete / Typeahead / Suggestions) |
| **國際化** | 多語言 / 本地化 (i18n / l10n / Unicode support) |
| **UI 框架** | 與 ng-zorro-antd 良好搭配 |

### 7.3 品質要求

- 現代化 (Modernization)
- 企業化 (Enterprise-readiness)
- 結構化 (Structured)
- 高可用 (High Availability / Reliability)
- 安全性 (Security)
- 可擴展性 (Scalability)
- 可追蹤性 (Traceability / Auditing)
- 可維護性 (Maintainability)
- 用戶體驗 (User Experience / Developer Experience)

---

## 🗂️ 模組八：系統功能清單

### 8.1 核心功能模組

- 概覽（Dashboard）
- 檔案（Documents / Deliverables）
- 活動（Tasks / Activities）
- 進度（Progress / Milestones）
- 日誌（Logs / Audit）
- 品管（Quality Assurance）
- 驗收（Acceptance）
- 財務（Finance）
- 設置（Settings）

### 8.2 擴展功能模組

- 角色與權限（RBAC / IAM）
- 通知中心（Inbox / Alerts）
- 工作流程引擎（Workflow / Lifecycle）
- 風險管理（Risk Register）
- 資源與人力管理（Resource / HR Lite）
- 合規 / 稽核（Compliance / Audit Governance）
- 看板 / 甘特圖（Kanban / Gantt）
- 報表中心（BI / Reports）
- 採購 / 供應商（Procurement / Vendor）
- 設備 / 資產管理（Assets）
- 變更管理（Change Control）
- 文件版控（Versioning）
- 審查中心（Review Board）

### 8.3 基礎設施模組

- 工作流程引擎（Workflow / Lifecycle）
- 風險管理（Risk Register）
- 看板 / 甘特圖（Kanban / Gantt）
- 報表中心（BI / Reports）
- 里程碑管理系統
- 版本控制系統
- 標籤系統
- 評論系統
- 附件管理系統
- 報表引擎
- 甘特圖引擎
- 儀表板引擎

### 8.4 優先級標記

- ⭐⭐⭐ 風險管理基礎 (Risk Management)
- ⭐⭐⭐ 資源管理基礎 (Resource Management)
- ⭐⭐ 採購管理基礎 (Procurement)
- ⭐⭐ 資產管理基礎 (Asset Management)
- ⭐⭐⭐ 變更管理基礎 (Change Control)

---

## 📝 備註

- 所有模組實施前請先使用 Context7 查詢相關技術文件
- 確保符合開發品質要求（見「開發品質要求」章節）
- 參考文件：`docs\NEXT_DEVELOPMENT_GUIDE.md`
- 測試帳號：`ac7x@pm.me` / `123123`

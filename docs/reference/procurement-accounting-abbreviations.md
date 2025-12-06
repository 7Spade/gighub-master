# 📋 採購、請款、會計相關縮寫大全

> GigHub 工地施工進度追蹤管理系統 - 採購、請款、會計、專案管理專業術語縮寫參考手冊

本文件整理了工程專案管理中常用的採購、會計、財務及專案管理相關縮寫，方便團隊成員在系統開發和業務溝通中快速查閱參考。

---

## 目錄

- [採購 (Procurement)](#採購-procurement)
- [交貨與驗收 (Logistics & Receipt)](#交貨與驗收-logistics--receipt)
- [請款與發票 (Invoice / Billing)](#請款與發票-invoice--billing)
- [會計與財務 (Finance & Accounting)](#會計與財務-finance--accounting)
- [專案與成本管理 (Project & Cost Management)](#專案與成本管理-project--cost-management)
- [工地與品質管理 (Construction Site & Quality)](#工地與品質管理-construction-site--quality)
- [相關資源](#相關資源)

---

## 🔵 採購 (Procurement)

採購流程是工程專案管理的重要環節，以下是常用的採購相關縮寫：

| 縮寫 | 全名 | 中文 | 說明 |
|------|------|------|------|
| **RFQ** | Request for Quotation | 詢價單 | 向供應商索取產品或服務報價的正式文件 |
| **RFP** | Request for Proposal | 企劃書請求 | 向供應商索取完整專案提案的文件，通常用於複雜項目 |
| **RFI** | Request for Information | 資訊請求 | 向供應商索取產品或服務資訊的初步查詢 |
| **PO** | Purchase Order | 採購單 | 買方向賣方發出的正式採購訂單，具有法律約束力 |
| **PR** | Purchase Requisition | 請購單 | 內部申請採購的需求文件，需經過審批流程 |
| **SO** | Sales Order | 銷售訂單 | 供應商對採購單的確認訂單（供應商對買方） |
| **BO** | Back Order | 延後交貨訂單 | 暫時缺貨但確認稍後交貨的訂單 |

### 採購流程範例

```
1. PR (請購單) → 2. RFQ (詢價) → 3. PO (採購單) → 4. SO (銷售訂單) → 5. GR (驗收)
```

---

## 🟢 交貨與驗收 (Logistics & Receipt)

交貨與驗收環節確保物料按時按質送達現場：

| 縮寫 | 全名 | 中文 | 說明 |
|------|------|------|------|
| **GR** | Goods Receipt | 驗收 / 收貨 | 確認收到貨物並記錄入庫的程序 |
| **GI** | Goods Issue | 出貨 | 貨物從倉庫發出給客戶或工地的程序 |
| **DN** | Delivery Note | 送貨單 | 隨貨物一起送達的送貨證明文件 |
| **DO** | Delivery Order | 交貨單 | 授權提貨或交貨的指令文件 |
| **ASN** | Advanced Shipping Notice | 預先出貨通知 | 供應商提前通知買方貨物即將發出的資訊 |

### 交貨流程範例

```
1. ASN (預先通知) → 2. DN/DO (送貨單) → 3. GR (驗收) → 4. 入庫
```

---

## 🟡 請款與發票 (Invoice / Billing)

請款與發票處理是財務管理的核心流程：

| 縮寫 | 全名 | 中文 | 說明 |
|------|------|------|------|
| **IV** | Invoice Verification | 發票驗證 | SAP 系統中的發票驗證流程 |
| **INV / IV** | Invoice | 發票 | 賣方向買方索取貨款的正式憑證 |
| **AP** | Accounts Payable | 應付帳款 | 企業應支付給供應商的款項 |
| **AR** | Accounts Receivable | 應收帳款 | 企業應向客戶收取的款項 |
| **VAT** | Value-Added Tax | 增值稅（營業稅）| 消費稅，台灣稱為營業稅 |
| **CR** | Credit Note | 折讓單 | 供應商給予買方的退款或折扣證明 |
| **DR** | Debit Note | 借項單 | 買方向供應商索取額外費用的通知單 |

### 請款流程範例

```
1. GR (驗收) → 2. INV (發票) → 3. IV (發票驗證) → 4. AP (應付帳款) → 5. 付款
```

---

## 🟠 會計與財務 (Finance & Accounting)

會計與財務管理確保專案成本控制與資金運用：

| 縮寫 | 全名 | 中文 | 說明 |
|------|------|------|------|
| **GL** | General Ledger | 總帳 | 記錄所有財務交易的主要帳簿 |
| **SL** | Sub Ledger | 明細帳 | 記錄特定類型交易的細項帳簿（如應收、應付明細） |
| **COGS** | Cost of Goods Sold | 銷貨成本 | 銷售產品或服務的直接成本 |
| **OPEX** | Operating Expense | 營業費用 | 日常營運所需的經常性支出 |
| **CAPEX** | Capital Expenditure | 資本支出 | 購置固定資產或長期投資的支出 |
| **FIFO** | First In First Out | 先進先出 | 存貨計價方法：最早進貨的先出售 |
| **LIFO** | Last In First Out | 後進先出 | 存貨計價方法：最晚進貨的先出售 |
| **FX** | Foreign Exchange | 外匯 | 不同貨幣之間的兌換 |

### 會計科目關聯範例

```
GL (總帳)
├── AR (應收帳款 - SL)
├── AP (應付帳款 - SL)
├── COGS (銷貨成本)
├── OPEX (營業費用)
└── CAPEX (資本支出)
```

---

## 🔴 專案與成本管理 (Project & Cost Management)

專案管理與成本控制是工程專案成功的關鍵：

| 縮寫 | 全名 | 中文 | 說明 |
|------|------|------|------|
| **BOQ** | Bill of Quantities | 工程清單 / 工料表 | 詳細列出工程項目、數量與單價的清單 |
| **WBS** | Work Breakdown Structure | 工作分解結構 | 將專案分解為可管理的工作包的階層結構 |
| **PRJ** | Project | 專案 | 具有明確目標、時程與預算的臨時性工作 |
| **VO** | Variation Order | 變更單 | 工程變更的正式指令，可能影響時程或預算 |
| **PM** | Project Manager | 專案經理 | 負責專案整體規劃、執行與控制的管理者 |

### WBS 結構範例

```
專案 (PRJ)
├── 1.0 設計階段
│   ├── 1.1 初步設計
│   └── 1.2 細部設計
├── 2.0 採購階段
│   ├── 2.1 材料採購 (PR → RFQ → PO)
│   └── 2.2 設備採購
└── 3.0 施工階段
    ├── 3.1 基礎工程
    ├── 3.2 結構工程
    └── 3.3 裝修工程
```

---

## 🟣 工地與品質管理 (Construction Site & Quality)

工地施工與品質控制確保工程符合規範與標準：

| 縮寫 | 全名 | 中文 | 說明 |
|------|------|------|------|
| **QC** | Quality Control | 品質控制 | 透過檢驗與測試確保產品或服務符合規範 |
| **QA** | Quality Assurance | 品質保證 | 透過系統化流程預防缺陷發生 |
| **NCR** | Non-Conformance Report | 不符合報告 | 記錄不符合規範的問題與改善措施 |
| **RFI** | Request for Information | 資訊請求 | 施工過程中向設計或業主詢問技術問題（與採購 RFI 類似但用於施工） |
| **SI** | Site Inspection | 工地檢查 | 定期或不定期的現場檢查與記錄 |
| **HSE** | Health, Safety, and Environment | 健康、安全與環境 | 工地安全衛生與環境保護的綜合管理 |

### QA/QC 流程關聯

```
QA (品質保證 - 預防)
├── 制定品質標準
├── 訓練與教育
└── 流程改善

QC (品質控制 - 檢驗)
├── SI (工地檢查)
├── 測試與驗收
└── NCR (不符合報告)
```

---

## 🔗 在 GigHub 系統中的應用

### 採購模組整合

GigHub 系統的採購流程可對應以下縮寫：

```typescript
// 採購申請 (PR - Purchase Requisition)
interface PurchaseRequest {
  prNumber: string;           // PR 編號
  projectId: string;          // 專案 ID
  items: PurchaseItem[];      // 請購項目
  requestedBy: string;        // 申請人
  approvalStatus: string;     // 審批狀態
}

// 採購單 (PO - Purchase Order)
interface PurchaseOrder {
  poNumber: string;           // PO 編號
  prNumber: string;           // 關聯的 PR 編號
  vendor: string;             // 供應商
  totalAmount: number;        // 總金額
  deliveryDate: Date;         // 預定交貨日期
}

// 驗收單 (GR - Goods Receipt)
interface GoodsReceipt {
  grNumber: string;           // GR 編號
  poNumber: string;           // 關聯的 PO 編號
  receivedDate: Date;         // 收貨日期
  receivedBy: string;         // 驗收人
  inspectionResult: string;   // 檢驗結果
}
```

### 品質驗收整合

品質驗收模組對應 QA/QC 流程：

```typescript
// 品質檢查 (QC - Quality Control)
interface QualityCheck {
  qcNumber: string;           // QC 編號
  taskId: string;             // 關聯任務
  checkType: 'SI' | 'QA' | 'QC'; // 檢查類型
  inspector: string;          // 檢查人員
  checkDate: Date;            // 檢查日期
  result: 'PASS' | 'FAIL' | 'NCR'; // 檢查結果
}

// 不符合報告 (NCR - Non-Conformance Report)
interface NonConformanceReport {
  ncrNumber: string;          // NCR 編號
  qcNumber: string;           // 關聯的 QC 編號
  description: string;        // 問題描述
  correctiveAction: string;   // 改善措施
  status: string;             // 處理狀態
}
```

### 專案成本追蹤

專案成本模組整合財務縮寫：

```typescript
// 專案預算 (含 BOQ)
interface ProjectBudget {
  projectId: string;          // 專案 ID
  boq: BillOfQuantities[];    // BOQ 工程清單
  capex: number;              // 資本支出
  opex: number;               // 營業費用
  wbs: WorkBreakdownStructure; // WBS 工作分解
}

// 成本追蹤
interface CostTracking {
  projectId: string;          // 專案 ID
  ap: AccountsPayable[];      // 應付帳款
  ar: AccountsReceivable[];   // 應收帳款
  actualCosts: number;        // 實際成本
  variance: number;           // 差異分析
}
```

---

## 📚 相關資源

### 內部文檔

- [GigHub 架構文檔](../GigHub_Architecture.md) - 系統整體架構說明
- [術語表](../GLOSSARY.md) - GigHub 專案核心術語定義
- [開發指南](../NEXT_DEVELOPMENT_GUIDE.md) - 下一步開發指引

### 外部參考

#### SAP 相關資源
- [SAP Integration Suite](https://help.sap.com/docs/integration-suite) - SAP 採購與財務流程標準
- [SAP Business One Service Layer](https://help.sap.com/docs/sap-business-one) - SAP 業務流程 API

#### 專案管理標準
- [PMBOK Guide](https://www.pmi.org/pmbok-guide-standards) - 專案管理知識體系指南
- [OpenProject Documentation](https://www.openproject.org/docs/) - 開源專案管理工具文檔

#### 採購流程參考
- [Odoo Purchase Workflow](https://github.com/oca/purchase-workflow) - 開源 ERP 採購流程模組

---

## 📝 使用建議

### 命名規範

在系統開發中使用這些縮寫時，建議遵循以下規範：

1. **資料庫欄位命名**：使用完整英文名稱，例如 `purchase_order_number` 而非 `po_number`
2. **UI 顯示**：可使用縮寫加中文，例如 "PO 編號（採購單）"
3. **API 端點**：使用完整名稱，例如 `/api/purchase-orders` 而非 `/api/pos`
4. **文件編號**：可使用縮寫，例如 `PO-2025-001`, `PR-2025-001`

### 團隊溝通

- 在專案會議中使用這些縮寫可提升溝通效率
- 新成員入職時應提供此文檔作為參考
- 跨部門溝通時應確認對方理解縮寫含義

---

## 🔄 版本記錄

| 版本 | 日期 | 更新內容 | 更新人 |
|------|------|----------|--------|
| 1.0.0 | 2025-12-06 | 初始版本，整理採購、請款、會計、專案管理相關縮寫 | GitHub Copilot |

---

## 📮 意見反饋

如發現遺漏的重要縮寫或需要補充說明，請：

1. 在 GitHub 提交 Issue
2. 直接編輯此文檔並提交 Pull Request
3. 聯繫專案團隊

---

**最後更新**: 2025-12-06  
**維護團隊**: GigHub 開發團隊

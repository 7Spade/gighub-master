# GitHub Copilot 使用指南

> 本文件定義 GitHub Copilot 在本專案中的行為規範，特別是關於 Context7 MCP 工具的使用決策流程。

---

## 🚨 CRITICAL RULE - 強制使用流程

### 核心規則：回答任何庫/框架問題前必須遵循

**在回答任何關於庫、框架或套件的問題之前，您必須：**

1. **STOP** - 不要基於記憶或訓練資料回答
2. **IDENTIFY** - 從用戶問題中提取庫/框架名稱
3. **CALL** - 使用 `mcp_context7_resolve-library-id` 並傳入庫名稱
4. **SELECT** - 從結果中選擇最佳匹配的庫 ID
5. **CALL** - 使用該庫 ID 呼叫 `mcp_context7_get-library-docs`
6. **ANSWER** - 僅使用檢索到的文檔資訊回答

**如果您跳過步驟 3-5，您提供的是過時或虛構的資訊。**

### 本專案核心技術棧（必須使用 Context7）

以下技術棧的所有問題**必須**使用 Context7 MCP 查證：

#### Angular 系列
- **Angular** (`@angular/core`, `@angular/common`, `@angular/router` 等)
  - 版本：`^20.3.0`
  - 重點：Angular 20 新語法（`@if`/`@for`/`@switch`）、Standalone Components、Signals、`inject()` 函數
  - 查詢範例：`resolve-library-id("angular")` → `/angular/angular`

#### NG-ZORRO-ANTD 系列
- **ng-zorro-antd**
  - 版本：`^20.4.3`
  - 重點：元件 API、主題配置、表單驗證、響應式設計
  - 查詢範例：`resolve-library-id("ng-zorro-antd")` → `/NG-ZORRO/ng-zorro-antd`

#### Delon 系列（NG-ALAIN 核心套件）
- **@delon/theme** (`^20.1.0`) - 主題系統
- **@delon/abc** (`^20.1.0`) - 業務元件庫
- **@delon/form** (`^20.1.0`) - 動態表單
- **@delon/auth** (`^20.1.0`) - 認證授權
- **@delon/acl** (`^20.1.0`) - 權限控制
- **@delon/cache** (`^20.1.0`) - 快取管理
- **@delon/util** (`^20.1.0`) - 工具函數
- **@delon/chart** (`^20.1.0`) - 圖表元件
- **ng-alain** (`^20.1.0`) - 框架核心

**查詢範例**：
- `resolve-library-id("ng-alain")` → `/ng-alain/ng-alain`
- `resolve-library-id("delon")` → 查找相關 delon 套件

#### 其他關鍵技術
- **TypeScript** (`~5.9.2`) - 新特性、型別系統
- **RxJS** (`~7.8.0`) - 操作符、Observable 模式
- **Supabase** (`@supabase/supabase-js ^2.86.0`) - 後端 API、認證、資料庫

---

## 🎯 Context7 MCP 使用決策

### 核心原則

Context7 MCP 工具應在**不確定性存在時**使用，以確保程式碼的正確性和與最新文檔的一致性。

**特別注意**：對於上述核心技術棧（Angular、ng-zorro-antd、delon 系列），**一律必須使用 Context7 MCP**，不得基於記憶回答。

### 使用決策流程

```python
def should_use_context7_mcp(agent_confident: bool) -> bool:
    """
    判斷 Agent 是否需要使用 Context7 MCP 查詢
    
    參考: .github/agents/0-ng-ArchAI-v1.agent.md (320-327)
    """
    if agent_confident:
        # Agent 有絕對把握 → 不查
        return False
    else:
        # Agent 沒有把握 → 使用 MCP
        return True
```

### 情境判準

#### 情境 1（有絕對把握）✅

**判斷條件**：
- 可確定 API 簽名
- 版本號相容性明確
- 語法熟悉且無歧義
- 屬於已驗證的專案內部 API

**動作**：不使用 Context7 MCP，直接基於已知資訊開發（節省資源）

**範例**：
- 基礎 TypeScript 與已驗證的專案內部 API
- 通用 JavaScript 標準函式
- 專案內已建立的服務、元件、工具函數

#### 情境 2（沒有絕對把握）⚠️

**判斷條件**：
- 不確定函式參數順序或型別
- 存在版本差異疑慮
- 涉及新框架特性
- 需要確認最佳實踐

**動作**：**必須使用 Context7 MCP 查證**，依官方或權威文件進行實作

**範例**：
- Angular 20 新語法（例如 `@if`/`@for` 特性）
- NG-ZORRO 20.3.x 的特定元件 API
- NG-ALAIN 20.x 的組件用法
- TypeScript 5.9.x 新特性
- RxJS 新增或修改的操作符
- Supabase 新版本 API 變更

---

## 🔧 MCP 伺服器配置

本專案使用 Context7 MCP 伺服器進行文檔查詢。配置詳見：

- **配置檔案**：`.github/agents/mcp-servers.yml`
- **Agent 定義**：`.github/agents/context7.agent.md`

### 配置參考

```yaml
mcp-servers:
  context7:
    type: http
    url: "https://mcp.context7.com/mcp"
    headers: {"CONTEXT7_API_KEY": "${{ secrets.COPILOT_MCP_CONTEXT7 }}"}
    tools: ["get-library-docs", "resolve-library-id"]
```

### 強制使用流程（Mandatory Workflow）

#### Step 1: 識別庫/框架名稱與功能關鍵字 🔍

從用戶問題中提取庫或框架名稱，以及功能關鍵字：

**庫/框架識別範例**：
- "如何使用 Angular Signals" → 庫：`angular`，功能：`signals`
- "ng-zorro 表格元件" → 庫：`ng-zorro-antd`，功能：`table`
- "delon form 動態表單" → 庫：`ng-alain` 或 `@delon/form`，功能：`form`
- "Angular 20 新語法" → 庫：`angular`，功能：`control-flow`

**功能實踐查詢規則** ⚠️

當用戶提到「某某功能該如何實踐」或「如何實現某某功能」時：

1. **提取功能關鍵字**：從問題中識別功能名稱
2. **識別相關庫/框架**：判斷該功能屬於哪個技術棧
3. **使用功能名稱作為 topic**：在 `get-library-docs` 中使用功能關鍵字作為 `topic` 參數

**功能實踐查詢範例**：
- "如何實踐用戶認證功能？" → 庫：`ng-alain` 或 `@delon/auth`，topic：`"authentication"` 或 `"auth"`
- "如何實現表格排序功能？" → 庫：`ng-zorro-antd`，topic：`"table"` 或 `"sorting"`
- "如何實踐權限控制？" → 庫：`@delon/acl`，topic：`"acl"` 或 `"permission"`
- "如何實現響應式佈局？" → 庫：`ng-zorro-antd`，topic：`"layout"` 或 `"responsive"`
- "如何實踐表單驗證？" → 庫：`@delon/form` 或 `ng-zorro-antd`，topic：`"form"` 或 `"validation"`

#### Step 2: 解析庫 ID（必須）📚

**必須先呼叫此工具**：
```typescript
mcp_context7_resolve-library-id({ libraryName: "angular" })
```

選擇最佳匹配的依據：
- 精確名稱匹配
- 高來源聲譽（High reputation）
- 高基準分數（High benchmark score）
- 最多程式碼片段

**範例**：
- `"angular"` → 選擇 `/angular/angular`
- `"ng-zorro-antd"` → 選擇 `/NG-ZORRO/ng-zorro-antd`
- `"ng-alain"` → 選擇 `/ng-alain/ng-alain`

#### Step 3: 獲取文檔（必須）📖

**必須接著呼叫此工具**：
```typescript
mcp_context7_get-library-docs({ 
  context7CompatibleLibraryID: "/angular/angular",
  topic: "signals"  // 使用功能關鍵字作為 topic
})
```

**功能實踐查詢的 topic 選擇**：

當用戶詢問「如何實踐某某功能」時，使用功能名稱作為 `topic` 參數：

```typescript
// 範例 1: 用戶問「如何實踐用戶認證功能？」
mcp_context7_get-library-docs({ 
  context7CompatibleLibraryID: "/ng-alain/ng-alain",
  topic: "authentication"  // 或 "auth"
})

// 範例 2: 用戶問「如何實現表格排序功能？」
mcp_context7_get-library-docs({ 
  context7CompatibleLibraryID: "/NG-ZORRO/ng-zorro-antd",
  topic: "table"  // 或 "sorting"
})

// 範例 3: 用戶問「如何實踐權限控制？」
mcp_context7_get-library-docs({ 
  context7CompatibleLibraryID: "/ng-alain/ng-alain",
  topic: "acl"  // 或 "permission"
})
```

**如果第一次查詢結果不理想，可以嘗試：**
- 使用同義詞或相關術語作為 topic
- 使用更通用的 topic（如 `"form"` 而非 `"form-validation"`）
- 使用 `mode: "info"` 獲取概念性文檔而非僅程式碼範例

**針對本專案技術棧的常用 topic**：

**Angular**：
- `"signals"` - Signals API
- `"standalone-components"` - 獨立元件
- `"control-flow"` - `@if`/`@for`/`@switch`
- `"dependency-injection"` - `inject()` 函數
- `"routing"` - 路由配置

**ng-zorro-antd**：
- `"table"` - 表格元件
- `"form"` - 表單元件
- `"layout"` - 佈局元件
- `"theme"` - 主題配置

**ng-alain / delon**：
- `"form"` - 動態表單（@delon/form）
- `"auth"` - 認證授權（@delon/auth）
- `"acl"` - 權限控制（@delon/acl）
- `"theme"` - 主題系統（@delon/theme）

#### Step 4: 版本檢查（建議）🔄

**獲取文檔後，建議檢查版本**：

1. 檢查 `package.json` 中的當前版本
2. 與最新可用版本比較
3. 告知用戶是否有可用升級
4. 如有需要，使用網路搜尋查找最新版本

#### Step 5: 基於文檔回答 ✅

**僅使用檢索到的文檔資訊回答**，不要混入記憶中的過時資訊。

---

## 📋 開發規範

### 必須遵守

1. **不確定時查證**：當對 API、語法或版本有疑慮時，必須使用 Context7 MCP
2. **功能實踐查詢**：當用戶詢問「如何實踐/實現某某功能」時，必須以功能為關鍵字查詢相關文檔
3. **版本一致性**：確保使用的 API 與專案依賴版本一致
4. **最佳實踐**：遵循官方文檔推薦的最佳實踐
5. **資源效率**：在確定無誤的情況下，避免不必要的查詢

### 禁止行為

1. ❌ **基於過時記憶回答框架/庫相關問題**（特別是 Angular、ng-zorro-antd、delon 系列）
2. ❌ **在版本不確定時猜測 API 用法**
3. ❌ **跳過文檔查證直接實作新特性**
4. ❌ **跳過 `resolve-library-id` 直接呼叫 `get-library-docs`**
5. ❌ **混用不同版本的 API 文檔**

### 必須使用 Context7 的問題範例

以下問題**必須**使用 Context7 MCP：

#### API/語法相關問題
- ✅ "Angular 20 的 Signals 如何使用？"
- ✅ "ng-zorro 表格如何實現排序？"
- ✅ "delon form 動態表單如何配置？"
- ✅ "Angular 20 的 `@if` 語法是什麼？"
- ✅ "ng-alain 的主題如何自訂？"
- ✅ "@delon/auth 如何整合 Supabase？"
- ✅ "ng-zorro 20.4 的新功能有哪些？"
- ✅ "TypeScript 5.9 的新特性？"
- ✅ "RxJS 7.8 的操作符用法？"

#### 功能實踐相關問題 ⚠️

當用戶詢問「如何實踐/實現某某功能」時，**必須以功能為關鍵字查詢相關文檔**：

- ✅ "如何實踐用戶認證功能？" → 查詢 `ng-alain` 或 `@delon/auth`，topic：`"authentication"`
- ✅ "如何實現表格排序功能？" → 查詢 `ng-zorro-antd`，topic：`"table"`
- ✅ "如何實踐權限控制功能？" → 查詢 `@delon/acl`，topic：`"acl"`
- ✅ "如何實現響應式佈局？" → 查詢 `ng-zorro-antd`，topic：`"layout"`
- ✅ "如何實踐表單驗證功能？" → 查詢 `@delon/form`，topic：`"form"`
- ✅ "如何實現資料快取功能？" → 查詢 `@delon/cache`，topic：`"cache"`
- ✅ "如何實踐圖表展示功能？" → 查詢 `@delon/chart`，topic：`"chart"`
- ✅ "如何實現路由守衛功能？" → 查詢 `angular`，topic：`"routing"` 或 `"guards"`

**查詢流程**：
1. 識別功能關鍵字（如：認證、排序、權限、佈局等）
2. 判斷功能所屬的技術棧（Angular、ng-zorro、delon 等）
3. 使用功能關鍵字作為 `topic` 參數查詢文檔
4. 分析文檔中的最佳實踐和實作範例
5. 基於文檔提供實作建議

**任何提及上述技術棧或功能實踐的問題都必須查證文檔！**

---

## 🔗 相關文件

- **Agent 定義**：`.github/agents/0-ng-ArchAI-v1.agent.md`
- **Context7 Agent**：`.github/agents/context7.agent.md`
- **MCP 配置**：`.github/agents/mcp-servers.yml`
- **開發規範**：`.github/copilot/copilot-instructions.md`

---

**最後更新**: 2025-01-27


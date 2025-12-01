# GitHub Copilot Collections

本文件說明 GitHub Copilot Collections 的概念與使用方式。Collections 是將相關的 prompts、instructions 和 agents 組織在一起的主題化工具包。

**最後更新**：2025-01-26  
**檔案位置**：[.github/collections/](../.github/collections/)  
**集合數量**：9 個

---

## 什麼是 Collections？

Collections 是 [awesome-copilot](https://github.com/github/awesome-copilot) 專案中的概念，用於將相關的 GitHub Copilot 自訂資源（prompts、instructions、agents）組織成主題化的工具包，方便使用者針對特定工作流程或使用案例快速採用完整的配置組合。

---

## 本專案相關的 Collections

以下是與本專案（Angular / ng-alain / Supabase）相關的 Collections 主題：

### 前端開發

| Collection 檔案 | 說明 |
|----------------|------|
| [frontend-web-dev.collection.yml](../.github/collections/frontend-web-dev.collection.yml) | 前端 Web 開發集合配置 |
| [frontend-web-dev.md](../.github/collections/frontend-web-dev.md) | 現代前端開發工具，包含 Angular、TypeScript、CSS 等 |

### 資料庫與資料管理

| Collection 檔案 | 說明 |
|----------------|------|
| [database-data-management.collection.yml](../.github/collections/database-data-management.collection.yml) | 資料庫與資料管理集合配置 |
| [database-data-management.md](../.github/collections/database-data-management.md) | 資料庫管理、SQL 最佳化、PostgreSQL |

### 測試與自動化

| Collection 檔案 | 說明 |
|----------------|------|
| [testing-automation.collection.yml](../.github/collections/testing-automation.collection.yml) | 測試自動化集合配置 |
| [testing-automation.md](../.github/collections/testing-automation.md) | TDD、Playwright、單元測試、整合測試 |

### 專案規劃與管理

| Collection 檔案 | 說明 |
|----------------|------|
| [project-planning.collection.yml](../.github/collections/project-planning.collection.yml) | 專案規劃集合配置 |
| [project-planning.md](../.github/collections/project-planning.md) | 專案規劃、功能分解、實作計畫 |

### 安全性與程式碼品質

| Collection 檔案 | 說明 |
|----------------|------|
| [security-best-practices.collection.yml](../.github/collections/security-best-practices.collection.yml) | 安全最佳實踐集合配置 |
| [security-best-practices.md](../.github/collections/security-best-practices.md) | 安全框架、無障礙指南、效能最佳化 |

### 技術研究

| Collection 檔案 | 說明 |
|----------------|------|
| [technical-spike.collection.yml](../.github/collections/technical-spike.collection.yml) | 技術研究集合配置 |
| [technical-spike.md](../.github/collections/technical-spike.md) | 技術研究與驗證、技術決策文檔 |

### 探索工具

| Collection 檔案 | 說明 |
|----------------|------|
| [awesome-copilot.collection.yml](../.github/collections/awesome-copilot.collection.yml) | Awesome Copilot 集合配置 |
| [awesome-copilot.md](../.github/collections/awesome-copilot.md) | 元提示工具，發現其他有用的 Copilot 工具 |

---

## 本專案的配置對照

本專案保留的 Copilot 配置已針對 Angular / ng-alain / Supabase 開發進行精選，以下是主要分類：

### Angular / ng-alain 開發

| 類型 | 資源 |
|------|------|
| **Agents** | `0-ng-ArchAI-v1.agent.md`, `0-ng-governance-v1.md`, `electron-angular-native.agent.md` |
| **Instructions** | `angular.instructions.md`, `typescript-5-es2022.instructions.md` |

### PostgreSQL / Supabase 開發

| 類型 | 資源 |
|------|------|
| **Agents** | `postgresql-dba.agent.md` |
| **Prompts** | `postgresql-optimization.prompt.md`, `postgresql-code-review.prompt.md`, `sql-optimization.prompt.md`, `sql-code-review.prompt.md` |

### 測試與自動化

| 類型 | 資源 |
|------|------|
| **Agents** | `playwright-tester.agent.md`, `tdd-red.agent.md`, `tdd-green.agent.md`, `tdd-refactor.agent.md` |
| **Instructions** | `playwright-typescript.instructions.md` |
| **Prompts** | `playwright-generate-test.prompt.md`, `playwright-explore-website.prompt.md`, `playwright-automation-fill-in-form.prompt.md`, `breakdown-test.prompt.md` |

### 架構與規劃

| 類型 | 資源 |
|------|------|
| **Agents** | `arch.agent.md`, `api-architect.agent.md`, `adr-generator.agent.md`, `plan.agent.md`, `planner.agent.md`, `prd.agent.md` |
| **Prompts** | `architecture-blueprint-generator.prompt.md`, `create-specification.prompt.md`, `create-implementation-plan.prompt.md`, `breakdown-plan.prompt.md` |

### 程式碼品質與安全性

| 類型 | 資源 |
|------|------|
| **Agents** | `wg-code-alchemist.agent.md`, `wg-code-sentinel.agent.md`, `janitor.agent.md`, `accessibility.agent.md` |
| **Instructions** | `security-and-owasp.instructions.md`, `a11y.instructions.md`, `object-calisthenics.instructions.md` |
| **Prompts** | `review-and-refactor.prompt.md` |

---

## 使用建議

### 工作流程範例

1. **新功能開發**
   - 使用 `@prd` 產出需求文件
   - 使用 `/create-implementation-plan` 建立實作計畫
   - 使用 `@0-ng-ArchAI-v1` 進行 Angular 開發
   - 使用 `/playwright-generate-test` 建立 E2E 測試

2. **資料庫設計**
   - 使用 `@postgresql-dba` 進行 PostgreSQL 設計
   - 使用 `/postgresql-optimization` 最佳化查詢
   - 使用 `/postgresql-code-review` 審查程式碼

3. **程式碼品質**
   - 使用 `@wg-code-sentinel` 進行安全性審查
   - 使用 `@accessibility` 進行無障礙檢查
   - 使用 `/review-and-refactor` 進行重構

---

## 相關資源

- [本專案 Agents 列表](./README.agents.md)
- [本專案 Instructions 列表](./README.instructions.md)
- [本專案 Prompts 列表](./README.prompts.md)
- [awesome-copilot Collections](https://github.com/github/awesome-copilot/tree/main/collections)

---

## 維護記錄

- **2025-01-26**: 更新文件以反映實際檔案數量（9 個集合檔案）
- **2025-01-20**: 補上所有 collection 文件詳細介紹，包含配置檔和說明檔
- **2025-11-26**: 更新文件以反映 Copilot 配置清理後的狀態
- **2025-11-25**: 初始化 Collections 說明文件

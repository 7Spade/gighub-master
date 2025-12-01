# GitHub Copilot Prompts

本文件說明本專案保留的 GitHub Copilot 提示檔案，提供可重複使用的任務導向提示。

**最後更新**：2025-01-26  
**檔案位置**：[.github/prompts/](../.github/prompts/)  
**提示數量**：47 個

---

## 如何使用

在 VS Code 的 Copilot Chat 中，您可以透過 `/` 或輸入提示檔名來呼叫特定提示：
- `/create-readme` - 建立 README.md
- `/playwright-generate-test` - 產生 Playwright 測試

---

## 提示分類索引

### 文件產出類

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [create-readme.prompt.md](../.github/prompts/create-readme.prompt.md) | 專案 README.md 產出 | 新專案或需要更新 README 時 |
| [readme-blueprint-generator.prompt.md](../.github/prompts/readme-blueprint-generator.prompt.md) | 智慧 README 產出 | 掃描 .github/copilot 目錄並產出完整文件 |
| [create-oo-component-documentation.prompt.md](../.github/prompts/create-oo-component-documentation.prompt.md) | OO 元件文件產出 | 物件導向元件完整文件 |
| [comment-code-generate-a-tutorial.prompt.md](../.github/prompts/comment-code-generate-a-tutorial.prompt.md) | 程式碼教學產出 | 將程式碼轉換為入門教學 |

---

### 架構與規格類

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [architecture-blueprint-generator.prompt.md](../.github/prompts/architecture-blueprint-generator.prompt.md) | 架構藍圖產出 | 分析程式碼庫產出架構文件 |
| [create-specification.prompt.md](../.github/prompts/create-specification.prompt.md) | 規格文件產出 | 為 AI 優化的規格文件 |
| [update-specification.prompt.md](../.github/prompts/update-specification.prompt.md) | 規格文件更新 | 根據新需求更新規格 |
| [create-architectural-decision-record.prompt.md](../.github/prompts/create-architectural-decision-record.prompt.md) | ADR 文件產出 | 架構決策記錄 |
| [technology-stack-blueprint-generator.prompt.md](../.github/prompts/technology-stack-blueprint-generator.prompt.md) | 技術堆疊藍圖 | 分析並文件化技術堆疊 |
| [folder-structure-blueprint-generator.prompt.md](../.github/prompts/folder-structure-blueprint-generator.prompt.md) | 資料夾結構藍圖 | 文件化專案資料夾結構 |
| [project-workflow-analysis-blueprint-generator.prompt.md](../.github/prompts/project-workflow-analysis-blueprint-generator.prompt.md) | 工作流程分析藍圖 | 端對端應用程式工作流程分析 |
| [code-exemplars-blueprint-generator.prompt.md](../.github/prompts/code-exemplars-blueprint-generator.prompt.md) | 程式碼範例藍圖 | 識別並文件化高品質程式碼範例 |

---

### 實作規劃類

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [create-implementation-plan.prompt.md](../.github/prompts/create-implementation-plan.prompt.md) | 實作計畫產出 | 新功能、重構或升級的實作計畫 |
| [update-implementation-plan.prompt.md](../.github/prompts/update-implementation-plan.prompt.md) | 實作計畫更新 | 根據新需求更新實作計畫 |
| [breakdown-plan.prompt.md](../.github/prompts/breakdown-plan.prompt.md) | 議題規劃與分解 | Epic > Feature > Story/Enabler > Test 層級分解 |
| [breakdown-epic-pm.prompt.md](../.github/prompts/breakdown-epic-pm.prompt.md) | Epic PRD 產出 | 為新 Epic 建立產品需求文件 |
| [breakdown-epic-arch.prompt.md](../.github/prompts/breakdown-epic-arch.prompt.md) | Epic 技術架構 | 基於 PRD 的高階技術架構 |
| [breakdown-feature-prd.prompt.md](../.github/prompts/breakdown-feature-prd.prompt.md) | Feature PRD 產出 | 基於 Epic 的功能需求文件 |
| [breakdown-feature-implementation.prompt.md](../.github/prompts/breakdown-feature-implementation.prompt.md) | Feature 實作計畫 | 詳細功能實作計畫 |

---

### GitHub 整合類

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [create-github-issue-feature-from-specification.prompt.md](../.github/prompts/create-github-issue-feature-from-specification.prompt.md) | 從規格建立 Issue | 從規格檔案建立功能請求 Issue |
| [create-github-issues-feature-from-implementation-plan.prompt.md](../.github/prompts/create-github-issues-feature-from-implementation-plan.prompt.md) | 從計畫建立 Issues | 從實作計畫建立多個 Issues |
| [create-github-issues-for-unmet-specification-requirements.prompt.md](../.github/prompts/create-github-issues-for-unmet-specification-requirements.prompt.md) | 未實作需求 Issues | 為未實作的規格需求建立 Issues |
| [create-github-pull-request-from-specification.prompt.md](../.github/prompts/create-github-pull-request-from-specification.prompt.md) | 從規格建立 PR | 從規格檔案建立 Pull Request |
| [create-github-action-workflow-specification.prompt.md](../.github/prompts/create-github-action-workflow-specification.prompt.md) | GitHub Actions 規格 | GitHub Actions 工作流程規格文件 |
| [gen-specs-as-issues.prompt.md](../.github/prompts/gen-specs-as-issues.prompt.md) | 規格轉 Issues | 識別缺失功能並建立詳細規格 |

---

### 測試類（Playwright）

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [playwright-automation-fill-in-form.prompt.md](../.github/prompts/playwright-automation-fill-in-form.prompt.md) | 表單自動填寫 | 自動化表單填寫測試 |

---

### 資料庫類（PostgreSQL）

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [postgresql-optimization.prompt.md](../.github/prompts/postgresql-optimization.prompt.md) | PostgreSQL 最佳化 | PostgreSQL 效能調優、JSONB、陣列、全文搜尋 |
| [postgresql-code-review.prompt.md](../.github/prompts/postgresql-code-review.prompt.md) | PostgreSQL 程式碼審查 | PostgreSQL 最佳實踐、RLS、反模式檢測 |

---

### 程式碼品質類

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [review-and-refactor.prompt.md](../.github/prompts/review-and-refactor.prompt.md) | 審查與重構 | 根據定義的指令審查並重構程式碼 |
| [copilot-instructions-blueprint-generator.prompt.md](../.github/prompts/copilot-instructions-blueprint-generator.prompt.md) | Copilot 指令藍圖 | 產出 copilot-instructions.md |

---

### Prompt 工程類

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [prompt-builder.prompt.md](../.github/prompts/prompt-builder.prompt.md) | Prompt 建構器 | 引導建立高品質 Copilot 提示 |
| [boost-prompt.prompt.md](../.github/prompts/boost-prompt.prompt.md) | Prompt 增強 | 互動式 Prompt 精煉（需 Joyride 擴展）|
| [first-ask.prompt.md](../.github/prompts/first-ask.prompt.md) | 任務釐清 | 執行前先釐清範圍、交付物、限制 |
| [finalize-agent-prompt.prompt.md](../.github/prompts/finalize-agent-prompt.prompt.md) | Agent Prompt 完善 | 使用 AI 角色完善 Prompt |
| [ai-prompt-engineering-safety-review.prompt.md](../.github/prompts/ai-prompt-engineering-safety-review.prompt.md) | Prompt 安全審查 | AI Prompt 安全、偏見、漏洞分析 |
| [model-recommendation.prompt.md](../.github/prompts/model-recommendation.prompt.md) | 模型推薦 | 分析任務並推薦最佳 AI 模型 |

---

### Copilot 資源建議類

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [suggest-awesome-github-copilot-agents.prompt.md](../.github/prompts/suggest-awesome-github-copilot-agents.prompt.md) | 建議 Agents | 從 awesome-copilot 建議相關 Agents |
| [suggest-awesome-github-copilot-instructions.prompt.md](../.github/prompts/suggest-awesome-github-copilot-instructions.prompt.md) | 建議 Instructions | 從 awesome-copilot 建議相關 Instructions |
| [suggest-awesome-github-copilot-prompts.prompt.md](../.github/prompts/suggest-awesome-github-copilot-prompts.prompt.md) | 建議 Prompts | 從 awesome-copilot 建議相關 Prompts |
| [suggest-awesome-github-copilot-chatmodes.prompt.md](../.github/prompts/suggest-awesome-github-copilot-chatmodes.prompt.md) | 建議 Chat Modes | 從 awesome-copilot 建議相關 Chat Modes |
| [suggest-awesome-github-copilot-collections.prompt.md](../.github/prompts/suggest-awesome-github-copilot-collections.prompt.md) | 建議 Collections | 從 awesome-copilot 建議相關 Collections |

---

### DevOps 類

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [editorconfig.prompt.md](../.github/prompts/editorconfig.prompt.md) | EditorConfig 產出 | 根據專案分析產出 .editorconfig |

---

### 通用工具類

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [create-agentsmd.prompt.md](../.github/prompts/create-agentsmd.prompt.md) | AGENTS.md 產出 | 產出倉庫的 AGENTS.md 檔案 |
| [github-copilot-starter.prompt.md](../.github/prompts/github-copilot-starter.prompt.md) | Copilot 入門 | GitHub Copilot 入門指引 |

---

### 記憶與學習類

| 提示檔案 | 描述 | 適用場景 |
|----------|------|----------|
| [remember.prompt.md](../.github/prompts/remember.prompt.md) | 記憶學習 | 將學習轉換為領域組織的記憶指令 |
| [memory-merger.prompt.md](../.github/prompts/memory-merger.prompt.md) | 記憶合併 | 將成熟的教訓合併到指令檔案 |
| [remember-interactive-programming.prompt.md](../.github/prompts/remember-interactive-programming.prompt.md) | 互動式程式設計提醒 | 提醒 Agent 使用 REPL |

---

## 使用指南

### 開發流程推薦

1. **專案啟動**: `create-readme.prompt.md` → `create-specification.prompt.md`
2. **規劃階段**: `breakdown-epic-pm.prompt.md` → `breakdown-epic-arch.prompt.md`
3. **功能開發**: `breakdown-feature-prd.prompt.md` → `breakdown-feature-implementation.prompt.md`
4. **文件更新**: `update-specification.prompt.md` → `update-implementation-plan.prompt.md`
5. **審查階段**: `review-and-refactor.prompt.md` → `postgresql-code-review.prompt.md`

### 特定任務推薦

| 任務 | 推薦提示 |
|------|----------|
| 新專案 | `create-readme.prompt.md` + `architecture-blueprint-generator.prompt.md` |
| 功能開發 | `create-implementation-plan.prompt.md` + `create-github-issue-feature-from-specification.prompt.md` |
| 表單測試 | `playwright-automation-fill-in-form.prompt.md` |
| 資料庫最佳化 | `postgresql-optimization.prompt.md` |
| 程式碼審查 | `review-and-refactor.prompt.md` |

---

## 維護記錄

- **2025-01-26**: 更新文件以反映實際檔案數量（47 個提示檔案）
  - 移除：不存在的提示檔案引用（documentation-writer, update-oo-component-documentation, add-educational-comments, create-technical-spike, breakdown-test, my-issues, my-pull-requests, git-flow-branch-creator, conventional-commit, playwright-generate-test, playwright-explore-website, javascript-typescript-jest, sql-optimization, sql-code-review, write-coding-standards-from-file, generate-custom-instructions-from-codebase, multi-stage-dockerfile, create-llms, update-llms, repo-story-time, shuffle-json-data, update-markdown-file-index, typescript-mcp-server-generator, mkdocs-translations）
  - 保留：實際存在的 47 個提示檔案
- **2025-01-20**: 更新文件數量為 72 個，確保所有 prompt 文件都有介紹
- **2025-11-26**: 更新文件以反映 Copilot 配置清理後的狀態
- **2025-11-25**: 從 awesome-copilot 複製有價值的 prompts
- **2025-11-23**: 初始化提示目錄

---

## 來源

部分提示精選自 [awesome-copilot](https://github.com/github/awesome-copilot) 開源專案。

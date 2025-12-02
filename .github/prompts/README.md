# 🎯 Prompt 模板使用指南

> 可重複使用的任務導向 Prompt 模板

---

## 📁 目錄結構

```
prompts/
├── README.md                 ← 你現在的位置
│
├── planning/                 ← 📋 規劃類 Prompts
│   ├── create-specification.prompt.md ← 建立功能規格書
│   ├── create-implementation-plan.prompt.md ← 生成實作計畫
│   ├── breakdown-plan.prompt.md ← 拆分任務樹
│   └── create-architectural-decision-record.prompt.md ← 建立 ADR
│
├── code-generation/          ← ⚙️ 生成類 Prompts
│   ├── architecture-blueprint-generator.prompt.md ← 架構藍圖生成
│   ├── folder-structure-blueprint-generator.prompt.md ← 資料夾結構生成
│   └── code-exemplars-blueprint-generator.prompt.md ← 程式碼範例生成
│
├── code-quality/             ← 🔍 品質類 Prompts
│   ├── review-and-refactor.prompt.md ← 程式碼審查與重構
│   ├── add-educational-comments.prompt.md ← 教學式註解生成
│   └── conventional-commit.prompt.md ← 規範化 Commit 訊息
│
├── database/                 ← 🗄️ 資料庫類 Prompts
│   ├── postgresql-code-review.prompt.md ← PostgreSQL 程式碼審查
│   ├── postgresql-optimization.prompt.md ← PostgreSQL 效能優化
│   ├── sql-code-review.prompt.md ← SQL 程式碼審查
│   └── sql-optimization.prompt.md ← SQL 效能優化
│
├── testing/                  ← 🧪 測試類 Prompts
│   └── playwright-generate-test.prompt.md ← E2E 測試生成
│
├── github/                   ← 🔗 GitHub 整合類 Prompts
│   ├── create-github-issue-feature-from-specification.prompt.md ← 從規格建立 Issue
│   ├── create-github-issues-feature-from-implementation-plan.prompt.md ← 從計畫建立 Issue
│   └── create-github-action-workflow-specification.prompt.md ← GitHub Actions 規格
│
└── documentation/            ← 📖 文件類 Prompts
    └── create-readme.prompt.md ← README 生成
```

---

## 🚀 如何使用 Prompt

### 方法 1: VS Code Command Palette

1. 按 `Ctrl+Shift+P` (Windows) 或 `Cmd+Shift+P` (Mac)
2. 輸入 `Copilot: Run Prompt`
3. 選擇要使用的 Prompt 檔案

### 方法 2: Copilot Chat

在 Copilot Chat 中直接參考 Prompt：

```
請使用 .github/prompts/planning/create-specification.prompt.md 
來為「使用者登入功能」建立規格書
```

### 方法 3: @ 檔案參考

```
@file:.github/prompts/code-quality/review-and-refactor.prompt.md
請審查這段程式碼
```

---

## 🔗 MCP 整合

| Prompt 類別 | MCP 服務 | 用途 |
|------------|----------|------|
| `planning/` | `software-planning-tool`, `memory` | 規劃輔助 |
| `database/` | `supabase` | 資料庫操作 |
| `github/` | `github` | GitHub API |
| `testing/` | `playwright` | E2E 測試 |

---

## 📋 推薦工作流程

### 新功能規劃
```
create-specification.prompt → 規格書
    ↓
create-implementation-plan.prompt → 實作計畫
    ↓
breakdown-plan.prompt → 任務拆分
    ↓
create-github-issues-feature-from-implementation-plan.prompt → Issues
```

### 程式碼品質
```
review-and-refactor.prompt → 審查建議
    ↓
add-educational-comments.prompt → 註解
    ↓
conventional-commit.prompt → Commit
```

---

**最後更新**: 2025-12-02

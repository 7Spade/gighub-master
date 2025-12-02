# 🤖 AI Agents 使用指南

> 專門化的 Copilot 代理，提供特定領域的協助能力

---

## 📁 目錄結構

```
agents/
├── README.md                 ← 你現在的位置
├── _index.md                 ← Agent 索引
│
├── planning/                 ← 📋 規劃類 Agents
│   ├── plan.agent.md         ← 策略規劃助手
│   ├── planner.agent.md      ← 實作規劃生成
│   ├── implementation-plan.agent.md ← 實作計畫執行
│   ├── task-planner.agent.md ← 任務規劃
│   └── task-researcher.agent.md ← 任務研究
│
├── architecture/             ← 🏗️ 架構類 Agents
│   ├── arch.agent.md         ← 架構設計指引
│   ├── adr-generator.agent.md ← ADR 生成器
│   ├── api-architect.agent.md ← API 架構設計
│   └── meta-agentic-project-scaffold.agent.md ← 專案腳手架
│
├── development/              ← 💻 開發類 Agents
│   ├── software-engineer-agent-v1.agent.md ← 全端工程師
│   ├── principal-software-engineer.agent.md ← 資深工程師
│   ├── debug.agent.md        ← 系統化除錯
│   ├── janitor.agent.md      ← 程式碼清理
│   └── code-tour.agent.md    ← 程式碼導覽
│
├── database/                 ← 🗄️ 資料庫類 Agents
│   └── postgresql-dba.agent.md ← PostgreSQL 管理
│
├── testing/                  ← 🧪 測試類 Agents
│   └── playwright-tester.agent.md ← E2E 測試
│
├── quality/                  ← 🔍 品質類 Agents
│   ├── critical-thinking.agent.md ← 批判性思考
│   ├── mentor.agent.md       ← 開發指導
│   └── tech-debt-remediation-plan.agent.md ← 技術債處理
│
├── documentation/            ← 📖 文件類 Agents
│   └── specification.agent.md ← 規格書撰寫
│
└── specialized/              ← ⚙️ 專案特化 Agents
    ├── 0-context7+.agent.md  ← Context7 整合
    ├── 0-ng-ArchAI-v1.agent.md ← Angular 架構 AI
    └── 0-ng-governance-v1.md ← Angular 治理
```

---

## 🚀 如何使用 Agent

### VS Code / Copilot Chat

在 Copilot Chat 中使用 `@` 符號呼叫 Agent：

```
@plan 分析這個需求並制定開發計畫
@arch 這個功能應該放在哪個架構層級？
@postgresql-dba 設計這個功能的資料表結構
@debug 這段程式碼為什麼會報錯？
```

### GitHub Copilot Coding Agent

在 Issue 或 PR 中 @ 提及相關 Agent 檔案：

```markdown
請參考 `.github/agents/planning/task-planner.agent.md` 來拆分這個功能的開發任務。
```

---

## 🔗 MCP 整合

這些 Agents 與以下 MCP 服務整合：

| Agent 類別 | MCP 服務 | 用途 |
|-----------|----------|------|
| `planning/` | `software-planning-tool`, `sequential-thinking` | 規劃與分析 |
| `architecture/` | `sequential-thinking`, `memory` | 架構決策 |
| `database/` | `supabase` | 資料庫操作 |
| `development/` | `filesystem`, `git` | 程式碼開發 |
| `testing/` | `playwright` | E2E 測試 |
| `specialized/` | `context7`, `redis` | 專案特定 |

---

## 📚 推薦組合

### 新功能開發
1. `@plan.agent` → 需求分析
2. `@arch.agent` → 架構決策
3. `@task-planner.agent` → 任務拆分
4. `@software-engineer-agent` → 實作

### 資料庫開發
1. `@postgresql-dba.agent` → Schema 設計
2. `@api-architect.agent` → API 設計
3. `@software-engineer-agent` → 實作

### 程式碼品質
1. `@critical-thinking.agent` → 方案評估
2. `@mentor.agent` → 最佳實踐
3. `@janitor.agent` → 程式碼清理

---

**最後更新**: 2025-12-02

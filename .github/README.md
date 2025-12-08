# 🏗️ .github 目錄結構指南

> GigHub - 工地施工進度追蹤管理系統的 GitHub 配置與 AI 輔助開發資源

[![Angular](https://img.shields.io/badge/Angular-20.3-dd0031?logo=angular)](https://angular.dev)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ecf8e?logo=supabase)](https://supabase.com)
[![Powered by Copilot](https://img.shields.io/badge/Powered_by-GitHub_Copilot-blue?logo=githubcopilot)](https://github.com/features/copilot)

---

## 📁 目錄總覽

```
.github/
├── README.md                     ← 你現在的位置
├── COPILOT_RESOURCES.md          ← Copilot 資源入口
├── CODEOWNERS                    ← 程式碼擁有者
├── FUNDING.yml                   ← 贊助設定
├── dependabot.yml                ← 依賴更新機器人
│
├── governance/                   ← 🏛️ 專案治理文件（新增）
│   ├── README.md                 ← 治理概覽
│   ├── GOVERNANCE.md             ← 治理結構與決策流程
│   ├── CONTRIBUTING.md           ← 貢獻指南
│   ├── CODE_OF_CONDUCT.md        ← 行為準則
│   └── SECURITY.md               ← 安全政策
│
├── ISSUE_TEMPLATE/               ← Issue 模板
│   ├── config.yml
│   ├── bug_report.yml            ← Bug 報告
│   ├── feature_request.yml       ← 功能請求
│   └── task.yml                  ← 開發任務
│
├── workflows/                    ← GitHub Actions CI/CD
│   ├── ci.yml                    ← 主要 CI 流程
│   ├── deploy-site.yml           ← 網站部署
│   ├── codeql.yml                ← 安全掃描
│   └── release.yml               ← 自動發佈
│
├── instructions/                 ← 📚 AI 編碼指令
│   ├── README.md
│   ├── angular.instructions.md   ← Angular 開發規範
│   ├── typescript-5-es2022.instructions.md
│   ├── security-and-owasp.instructions.md
│   └── [其他 AI 指令]
│
├── agents/                       ← 🤖 核心 AI Agents (精選)
│   ├── GigHub.agent.md           ← GigHub 專案主要 Agent
│   ├── context7+.agent.md        ← Context7 文檔專家 (基礎)
│   ├── context7++.agent.md       ← Context7 文檔專家 (進階)
│   └── [其他核心 Agents]
│
└── copilot/                      ← 🎯 完整 Copilot 配置與資源
    ├── README.md
    ├── copilot-instructions.md
    ├── styleguide.md
    ├── architecture-rules.md
    ├── domain-glossary.md
    ├── constraints.md
    ├── memory.jsonl
    ├── mcp-servers.yml           ← MCP 伺服器配置
    ├── security-rules.yml        ← 安全規則
    │
    ├── agents/                   ← 🤖 所有 AI Agents
    │   ├── config.yml            ← Agent 配置
    │   ├── auto-triggers.yml     ← 自動觸發規則
    │   ├── [架構類 Agents]
    │   ├── [規劃類 Agents]
    │   ├── [開發類 Agents]
    │   ├── [資料庫類 Agents]
    │   ├── [測試類 Agents]
    │   └── [品質類 Agents]
    │
    ├── prompts/                  ← 📝 所有 Prompt 模板
    │   ├── [規劃類 Prompts]
    │   ├── [程式碼生成 Prompts]
    │   ├── [品質檢查 Prompts]
    │   ├── [資料庫 Prompts]
    │   ├── [測試 Prompts]
    │   └── [文件 Prompts]
    │
    ├── collections/              ← 📦 主題集合
    │   ├── database-data-management.md
    │   └── frontend-web-dev.md
    │
    ├── instructions/             ← 📚 編碼標準
    ├── blueprints/               ← 標準化模板
    ├── workflows/                ← 開發工作流程
    ├── tests/                    ← 測試指引
    └── examples/                 ← 範例實作
```

---

## 🤖 MCP 整合支援

此結構設計完全支援以下 MCP (Model Context Protocol) 服務：

| MCP 服務 | 用途 | 對應資源 |
|----------|------|----------|
| `context7` | 外部函式庫文件查詢 | `instructions/`, `collections/` |
| `github` | GitHub API 操作 | `workflows/`, `prompts/github/` |
| `supabase` | 資料庫操作 | `agents/database/`, `prompts/database/` |
| `redis` | 快取操作 | `copilot/memory.jsonl` |
| `memory` | AI 記憶持久化 | `copilot/memory.jsonl` |
| `sequential-thinking` | 複雜問題分析 | `agents/quality/critical-thinking.agent.md` |
| `software-planning-tool` | 軟體規劃 | `agents/planning/`, `prompts/planning/` |
| `filesystem` | 檔案操作 | 所有目錄 |
| `git` | 版本控制 | `workflows/`, `prompts/github/` |
| `playwright` | E2E 測試 | `agents/testing/`, `copilot/tests/` |

---

## 🔄 推薦工作流程

### 🆕 新功能開發
```
@plan.agent → 需求分析
    ↓
@arch.agent → 架構決策
    ↓
create-specification.prompt → 規格書
    ↓
create-implementation-plan.prompt → 實作計畫
    ↓
copilot/blueprints → 程式碼生成
    ↓
@playwright-tester.agent → E2E 測試
```

### 🗄️ 資料庫開發
```
@postgresql-dba.agent → Schema 設計
    ↓
sql-sp-generation.instructions → SQL 標準
    ↓
postgresql-optimization.prompt → 效能優化
    ↓
copilot/agents/rls-policy.agent → RLS 政策
```

### 🔍 程式碼審查
```
code-review-generic.instructions → 審查標準
    ↓
review-and-refactor.prompt → 重構建議
    ↓
@janitor.agent → 程式碼清理
    ↓
conventional-commit.prompt → Commit 格式
```

---

## 📖 快速連結

### 專案治理
- [治理結構](./governance/GOVERNANCE.md)
- [貢獻指南](./governance/CONTRIBUTING.md)
- [行為準則](./governance/CODE_OF_CONDUCT.md)
- [安全政策](./governance/SECURITY.md)

### AI 開發資源
- [Copilot 資源總覽](./COPILOT_RESOURCES.md)
- [專案 Copilot 配置](./copilot/README.md)
- [AI 編碼指令](./instructions/README.md)

---

## 🏗️ 技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| Angular | 20.3.x | 前端框架 |
| ng-alain | 20.1.x | Admin 框架 |
| ng-zorro-antd | 20.3.x | UI 元件庫 |
| Supabase | 2.x | BaaS 後端 |
| PostgreSQL | 15.x | 資料庫 |
| TypeScript | 5.9.x | 開發語言 |

---

**最後更新**: 2025-12-02

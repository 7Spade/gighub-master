# 🤖 GitHub Copilot 專案腳手架

> GigHub - 工地施工進度追蹤管理系統的 AI 輔助開發資源

[![Powered by Awesome Copilot](https://img.shields.io/badge/Powered_by-Awesome_Copilot-blue?logo=githubcopilot)](https://github.com/github/awesome-copilot)

---

## 📁 資料夾結構

```
.github/
├── COPILOT_RESOURCES.md      ← 你現在的位置（資源總覽）
├── copilot/                  ← 🎯 專案核心 Copilot 配置
│   ├── README.md             ← 入口說明
│   ├── copilot-instructions.md ← 全域行為規範
│   ├── styleguide.md         ← Angular + ng-alain + Supabase 風格
│   ├── architecture-rules.md ← 三層架構決策
│   ├── domain-glossary.md    ← 工地領域名詞
│   ├── constraints.md        ← 系統反模式規則
│   ├── agents/               ← 專案專用 Agent
│   ├── prompts/              ← 專案專用 Prompt
│   ├── blueprints/           ← 標準化模板
│   ├── workflows/            ← 開發工作流程
│   ├── tests/                ← 測試指引
│   └── examples/             ← 範例實作
│
├── agents/                   ← 🤖 通用 Agent 集合
├── prompts/                  ← 🎯 通用 Prompt 模板
├── instructions/             ← 📚 編碼標準與最佳實踐
├── collections/              ← 📦 主題集合
└── workflows/                ← ⚙️ GitHub Actions
```

---

## 🤖 Agents (`.github/copilot/agents/`)

專門化的 Copilot 代理，提供特定領域的協助能力。

### 🏗️ 規劃與架構
| Agent | 說明 | 使用場景 |
|-------|------|---------|
| `plan.agent.md` | 策略規劃助手 | 需求分析、功能規劃 |
| `planner.agent.md` | 實作規劃生成 | 生成詳細實作計畫 |
| `implementation-plan.agent.md` | 實作計畫執行 | 分階段實作指引 |
| `arch.agent.md` | 架構設計指引 | 系統架構決策 |
| `adr-generator.agent.md` | ADR 生成器 | 架構決策記錄 |

### 💻 開發輔助
| Agent | 說明 | 使用場景 |
|-------|------|---------|
| `debug.agent.md` | 系統化除錯 | Bug 排查與修復 |
| `code-tour.agent.md` | 程式碼導覽 | 理解程式碼結構 |
| `mentor.agent.md` | 開發指導 | 學習與最佳實踐 |
| `janitor.agent.md` | 程式碼清理 | 重構與優化 |
| `critical-thinking.agent.md` | 批判性思考 | 方案評估與決策 |

### 🔧 專業領域
| Agent | 說明 | 使用場景 |
|-------|------|---------|
| `postgresql-dba.agent.md` | PostgreSQL 管理 | 資料庫設計與優化 |
| `api-architect.agent.md` | API 架構設計 | RESTful API 設計 |
| `specification.agent.md` | 規格書撰寫 | 功能規格文件 |
| `software-engineer-agent-v1.agent.md` | 全端工程師 | 完整功能開發 |
| `playwright-tester.agent.md` | E2E 測試 | 自動化測試撰寫 |

### 📋 專案管理
| Agent | 說明 | 使用場景 |
|-------|------|---------|
| `task-planner.agent.md` | 任務規劃 | 拆分開發任務 |
| `task-researcher.agent.md` | 任務研究 | 技術調查與評估 |
| `tech-debt-remediation-plan.agent.md` | 技術債處理 | 技術債清理計畫 |
| `principal-software-engineer.agent.md` | 資深工程師 | 複雜問題解決 |

---

## 🎯 Prompts (`.github/prompts/`)

可重複使用的任務導向 Prompt 模板。

### 📐 架構與規劃
| Prompt | 說明 |
|--------|------|
| `create-specification.prompt.md` | 建立功能規格書 |
| `create-implementation-plan.prompt.md` | 生成實作計畫 |
| `breakdown-plan.prompt.md` | 拆分任務樹 |
| `create-architectural-decision-record.prompt.md` | 建立 ADR |
| `architecture-blueprint-generator.prompt.md` | 架構藍圖生成 |
| `folder-structure-blueprint-generator.prompt.md` | 資料夾結構生成 |

### 🔧 程式碼品質
| Prompt | 說明 |
|--------|------|
| `review-and-refactor.prompt.md` | 程式碼審查與重構 |
| `conventional-commit.prompt.md` | 規範化 Commit 訊息 |
| `add-educational-comments.prompt.md` | 教學式註解生成 |
| `code-exemplars-blueprint-generator.prompt.md` | 程式碼範例生成 |
| `create-readme.prompt.md` | README 生成 |

### 🗄️ 資料庫
| Prompt | 說明 |
|--------|------|
| `postgresql-code-review.prompt.md` | PostgreSQL 程式碼審查 |
| `postgresql-optimization.prompt.md` | PostgreSQL 效能優化 |
| `sql-code-review.prompt.md` | SQL 程式碼審查 |
| `sql-optimization.prompt.md` | SQL 效能優化 |

### 🔄 GitHub 整合
| Prompt | 說明 |
|--------|------|
| `create-github-issue-feature-from-specification.prompt.md` | 從規格建立 Issue |
| `create-github-issues-feature-from-implementation-plan.prompt.md` | 從計畫建立 Issue |
| `create-github-action-workflow-specification.prompt.md` | GitHub Actions 規格 |

### 🧪 測試
| Prompt | 說明 |
|--------|------|
| `playwright-generate-test.prompt.md` | E2E 測試生成 |

---

## 📚 Instructions (`.github/instructions/`)

檔案模式自動套用的編碼標準與最佳實踐。

### 🎨 前端開發
| Instruction | 適用檔案 | 說明 |
|-------------|---------|------|
| `angular.instructions.md` | `*.ts, *.html, *.scss` | Angular 20 編碼標準 |
| `typescript-5-es2022.instructions.md` | `*.ts` | TypeScript 5 指引 |
| `a11y.instructions.md` | 全部 | 無障礙標準 |

### 🗄️ 資料庫
| Instruction | 適用檔案 | 說明 |
|-------------|---------|------|
| `sql-sp-generation.instructions.md` | `*.sql` | SQL/預存程序標準 |

### 🔒 品質與安全
| Instruction | 適用檔案 | 說明 |
|-------------|---------|------|
| `code-review-generic.instructions.md` | 全部 | 程式碼審查標準 |
| `security-and-owasp.instructions.md` | 全部 | OWASP 安全最佳實踐 |
| `performance-optimization.instructions.md` | 全部 | 效能優化指引 |

### ⚙️ DevOps
| Instruction | 適用檔案 | 說明 |
|-------------|---------|------|
| `devops-core-principles.instructions.md` | 全部 | DevOps 核心原則 |
| `containerization-docker-best-practices.instructions.md` | `Dockerfile, *.yml` | Docker 最佳實踐 |
| `github-actions-ci-cd-best-practices.instructions.md` | `.github/workflows/*` | CI/CD 最佳實踐 |

---

## 📦 Collections (`.github/collections/`)

主題化的資源集合。

| Collection | 說明 |
|------------|------|
| `database-data-management.md` | 資料庫管理資源集合 |
| `frontend-web-dev.md` | 前端開發資源集合 |

---

## 🔄 推薦工作流程

### 1️⃣ 新功能開發流程
```
@plan agent → 需求分析
    ↓
create-specification.prompt → 規格書
    ↓
create-implementation-plan.prompt → 實作計畫
    ↓
breakdown-plan.prompt → 任務拆分
    ↓
create-github-issues-feature-from-implementation-plan.prompt → GitHub Issues
```

### 2️⃣ 資料庫開發流程
```
@postgresql-dba agent → Schema 設計
    ↓
sql-sp-generation.instructions → SQL 標準
    ↓
postgresql-optimization.prompt → 效能優化
    ↓
postgresql-code-review.prompt → 審查
```

### 3️⃣ 程式碼品質流程
```
code-review-generic.instructions → 審查標準
    ↓
review-and-refactor.prompt → 重構建議
    ↓
@janitor agent → 清理
    ↓
conventional-commit.prompt → Commit
```

### 4️⃣ 架構決策流程
```
@arch agent → 架構諮詢
    ↓
architecture-blueprint-generator.prompt → 藍圖
    ↓
create-architectural-decision-record.prompt → ADR
    ↓
@adr-generator agent → 文件化
```

---

## 🎯 專案特定配置

詳細的專案配置請參考 [`.github/copilot/README.md`](./copilot/README.md)

### 核心技術棧
| 技術 | 版本 | 用途 |
|------|------|------|
| Angular | 20.x | 前端框架 |
| ng-alain | 20.x | Admin 框架 |
| ng-zorro-antd | 20.x | UI 元件庫 |
| Supabase | 2.x | BaaS 後端 |
| PostgreSQL | 15.x | 資料庫 |

### 三層架構
```
┌─────────────────────────────────────────────────────────────────┐
│                    基礎層 (Foundation Layer)                     │
│   帳戶體系 │ 認證授權 │ 組織管理 │ 團隊管理 │ Bot 管理           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    容器層 (Container Layer)                      │
│   藍圖系統 │ 權限控制 │ 事件總線 │ 搜尋引擎                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    業務層 (Business Layer)                       │
│   任務模組 │ 日誌模組 │ 品質驗收 │ 問題追蹤 │ 檔案管理 │ 文件模組 │ 財務模組 │ 溝通模組 │ 協作模組 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📖 延伸資源

- [GitHub Awesome Copilot](https://github.com/github/awesome-copilot)
- [Angular 官方文檔](https://angular.dev)
- [ng-alain 文檔](https://ng-alain.com)
- [Supabase 文檔](https://supabase.com/docs)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)

---

**最後更新**: 2025-12-01

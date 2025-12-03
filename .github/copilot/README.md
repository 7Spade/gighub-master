# 🤖 Copilot 指令中心

> **GigHub - 工地施工進度追蹤管理系統** 的 AI 輔助開發指引

[![Angular](https://img.shields.io/badge/Angular-20.3-dd0031?logo=angular)](https://angular.dev)
[![Supabase](https://img.shields.io/badge/Supabase-2.86-3ecf8e?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)](https://www.typescriptlang.org)

---

## 📋 目錄結構

```
.github/copilot/
├── README.md                        ← 你現在的位置（入口說明）
├── copilot-instructions.md          ← 全域行為規範（語氣/風格/規則）
├── styleguide.md                    ← Angular + ng-alain + Supabase 程式風格
├── architecture-rules.md            ← 三層架構決策：Foundation / Container / Business
├── domain-glossary.md               ← 工地領域名詞：任務 / 日誌 / 品質驗收 / 藍圖
├── constraints.md                   ← 系統不允許發生的反模式規則
├── memory.jsonl                     ← AI 記憶持久化
│
├── agents/                          ← 專用 Agent 指令
│   ├── prd-analysis.agent.md        ← PRD 解析 Agent
│   ├── architecture.agent.md        ← 架構決策 Agent
│   ├── business-model.agent.md      ← 業務模組選擇 Agent
│   ├── code-review.agent.md         ← 企業級 Code Review Agent
│   └── rls-policy.agent.md          ← Supabase RLS 政策生成 Agent
│
├── prompts/                         ← 可重複使用的 Prompt 模板
│   ├── generate-feature.prompt.md   ← 垂直切片 Feature 生成
│   ├── generate-component.prompt.md ← Standalone Component 建置
│   ├── create-store.prompt.md       ← Signals Store + Repository 模板
│   ├── add-educational-comments.prompt.md ← 教學式註解生成
│   ├── prd-to-tasks.prompt.md       ← PRD 分拆任務樹
│   └── copilot-instructions-blueprint-generator.prompt.md ← 指令生成器
│
├── blueprints/                      ← 標準化模板
│   ├── angular-feature.blueprint.md ← Feature 標準結構
│   ├── supabase-table.blueprint.md  ← 資料表 + RLS + Triggers
│   ├── blueprint-container.blueprint.md ← 藍圖邏輯容器模板
│   ├── task-module.blueprint.md     ← 任務系統模板
│   └── diary-module.blueprint.md    ← 日誌模組模板
│
├── workflows/                       ← 開發工作流程
│   ├── new-module.workflow.md       ← 新模組開發流程
│   ├── release-check.workflow.md    ← 發版檢查流程
│   └── rls-check.workflow.md        ← RLS 政策驗證流程
│
├── tests/                           ← 測試指引
│   ├── unit-test-guidelines.md      ← 單元測試規範
│   └── e2e-guidelines.md            ← E2E 測試策略
│
└── examples/                        ← 範例實作
    └── completed-feature.example.md ← 完整垂直切片範例
```

---

## 🚀 快速開始

### 開發新功能

1. **了解需求** → 閱讀 `docs/prd/construction-site-management.md`
2. **架構定位** → 參考 `architecture-rules.md` 決定功能所屬層級
3. **選擇模組** → 使用 `agents/business-model.agent.md` 確認業務模組
4. **生成代碼** → 使用 `prompts/generate-feature.prompt.md` 生成垂直切片
5. **撰寫測試** → 參考 `tests/unit-test-guidelines.md`

### 理解系統架構

```
┌─────────────────────────────────────────────────────────────────┐
│                    基礎層 (Foundation Layer)                     │
│   帳戶體系 │ 認證授權 │ 組織管理 │ 團隊管理 │ Bot 管理           │
│   📖 docs/features/foundation/                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    容器層 (Container Layer)                      │
│   藍圖系統 │ 權限控制 │ 事件總線 │ 搜尋引擎                      │
│   📖 docs/features/container/                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    業務層 (Business Layer)                       │
│   任務模組 │ 日誌模組 │ 品質驗收 │ 問題追蹤 │ 檔案管理           │
│   📖 docs/features/business/                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 核心參考文件

| 文件 | 說明 | 路徑 |
|------|------|------|
| 文件中心 | 文件入口 | `docs/README.md` |
| 專案架構 | 完整架構分析 | `docs/GigHub_Architecture.md` |
| PRD | 產品需求文件 | `docs/prd/construction-site-management.md` |
| 系統架構 | 完整架構設計圖 | `docs/architecture/system-architecture.md` |
| AI 思維導圖 | Agent 決策流程 | `docs/agent/mindmap.md` |
| 術語表 | 專案術語定義 | `docs/GLOSSARY.md` |
| 編碼標準 | 程式碼規範 | `docs/reference/coding-standards.md` |
| 測試策略 | 測試指南 | `docs/reference/testing-strategy.md` |
| RLS 政策 | 安全權限規則 | `docs/supabase/rls/` |

---

## 🛠️ 技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| Angular | 20.3.x | 前端框架（Standalone Components + Signals）|
| ng-alain | 20.1.x | Admin 框架 |
| ng-zorro-antd | 20.4.x | UI 元件庫 |
| Supabase | 2.86.x | BaaS 後端 |
| TypeScript | 5.9.x | 開發語言 |
| RxJS | 7.8.x | 響應式程式 |
| Yarn | 4.9.2 | 包管理器 |

---

## 🎯 核心理念

> **奧卡姆剃刀原則**：每個功能只做必要的事，避免過度設計

1. **藍圖是邏輯容器** - 提供資料隔離、上下文共享、多模組擴展的基礎架構
2. **任務是主核心模組** - 工地管理的一切操作都圍繞任務展開
3. **其他模組依附任務** - 進度追蹤、品質驗收、日誌、檔案等皆以任務為主體開發
4. **上下文層層傳遞** - 平台 → 藍圖 → 模組，避免重複查詢

---

## 🔗 相關資源

### 內部資源
- [文件中心](../../docs/README.md) - 完整技術文件
- [專案架構](../../docs/GigHub_Architecture.md) - 專案分析與路線圖
- [貢獻指南](../../docs/contributing/README.md) - 開發者指南

### 外部資源
- [Angular 官方文檔](https://angular.dev)
- [ng-alain 文檔](https://ng-alain.com)
- [ng-zorro-antd 文檔](https://ng.ant.design)
- [Supabase 文檔](https://supabase.com/docs)

---

**最後更新**: 2025-12-03

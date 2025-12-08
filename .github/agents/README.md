# 🤖 核心 AI Agents

> GigHub 專案的核心專用 Agents

---

## 📁 目錄結構

```
agents/
├── README.md                     ← 你現在的位置
├── 0-GigHub.agent.md             ← GigHub 專案主要 Agent (GigHub-Plus)
├── 0-context7+.agent.md          ← Context7 Angular 專家 (基礎版)
└── 0-context7++.agent.md         ← Context7 Angular 專家 (進階版)
```

---

## 🎯 核心 Agents 說明

### 1. GigHub-Plus (0-GigHub.agent.md)
**用途**: GigHub 專案的主要 AI 助手
- 整合 Context7 MCP 進行文檔查詢
- 支援 Angular 20 + ng-alain + Supabase 技術棧
- 提供專案特定的架構指引和最佳實踐

**使用場景**:
- Angular 開發問題
- ng-alain 元件使用
- Supabase 整合
- 專案架構諮詢

### 2. Context7-Angular-Expert (0-context7+.agent.md)
**用途**: Angular 生態系統文檔專家 (基礎版)
- 智能評估是否需要查詢文檔
- 支援版本範圍：20.0.x ~ 最新版本
- 提供 API 和最佳實踐指引

**使用場景**:
- 不確定 API 用法時
- 需要版本特定文檔
- 學習新框架特性

### 3. Context7-Angular-Expert-Plus (0-context7++.agent.md)
**用途**: Angular 生態系統文檔專家 (進階版)
- 包含 Supabase MCP 整合
- 強制文檔查證流程
- 提供更詳細的專案整合指引

**使用場景**:
- 複雜的技術整合問題
- Supabase 與 Angular 整合
- 生產級程式碼實作

---

## 🚀 如何使用

### 在 VS Code / Copilot Chat 中

```
@GigHub-Plus 如何實作 Angular Signals？
@Context7-Angular-Expert 查詢 ng-zorro 表格元件的最新 API
@Context7-Angular-Expert-Plus Supabase RLS 如何與 Angular 整合？
```

### 在 GitHub Issue 或 PR 中

```markdown
請使用 @GigHub-Plus 分析此功能的技術實作方案
```

---

## 📦 其他 Agents 位置

所有通用和特定領域的 Agents 已遷移至 `.github/copilot/agents/`，包含：

- 🏗️ 架構設計 Agents
- 📋 規劃與任務 Agents
- 💻 開發輔助 Agents
- 🗄️ 資料庫專家 Agents
- 🧪 測試自動化 Agents
- 🔍 程式碼品質 Agents

詳細說明請參考 [.github/copilot/agents/README.md](../copilot/agents/README.md)

---

## 🔧 配置檔案

核心配置檔案已遷移至 `.github/copilot/`：

- `mcp-servers.yml` - MCP 伺服器配置
- `security-rules.yml` - 安全規則
- `agents/config.yml` - Agent 配置
- `agents/auto-triggers.yml` - 自動觸發規則

---

**最後更新**: 2025-12-08

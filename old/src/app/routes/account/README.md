# Account Routes

帳號管理路由頁面模組 | Account Management Routes Module

## 📋 概述 | Overview

此模組包含帳號管理相關的路由頁面組件，提供用戶、組織、團隊等帳號實體的管理介面。

This module contains route page components for account management, providing management interfaces for users, organizations, teams, and other account entities.

## 🎯 架構設計 | Architecture

### 統一上下文感知組件 | Unified Context-Aware Components

本模組採用**統一上下文感知設計**，根據當前工作區上下文（Workspace Context）動態顯示不同內容：

- **Dashboard Component**：統一儀表板組件，根據上下文顯示個人/組織/團隊儀表板
- **Settings Component**：統一設定組件，根據上下文顯示個人/組織/團隊設定

### 上下文切換機制 | Context Switching Mechanism

組件通過 `WorkspaceContextFacade` 獲取當前上下文：
- `contextType()`：當前上下文類型（USER/ORGANIZATION/TEAM）
- `contextId()`：當前上下文 ID
- `contextLabel()`：當前上下文顯示名稱
- `contextIcon()`：當前上下文圖標

## 📂 目錄結構 | Directory Structure

```
account/
├── routes.ts                  # 主路由配置
├── dashboard/                 # 統一儀表板組件
│   ├── dashboard.component.ts # 主組件（容器組件）
│   ├── components/            # 子組件目錄
│   │   ├── user-dashboard.component.ts
│   │   ├── organization-dashboard.component.ts
│   │   ├── team-dashboard.component.ts
│   │   └── index.ts           # Barrel file
│   └── index.ts               # Barrel file
├── settings/                  # 統一設定組件
│   ├── settings.component.ts  # 主組件（容器組件）
│   ├── components/            # 子組件目錄
│   │   ├── user-settings.component.ts
│   │   ├── organization-settings.component.ts
│   │   └── index.ts           # Barrel file
│   └── index.ts               # Barrel file
├── user/                      # 用戶路由（舊版，保留以向後兼容）
│   ├── routes.ts
│   ├── dashboard/
│   ├── settings/
│   └── todos/
├── team/                      # 團隊路由（舊版，保留以向後兼容）
│   ├── routes.ts
│   ├── dashboard/
│   ├── members/
│   └── todos/
├── org/                       # 組織路由（舊版，保留以向後兼容）
│   ├── routes.ts
│   ├── dashboard/
│   ├── members/
│   ├── settings/
│   └── teams/
└── [其他組件...]
```

## 🛣️ 路由配置 | Route Configuration

### 統一路由（推薦）| Unified Routes (Recommended)

- `/account/dashboard` - 統一儀表板（根據上下文顯示）
- `/account/settings` - 統一設定（根據上下文顯示）

### 舊版路由（向後兼容）| Legacy Routes (Backward Compatible)

#### 用戶路由 | User Routes
- `/account/user/:userId/dashboard` - 個人儀表板（舊版）
- `/account/user/:userId/todos` - 我的待辦
- `/account/user/:userId/settings` - 個人設定（舊版）

#### 團隊路由 | Team Routes
- `/account/team/:teamId/dashboard` - 團隊儀表板（舊版）
- `/account/team/:teamId/todos` - 團隊待辦
- `/account/team/:teamId/members` - 團隊成員

#### 組織路由 | Organization Routes
- `/account/org/:organizationId/dashboard` - 組織儀表板（舊版）
- `/account/org/:organizationId/teams` - 團隊管理
- `/account/org/:organizationId/members` - 成員管理
- `/account/org/:organizationId/settings` - 組織設定（舊版）

## 🔄 遷移指南 | Migration Guide

### 從舊版路由遷移到統一路由

**舊版路由**（已棄用）：
```typescript
// 舊版：需要明確指定用戶 ID
/account/user/{userId}/dashboard
/account/user/{userId}/settings

// 舊版：需要明確指定組織 ID
/account/org/{organizationId}/dashboard
/account/org/{organizationId}/settings
```

**統一路由**（推薦）：
```typescript
// 新版：自動根據當前上下文顯示
/account/dashboard
/account/settings
```

### 菜單配置更新

菜單配置已更新為使用統一路由，不再需要動態參數：

```json
{
  "text": "儀表板",
  "link": "/account/dashboard"  // ✅ 統一路由
}
```

## 💡 使用範例 | Usage Examples

### Dashboard Component

```typescript
// 組件自動根據上下文顯示不同內容
// Component automatically displays different content based on context

// 當上下文為 USER 時
// When context is USER
contextType() === 'user' → 顯示「個人儀表板」

// 當上下文為 ORGANIZATION 時
// When context is ORGANIZATION
contextType() === 'organization' → 顯示「組織儀表板」

// 當上下文為 TEAM 時
// When context is TEAM
contextType() === 'team' → 顯示「團隊儀表板」
```

### Settings Component

```typescript
// 組件自動根據上下文顯示不同設定
// Component automatically displays different settings based on context

// 當上下文為 USER 時
// When context is USER
contextType() === 'user' → 顯示「個人設定」

// 當上下文為 ORGANIZATION 時
// When context is ORGANIZATION
contextType() === 'organization' → 顯示「組織設定」
```

## 🏗️ 組件設計原則 | Component Design Principles

### 1. 上下文感知 | Context Awareness

- 組件通過 `WorkspaceContextFacade` 獲取當前上下文
- 使用 `computed()` Signal 根據上下文動態計算顯示內容
- 使用 `@switch` 語句根據上下文類型顯示不同內容

### 2. 企業標準 | Enterprise Standards

- ✅ 使用 `SHARED_IMPORTS` 統一導入
- ✅ 使用 `ChangeDetectionStrategy.OnPush` 優化性能
- ✅ 使用 Angular 20+ 現代語法（`@if`、`@for`、`@switch`）
- ✅ 使用 Signals 管理狀態
- ✅ 注入 Facade 而非直接注入 Service

### 3. 錯誤處理 | Error Handling

- 當沒有有效上下文時，顯示友好的空狀態
- 提供導航到帳戶管理的按鈕
- 使用 `nz-empty` 組件顯示空狀態

## 🔧 重構說明 | Refactoring Notes

### 2025-01-20 重構

**重構內容**：
- ✅ 修復 `BaseContextAwareComponent` 的 TypeScript 類型錯誤
- ✅ 將子組件分離到獨立文件（`components/` 目錄）
- ✅ 創建 barrel files (`index.ts`) 簡化導入
- ✅ 確保依賴方向清晰（Types → Services → Facades → Components）

**目錄結構變更**：
- 新增 `dashboard/components/` 目錄存放子組件
- 新增 `settings/components/` 目錄存放子組件
- 新增 `dashboard/index.ts` 和 `settings/index.ts` barrel files

**詳細重構報告**：請參考 [Workspace Switcher 重構報告](../../../docs/guides/workspace-switcher-refactoring-report.md)

## 📚 相關文檔 | Related Documentation

- [上下文切換器文檔](../../../docs/archive/2025/design-docs/CONTEXT_SWITCHER_DOCUMENTATION_GUIDE.md)
- [WorkspaceContextFacade](../../core/facades/account/workspace-context.facade.ts)
- [Workspace Switcher 重構報告](../../../docs/guides/workspace-switcher-refactoring-report.md)
- [Workspace Switcher 企業標準規劃](../../../docs/guides/workspace-switcher-enterprise-standards-plan.md)
- [Routes 模組開發規範](./AGENTS.md)

## 🔮 未來計劃 | Future Plans

- [ ] 移除舊版路由（完成遷移後）
- [ ] 添加更多上下文感知組件（todos、members 等）
- [ ] 實現完整的儀表板統計功能
- [ ] 實現完整的設定功能

---

**最後更新**：2025-01-20  
**維護者**：開發團隊

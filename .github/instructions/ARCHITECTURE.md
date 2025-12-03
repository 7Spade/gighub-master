---
description: '系統架構概覽與重要設計決策紀錄'
applyTo: '**'
---

# Architecture

系統架構概覽與重要設計決策紀錄。

記錄系統整體架構、技術選型、模組劃分與設計原則。

## 技術棧

- 前端框架：Angular 20 + ng-alain + ng-zorro-antd
- 狀態管理：Angular Signals
- 後端服務：Supabase (PostgreSQL + Auth + Storage + Realtime)
- 開發語言：TypeScript 5.x
- 套件管理：Yarn 4.x

## 架構原則

- 使用 Standalone Components，避免 NgModules
- 採用三層架構：UI 層、業務層、資料層
- 使用 Repository 模式封裝資料存取
- 使用 Facade 模式管理業務邏輯
- 遵循單一職責原則，保持模組獨立

## 目錄結構

- `src/app/core/` - 核心服務與基礎設施
- `src/app/shared/` - 共用元件、指令、管道
- `src/app/routes/` - 路由配置
- `src/app/features/` - 功能模組（按業務領域劃分）

## 設計決策

- 優先使用 Angular Signals 進行狀態管理
- 使用 OnPush 變更檢測策略優化效能
- 使用 Lazy Loading 減少初始載入時間
- 使用 Supabase RLS 確保資料安全
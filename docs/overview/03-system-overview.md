# GigHub 系統架構概述

> 本文件提供 GigHub 系統的高層級架構概述

## 系統定位

GigHub 採用現代化的全端技術棧，基於 **三層架構**（Three-Tier Architecture）設計，確保系統的可擴展性、可維護性與安全性。

## 技術棧

### 前端
- **Angular 20.3.x** - Standalone Components, Signals 狀態管理
- **ng-alain 20.1.x** - 企業級管理框架
- **ng-zorro-antd 20.3.x** - UI 元件庫

### 後端
- **Supabase 2.86.x** - BaaS 後端服務
  - PostgreSQL 資料庫
  - Row Level Security (RLS)
  - Realtime 訂閱
  - Storage 檔案管理

### 其他
- **TypeScript 5.9.x** - 型別安全
- **RxJS 7.8.x** - 響應式程式設計
- **Yarn 4.9.2** - 包管理器

## 三層架構

GigHub 系統採用三層架構設計：

### 1. Foundation Layer（基礎層）
負責基礎功能與帳戶體系：
- 帳戶管理（Accounts）
- 組織管理（Organizations）
- 團隊管理（Teams）
- 認證授權（Authentication & Authorization）

### 2. Container Layer（容器層）
負責專案容器與權限控制：
- 藍圖系統（Blueprints）
- 權限控制（Permissions）
- 事件總線（Event Bus）
- 模組管理（Module Management）

### 3. Business Layer（業務層）
負責具體業務功能：
- 任務管理（Tasks）
- 施工日誌（Daily Logs）
- 品質驗收（Quality Acceptance）
- 檔案管理（File Management）

## 詳細架構文件

更多技術細節請參閱：
- [完整系統架構](../design/architecture/gighub-architecture.md)
- [系統架構圖](../design/architecture/system-architecture.md)
- [基礎設施狀態](../design/architecture/infrastructure-status.md)

## 相關文件

- [專案願景](./01-project-vision.md)
- [使用者場景](./02-user-scenarios.md)
- [專案結構](./project-structure.md)
- [術語表](./04-glossary.md)

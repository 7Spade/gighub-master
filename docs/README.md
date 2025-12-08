# 📚 GigHub 專案文件

> **GigHub - 工地施工進度追蹤管理系統** 完整技術文件

歡迎來到 GigHub 專案文件！本文件庫依照 [DOCS_SPECIFICATION.md](../DOCS_SPECIFICATION.md) 規範組織，提供完整的專案資訊。

---

## 🗂️ 文件結構

### 📖 [overview/](./overview/) - 專案總覽
快速了解專案定位、願景與架構概述

- [專案願景](./overview/01-project-vision.md)
- [使用者場景](./overview/02-user-scenarios.md)
- [系統架構概述](./overview/03-system-overview.md)
- [術語表](./overview/04-glossary.md)
- [專案結構](./overview/project-structure.md)

### ⚙️ [setup/](./setup/) - 環境設定
開發環境安裝與部署指南

- [前置需求](./setup/01-prerequisites.md)
- [開發環境設定](./setup/02-development-setup.md)
- [安裝指南](./setup/03-installation.md)
- [快速開始](./setup/04-quick-start.md)
- [部署指南](./setup/05-deployment.md)

### 📚 [guides/](./guides/) - 操作指南
模組使用方式與最佳實踐

- [Foundation Layer](./guides/foundation/) - 基礎層功能
- [Container Layer](./guides/container/) - 容器層功能
- [Business Layer](./guides/business/) - 業務層功能
- [權限系統](./guides/permission-system.md)

### 📘 [reference/](./reference/) - 技術參考
API、資料庫、模型等正式規格文件

- [API 文件](./reference/api/)
- [資料庫](./reference/database/)
  - [Schema](./reference/database/schema/)
  - [RLS 政策](./reference/database/rls/)
  - [Functions](./reference/database/functions.md)
  - [Migrations](./reference/database/migrations.md)
- [資料模型](./reference/models/)
- [事件系統](./reference/events/)

### 🎨 [design/](./design/) - 設計文件
架構設計、流程圖、ADR 與草稿

- [架構設計](./design/architecture/)
- [業務流程](./design/flows/)
- [圖表](./design/diagrams/)
- [ADR (Architecture Decision Records)](./design/adr/)
- [設計草稿](./design/drafts/)

### 🚀 [development/](./development/) - 開發追蹤
開發路線圖、進度與問題追蹤

- [開發路線圖](./development/roadmap.md)
- [技術問題](./development/issues/)
- [參考文件](./development/keep-001-reference.md)

### 📊 [progress/](./progress/) - 進度追蹤
即時開發進度記錄（保持原樣）

- [已完成項目](./progress/done.md)
- [待辦事項](./progress/todo.md)
- [問題追蹤](./progress/issues.md)

### 🔧 [operations/](./operations/) - 維運文件
監控、日誌、備份等維運指南（開發階段）

### 💡 [examples/](./examples/) - 範例程式碼
可執行的程式碼範例與 Demo

### 📋 [meta/](./meta/) - 專案管理
貢獻指南、版本策略、Git 工作流程

- [貢獻指南](./meta/CONTRIBUTING.md)
- [更新日誌](./meta/CHANGELOG.md)
- [程式碼審查指南](./meta/code-review-guidelines.md)
- [編碼規範](./meta/coding-standards.md)
- [Git 工作流程](./meta/git-workflow.md)
- [發布流程](./meta/release-process.md)
- [測試策略](./meta/testing-strategy.md)
- [Agent 使用指南](./meta/agent-guide.md)

---

## 🚀 快速導航

### 新手入門
1. 📖 閱讀 [專案願景](./overview/01-project-vision.md)
2. ⚙️ 設定 [開發環境](./setup/02-development-setup.md)
3. 🏃 執行 [快速開始](./setup/04-quick-start.md)
4. 📚 參考 [操作指南](./guides/)

### 開發者
- 📘 [API 文件](./reference/api/)
- 🗃️ [資料庫 Schema](./reference/database/schema/)
- 🎨 [架構設計](./design/architecture/)
- 📋 [編碼規範](./meta/coding-standards.md)

### 貢獻者
- 📋 [貢獻指南](./meta/CONTRIBUTING.md)
- 🔀 [Git 工作流程](./meta/git-workflow.md)
- 📝 [程式碼審查指南](./meta/code-review-guidelines.md)

---

## 📝 文件規範

本專案文件遵循 [DOCS_SPECIFICATION.md](../DOCS_SPECIFICATION.md) 規範，包含：

- ✅ 清晰的目錄結構
- ✅ 統一的命名規範
- ✅ 明確的文件分類
- ✅ 完整的維護指南

### 文件更新原則

1. **每次功能開發** - 更新相關 API、Schema、Guides
2. **每次版本發佈** - 更新 CHANGELOG、檢查一致性
3. **每季檢視** - 回顧 backlog、整理草稿

---

## 🔗 相關資源

- [DOCS_SPECIFICATION.md](../DOCS_SPECIFICATION.md) - 文件架構規範
- [專案根目錄 README](../README.md) - 專案主頁
- [Supabase 文件](https://supabase.com/docs)
- [Angular 文件](https://angular.dev)
- [ng-alain 文件](https://ng-alain.com)

---

## 📞 聯絡與支援

如有文件問題或建議，請：
1. 提交 [GitHub Issue](https://github.com/7Spade/gighub-master/issues)
2. 參考 [貢獻指南](./meta/CONTRIBUTING.md)

---

**文檔版本**: 2.0.0  
**最後更新**: 2025-12-06  
**維護者**: GigHub Development Team

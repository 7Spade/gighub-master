# 📦 容器層功能

> Container Layer - 資料隔離與權限控制

---

## 📋 功能清單

| 功能 | 說明 | 文件 |
|------|------|------|
| 藍圖系統 | 邏輯容器框架 | [blueprint-system.md](./blueprint-system.md) |
| 存取控制 | RBAC 權限管理 | [access-control.md](./access-control.md) |

---

## 🔧 核心實體

| 實體 | 資料表 | 說明 |
|------|--------|------|
| 藍圖 | `blueprints` | 邏輯容器 |
| 藍圖成員 | `blueprint_members` | 成員與角色 |
| 藍圖角色 | `blueprint_roles` | 自訂角色 |

---

## 🔗 相關服務

| 服務 | 位置 | 說明 |
|------|------|------|
| BlueprintShellComponent | `features/blueprint/shell/` | 藍圖邏輯容器 |
| BlueprintStore | `features/blueprint/data-access/stores/` | 藍圖狀態管理 |

---

**最後更新**: 2025-12-02

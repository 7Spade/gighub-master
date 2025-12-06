# 🏛️ 基礎層功能

> Foundation Layer - 系統基礎設施

---

## 📋 功能清單

| 功能 | 說明 | 文件 |
|------|------|------|
| 認證系統 | Supabase Auth 整合 | [authentication.md](./authentication.md) |
| 使用者管理 | 使用者 CRUD | [user-management.md](./user-management.md) |
| 組織管理 | 組織、團隊管理 | [organization-management.md](./organization-management.md) |

---

## 🔧 核心實體

| 實體 | 資料表 | 說明 |
|------|--------|------|
| 帳戶 | `accounts` | USER / ORGANIZATION / BOT |
| 組織成員 | `organization_members` | 用戶與組織關聯 |
| 團隊 | `teams` | 組織子單位 |
| 團隊成員 | `team_members` | 用戶與團隊關聯 |

---

## 🔗 相關服務

| 服務 | 位置 | 說明 |
|------|------|------|
| WorkspaceContextFacade | `core/facades/account/` | 工作區上下文切換 |

---

**最後更新**: 2025-12-02

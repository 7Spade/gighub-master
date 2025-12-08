# 🏢 業務層功能

> Business Layer - 具體業務功能實現

---

## 📋 功能清單

| 功能 | 說明 | 狀態 | 文件 |
|------|------|------|------|
| 任務管理 | 任務 CRUD、樹狀結構 | 🔶 | [task-management.md](./task-management.md) |
| 日誌管理 | 施工日誌 | 🔶 | [diary-management.md](./diary-management.md) |
| 品質驗收 | 驗收清單 | 🔴 | [quality-acceptance.md](./quality-acceptance.md) |
| 檔案管理 | 檔案上傳/下載 | 🔴 | [file-management.md](./file-management.md) |

---

## 🔧 核心實體

| 實體 | 資料表 | 說明 |
|------|--------|------|
| 任務 | `tasks` | 任務主表 |
| 任務附件 | `task_attachments` | 任務附件 |
| 任務評論 | `task_comments` | 任務評論 |
| 日誌 | `diaries` | 施工日誌 |
| 日誌附件 | `diary_attachments` | 日誌附件 |

---

## 🔗 相關服務

| 服務 | 位置 | 說明 |
|------|------|------|
| TaskStore | `features/blueprint/data-access/stores/` | 任務狀態管理 |
| DiaryStore | `features/blueprint/data-access/stores/` | 日誌狀態管理 |
| TodoStore | `features/blueprint/data-access/stores/` | 待辦狀態管理 |

---

**最後更新**: 2025-12-02

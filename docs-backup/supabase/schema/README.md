# 🗄️ Schema 設計

> Supabase PostgreSQL 資料庫 Schema 文件

---

## 📁 Schema 分類

| 層級 | 文件 | 說明 |
|------|------|------|
| 基礎層 | [foundation-tables.md](./foundation-tables.md) | 帳戶、組織、團隊 |
| 容器層 | [container-tables.md](./container-tables.md) | 藍圖、權限 |
| 業務層 | [business-tables.md](./business-tables.md) | 任務、日誌、驗收 |

---

## 📋 命名規範

| 類型 | 規則 | 範例 |
|------|------|------|
| 表格名 | 單數、snake_case | `account`, `blueprint_member` |
| 欄位名 | 單數、snake_case | `created_at`, `organization_id` |
| 主鍵 | `id` | `id UUID PRIMARY KEY` |
| 外鍵 | `{table}_id` | `blueprint_id`, `account_id` |
| 時間戳 | `created_at`, `updated_at` | 標準時間欄位 |

---

## 🔧 標準欄位

每個表格都應包含：

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now()
```

---

**最後更新**: 2025-12-02

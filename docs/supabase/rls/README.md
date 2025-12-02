# 🔒 RLS 政策設計

> Row Level Security 政策文件

---

## 📁 RLS 分類

| 層級 | 文件 | 說明 |
|------|------|------|
| 基礎層 | [foundation-policies.md](./foundation-policies.md) | 帳戶、組織 RLS |
| 容器層 | [container-policies.md](./container-policies.md) | 藍圖 RLS |
| 業務層 | [business-policies.md](./business-policies.md) | 任務、日誌 RLS |

---

## 🎯 RLS 原則

### 1. 最小權限原則
只授予完成任務所需的最小權限。

### 2. 明確拒絕
預設拒絕所有存取，僅允許明確授權的操作。

### 3. 層級繼承
業務層資料存取依賴容器層（藍圖）權限。

---

## 📋 政策命名規範

```
{table}_{operation}_{role}
```

範例：
- `blueprint_select_member` - 成員可讀取藍圖
- `task_insert_editor` - 編輯者可建立任務
- `diary_update_owner` - 擁有者可更新日誌

---

## 🔧 常用 Helper 函數

```sql
-- 取得當前使用者 ID
auth.uid()

-- 取得當前使用者的 JWT claims
auth.jwt()

-- 檢查使用者是否為藍圖成員
is_blueprint_member(blueprint_id, auth.uid())

-- 檢查使用者在藍圖中的角色
get_blueprint_role(blueprint_id, auth.uid())
```

---

**最後更新**: 2025-12-02

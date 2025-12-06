# ⚡ 資料庫函數

> PostgreSQL 函數與觸發器文件

---

## 📁 函數分類

| 類型 | 說明 |
|------|------|
| Helper 函數 | RLS 輔助函數 |
| 觸發器函數 | 自動化邏輯 |
| RPC 函數 | 業務邏輯封裝 |

---

## 🔧 常用函數

### Helper 函數

```sql
-- 檢查藍圖成員資格
CREATE OR REPLACE FUNCTION is_blueprint_member(
  p_blueprint_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blueprint_member
    WHERE blueprint_id = p_blueprint_id
    AND account_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 觸發器函數

```sql
-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

**最後更新**: 2025-12-02

# 🔄 遷移指南

> Supabase 資料庫遷移文件

---

## 📚 文檔索引

| 文件 | 說明 |
|------|------|
| [STRUCTURED_MIGRATION_GUIDE.md](./STRUCTURED_MIGRATION_GUIDE.md) | **完整結構化遷移指南** - 詳細命名規範與設計原則 |
| [MIGRATION_STRUCTURE_TREE.md](./MIGRATION_STRUCTURE_TREE.md) | **遷移結構樹速查表** - 視覺化結構與編碼對照 |

---

## 📋 遷移流程

### 1. 建立遷移

```bash
npx supabase migration new <migration_name>
```

### 2. 編寫遷移 SQL

遵循 [結構化指南](./STRUCTURED_MIGRATION_GUIDE.md) 中的命名規範和檔案結構。

### 3. 測試遷移

```bash
# 本地測試
npx supabase db reset

# 檢查差異
npx supabase db diff
```

### 4. 部署遷移

```bash
# 推送到遠端
npx supabase db push
```

---

## 📁 遷移命名規範

### 結構化命名格式 (推薦)

```
{層級}{模組}{序號}_{描述}.sql
```

範例：
- `00002_create_enums.sql` - Core 層 ENUM 定義
- `01000_foundation_accounts.sql` - Foundation 層 accounts 表
- `02000_container_blueprints.sql` - Container 層 blueprints 表
- `03100_business_diaries.sql` - Business 層 diaries 表

### 時間戳命名格式 (傳統)

```
YYYYMMDDHHMMSS_<description>.sql
```

範例：
- `20251201120000_create_account_table.sql`
- `20251201130000_add_blueprint_rls.sql`

---

## 🏗️ 層級概覽

| 層級碼 | 層級名稱 | 內容 |
|--------|---------|------|
| 00xxx | Core Infrastructure | 擴展、Schema、Enum、通用函數 |
| 01xxx | Foundation Layer | 帳戶、組織、團隊 |
| 02xxx | Container Layer | 藍圖、權限、配置 |
| 03xxx | Business Modules | 任務、日誌、檢查清單、問題追蹤 |
| 04xxx | Extended Modules | 品管、驗收、財務 |
| 05xxx | Cross-Cutting | 審計日誌、搜尋 |
| 06xxx | Storage & Realtime | 儲存與即時配置 |
| 07xxx | Views | 視圖定義 |
| 08xxx | Documentation | 文件註解 |

詳見 [結構樹速查表](./MIGRATION_STRUCTURE_TREE.md)

---

## 🔧 遷移最佳實踐

1. **小步迭代**: 每個遷移只做一件事
2. **冪等性**: 遷移可重複執行不報錯
3. **可回滾**: 考慮如何回滾變更
4. **測試**: 在本地環境測試後再推送
5. **文件**: 複雜遷移加上註解
6. **依賴順序**: 遵循層級依賴原則

---

## 🔗 相關文件

- [Supabase 整合 README](../README.md)
- [RLS 政策設計](../rls/README.md)
- [Schema 設計規範](../schema/README.md)
- [操作指南 (supabase/)](../../../supabase/MIGRATION_GUIDE.md)

---

**最後更新**: 2025-12-03

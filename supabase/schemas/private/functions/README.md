# Private Schema Functions

此目錄存放 RLS 輔助函數 (SECURITY DEFINER)。

## 函數清單

| 函數名稱 | 說明 |
|---------|------|
| `get_user_account_id()` | 取得當前用戶的 account_id |
| `is_account_owner(UUID)` | 檢查用戶是否擁有該帳號 |
| `is_organization_member(UUID)` | 檢查用戶是否為組織成員 |
| `get_organization_role(UUID)` | 取得用戶在組織中的角色 |
| `is_organization_admin(UUID)` | 檢查用戶是否為組織 owner/admin |
| `is_team_member(UUID)` | 檢查用戶是否為團隊成員 |
| `is_team_leader(UUID)` | 檢查用戶是否為團隊 leader |
| `is_blueprint_owner(UUID)` | 檢查用戶是否為藍圖擁有者 |
| `has_blueprint_access(UUID)` | 檢查用戶是否有藍圖存取權限 |
| `can_write_blueprint(UUID)` | 檢查用戶是否有藍圖寫入權限 |
| `get_blueprint_business_role(UUID)` | 取得用戶在藍圖中的業務角色 |

## 使用說明

這些函數用於 RLS 政策中，避免直接查詢導致的遞迴問題。

所有函數都使用：
- `SECURITY DEFINER` 以定義者權限執行
- `SET search_path = ''` 避免安全風險
- `STABLE` 標記表示不修改資料庫

實際定義在: `migrations/20241201000400_create_private_functions.sql`

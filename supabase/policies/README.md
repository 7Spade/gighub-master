# RLS Policies Reference

此目錄存放 Row Level Security (RLS) 策略文檔。

## 策略設計原則

1. **最小權限原則** - 只授予必要的權限
2. **分層授權** - 依據組織 > 團隊 > 藍圖的層級結構
3. **SECURITY DEFINER 輔助** - 使用 private schema 函數避免遞迴

## 政策清單

### Core Tables
| 表格 | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| accounts | 自己 | 自己 | 自己 | - |
| organizations | 成員 | 認證 | owner/admin | owner |
| organization_members | 成員 | admin | admin | admin |
| teams | 組織成員 | admin | admin/leader | admin |
| team_members | 組織成員 | admin/leader | admin/leader | admin/leader |

### Blueprint Tables
| 表格 | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| blueprints | 存取權 | API函數 | owner | owner |
| blueprint_members | 存取權 | owner/maintainer | owner/maintainer | owner/maintainer |
| blueprint_roles | 存取權 | owner/maintainer | owner/maintainer | owner/maintainer |
| blueprint_team_roles | 存取權 | owner | owner | owner |

### Module Tables
| 表格 | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| tasks | 藍圖存取 | 藍圖寫入 | 藍圖寫入 | 藍圖寫入 |
| diaries | 藍圖存取 | 藍圖寫入 | 藍圖寫入 | 藍圖寫入 |
| issues | 藍圖存取 | 藍圖寫入 | 藍圖寫入 | 藍圖寫入 |
| todos | 自己 + 藍圖 | 自己 + 藍圖 | 自己 | 自己 |
| notifications | 自己 | 認證 | 自己 | 自己 |

## 輔助函數

所有輔助函數在 `private` schema 中定義：

- `get_user_account_id()` - 取得當前用戶帳號 ID
- `is_organization_member(UUID)` - 檢查組織成員資格
- `is_organization_admin(UUID)` - 檢查組織管理員權限
- `has_blueprint_access(UUID)` - 檢查藍圖存取權限
- `can_write_blueprint(UUID)` - 檢查藍圖寫入權限

實際政策定義在: `migrations/20241201000600_create_rls_policies.sql`

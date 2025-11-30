# Account Infrastructure Types

帳號管理基礎設施型別定義模組 | Account Infrastructure Types Module

## 📋 概述 | Overview

此模組定義帳號管理相關的基礎設施層型別（Infrastructure Types），包括資料庫模型、Repository 介面、Supabase 相關型別等。

This module defines infrastructure layer types for account management, including database models, repository interfaces, Supabase-related types, etc.

## 🎯 職責 | Responsibilities

- 定義資料庫層的資料模型型別
- 定義 Repository 介面的型別
- 定義 Supabase 查詢和操作的型別
- 提供型別安全的資料庫操作介面

## 📦 主要型別定義 | Main Type Definitions

### `AccountType`
帳號類型枚舉。

```typescript
enum AccountType {
  USER = 'user',
  BOT = 'bot',
  ORGANIZATION = 'organization'
}
```

### `AccountStatus`
帳號狀態枚舉。

```typescript
enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}
```

### `OrganizationMemberRole`
組織成員角色枚舉。

```typescript
enum OrganizationMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
}
```

### `AccountDatabaseModel`
帳號資料庫模型，對應 `accounts` 資料表。

**主要屬性：**
- `id: string` - 帳號 ID (UUID)
- `auth_user_id: string | null` - Supabase Auth 用戶 ID（User: 1:1關係；Organization/Bot: 記錄創建者）
- `type: AccountType` - 帳號類型（'User' | 'Bot' | 'Organization'）
- `name: string` - 名稱
- `email: string | null` - 電子郵件
- `avatar: string | null` - 頭像 URL
- `status: AccountStatus` - 帳號狀態（'active' | 'inactive' | 'suspended' | 'deleted'，使用軟刪除）
- `created_at: string` - 創建時間 (ISO 8601)
- `updated_at: string` - 更新時間 (ISO 8601)

### `OrganizationDatabaseModel`
組織資料庫模型，繼承自 `AccountDatabaseModel`。

### `TeamDatabaseModel`
團隊資料庫模型，對應 `teams` 資料表。

### `OrganizationMemberDatabaseModel`
組織成員資料庫模型，對應 `organization_members` 資料表。

## 🔗 依賴關係 | Dependencies

- **Supabase Client**: `@supabase/supabase-js` 型別定義
- **Database Schema**: Supabase 資料庫 schema 定義

## 📝 使用範例 | Usage Example

```typescript
import { 
  AccountType, 
  AccountStatus,
  AccountDatabaseModel 
} from '@core/infra/types/account';

// 使用枚舉
const accountType: AccountType = AccountType.ORGANIZATION;
const status: AccountStatus = AccountStatus.ACTIVE;

// 使用資料庫模型
const account: AccountDatabaseModel = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  auth_user_id: 'auth-user-123',
  type: AccountType.USER,
  name: 'John Doe',
  email: 'john@example.com',
  avatar: null,
  status: AccountStatus.ACTIVE,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
};
```

## 🏗️ 架構層級 | Architecture Layer

此模組位於 **Core Infrastructure Types 層**，屬於基礎設施層，負責：
- 定義資料庫層的型別
- 提供型別安全的資料庫操作
- 與 Supabase 資料庫 schema 對應
- 為 Repository 層提供型別定義

## 🔄 型別轉換 | Type Transformation

基礎設施型別與業務模型之間的轉換：

```
Database Model (Infra Types)
  ↓ Repository 轉換
Business Model (Shared Models)
  ↓ Service 使用
Component/Service Usage
```

## 📚 相關文檔 | Related Documentation

- [帳號 Repository 文檔](../repositories/account/README.md)
- [帳號模型文檔](../../../shared/models/account/README.md)
- [SQL Schema 定義](../../../../docs/reference/sql-schema-definition.md)
- [資料模型對照表](../../../../docs/reference/data-model-mapping.md)
- [Supabase 架構文檔](../../../../docs/supabase/architecture/database.md)

## 🔄 更新日誌 | Changelog

**v1.0.0** (2025-01-XX)
- 初始版本
- 實現 Account、Organization、Team 等核心型別定義

---

**最後更新 | Last Updated**: 2025-01-XX  
**維護者 | Maintained by**: Development Team


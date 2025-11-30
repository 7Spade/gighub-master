# Account Repositories

帳號管理倉儲層模組 | Account Repository Layer Module

## 📋 概述 | Overview

此模組提供帳號管理相關的資料存取層（Repository Layer），封裝對 Supabase 資料庫的操作，提供型別安全的資料存取介面。

This module provides the data access layer (Repository Layer) for account management, encapsulating operations on Supabase database and providing type-safe data access interfaces.

## 🎯 職責 | Responsibilities

- 封裝資料庫 CRUD 操作
- 提供型別安全的查詢介面
- 處理資料庫模型與業務模型的轉換
- 實現 RLS（Row Level Security）策略的查詢
- 管理資料庫連線和錯誤處理

## 📦 主要 Repository | Main Repositories

### `AccountRepository`
帳號基礎 Repository，提供帳號的通用 CRUD 操作。

**主要方法：**
- `findById(id: string)` - 根據 ID 查詢帳號
- `findByAuthUserId(authUserId: string)` - 根據 Auth User ID 查詢帳號
- `create(data)` - 創建帳號
- `update(id, data)` - 更新帳號
- `softDelete(id)` - 軟刪除帳號
- `restore(id)` - 恢復已刪除的帳號

### `OrganizationRepository`
組織 Repository，繼承自 `AccountRepository`，提供組織特定的查詢方法。

**主要方法：**
- `findById(id)` - 根據 ID 查詢組織
- `findByIds(ids)` - 批量查詢組織
- `create(data)` - 創建組織
- `update(id, data)` - 更新組織

### `OrganizationMemberRepository`
組織成員 Repository，管理組織成員關係。

**主要方法：**
- `findByOrganization(organizationId)` - 查詢組織的所有成員
- `findByAccount(accountId)` - 查詢帳號加入的所有組織
- `create(data)` - 添加組織成員
- `update(id, data)` - 更新成員角色
- `delete(id)` - 移除組織成員

### `TeamRepository`
團隊 Repository，提供團隊的 CRUD 操作。

### `TeamMemberRepository`
團隊成員 Repository，管理團隊成員關係。

## 🔗 依賴關係 | Dependencies

- **Types 層**: `@core/infra/types/account` - 資料庫模型型別
- **Supabase Service**: `@core/infra/supabase` - Supabase 客戶端
- **Database**: Supabase PostgreSQL 資料庫

## 📝 使用範例 | Usage Example

```typescript
import { inject } from '@angular/core';
import { OrganizationRepository } from '@core/infra/repositories/account';
import { firstValueFrom } from 'rxjs';

// 在服務中注入
const orgRepo = inject(OrganizationRepository);

// 查詢組織
const org$ = orgRepo.findById('org-id');
const org = await firstValueFrom(org$);

// 創建組織
const newOrg$ = orgRepo.create({
  name: '新組織',
  email: 'org@example.com',
  type: AccountType.ORGANIZATION,
  status: AccountStatus.ACTIVE
});
const newOrg = await firstValueFrom(newOrg$);

// 更新組織
const updatedOrg$ = orgRepo.update('org-id', {
  name: '更新後的組織名稱'
});
const updatedOrg = await firstValueFrom(updatedOrg$);
```

## 🏗️ 架構層級 | Architecture Layer

此模組位於 **Core Infrastructure Repository 層**，屬於資料存取層，負責：
- 封裝資料庫操作
- 提供型別安全的查詢介面
- 處理資料庫模型與業務模型的轉換
- 實現資料庫查詢優化

## 🔐 RLS 策略 | RLS Policies

Repository 層的查詢會自動遵循 Supabase RLS（Row Level Security）策略：

- 用戶只能查詢自己有權限的資料
- 組織成員只能查詢所屬組織的資料
- 軟刪除的資料不會被查詢到（除非明確指定）

## 🔄 資料轉換 | Data Transformation

Repository 層負責將資料庫模型轉換為業務模型：

```
Database Model (Infra Types)
  ↓ Repository 轉換
Business Model (Shared Models)
  ↓ Service 使用
Component/Service Usage
```

## 📚 相關文檔 | Related Documentation

- [帳號服務文檔](../../../shared/services/account/README.md)
- [帳號模型文檔](../../../shared/models/account/README.md)
- [帳號類型定義](../types/account/README.md)
- [Supabase RLS 策略](../../../../docs/supabase/security/rls.md)
- [資料庫架構設計](../../../../docs/supabase/architecture/database.md)

## 🔄 更新日誌 | Changelog

**v1.0.0** (2025-01-XX)
- 初始版本
- 實現 Account、Organization、Team 等核心 Repository

---

**最後更新 | Last Updated**: 2025-01-XX  
**維護者 | Maintained by**: Development Team


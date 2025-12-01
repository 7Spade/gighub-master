# Account Services

帳號管理相關服務模組 | Account Management Services Module

## 📋 概述 | Overview

此模組提供帳號管理相關的業務邏輯服務，包括用戶、組織、團隊等帳號實體的管理功能。

This module provides business logic services for account management, including user, organization, team, and other account entity management functions.

## 🎯 職責 | Responsibilities

- 提供帳號相關業務邏輯的封裝
- 管理帳號狀態（使用 Angular Signals）
- 協調 Repository 層進行資料操作
- 處理業務規則和驗證邏輯

## 📦 主要服務 | Main Services

### `OrganizationService`
組織管理服務，提供組織的 CRUD 操作和成員管理。

**主要方法：**
- `findById(id: string)` - 根據 ID 查詢組織
- `getUserCreatedOrganizations(authUserId: string)` - 查詢用戶創建的組織
- `getUserJoinedOrganizations(accountId: string)` - 查詢用戶加入的組織
- `createOrganization(request)` - 創建組織
- `updateOrganization(id, request)` - 更新組織
- `softDeleteOrganization(id)` - 軟刪除組織
- `restoreOrganization(id)` - 恢復已刪除的組織

### `UserService`
用戶管理服務，提供用戶相關的業務邏輯。

### `TeamService`
團隊管理服務，提供團隊的 CRUD 操作和成員管理。

### `WorkspaceContextService`
工作區上下文服務，管理當前工作區的上下文切換。

### `WorkspaceDataService`
工作區資料服務，提供工作區資料的載入和管理。

## 🔗 依賴關係 | Dependencies

- **Repository 層**: `@core/infra/repositories/account`
- **Models 層**: `@shared/models/account`
- **Types 層**: `@core/infra/types/account`
- **Supabase Service**: `@core/infra/supabase`

## 📝 使用範例 | Usage Example

```typescript
import { inject } from '@angular/core';
import { OrganizationService } from '@shared/services/account';

// 在組件或服務中注入
const orgService = inject(OrganizationService);

// 查詢組織
const org = await orgService.findById('org-id');

// 創建組織
const newOrg = await orgService.createOrganization({
  name: '新組織',
  email: 'org@example.com'
});

// 監聽狀態變化
orgService.organizations(); // Signal<OrganizationBusinessModel[]>
orgService.loading(); // Signal<boolean>
orgService.error(); // Signal<string | null>
```

## 🏗️ 架構層級 | Architecture Layer

此模組位於 **Shared Services 層**，屬於業務邏輯層，負責：
- 封裝業務邏輯
- 管理應用狀態（使用 Signals）
- 協調 Repository 層進行資料操作
- 提供可重用的業務服務

## 📚 相關文檔 | Related Documentation

- [帳號模型文檔](../models/account/README.md)
- [帳號 Repository 文檔](../../core/infra/repositories/account/README.md)
- [帳號類型定義](../../core/infra/types/account/README.md)
- [系統架構文檔](../../../../docs/architecture/05-account-layer-flowchart.mermaid.md)

## 🔄 更新日誌 | Changelog

**v1.0.0** (2025-01-XX)
- 初始版本
- 實現 OrganizationService、UserService、TeamService 等核心服務

---

**最後更新 | Last Updated**: 2025-01-XX  
**維護者 | Maintained by**: Development Team


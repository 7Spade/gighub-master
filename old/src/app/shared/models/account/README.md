# Account Models

帳號管理相關資料模型模組 | Account Management Data Models Module

## 📋 概述 | Overview

此模組定義帳號管理相關的業務資料模型（Business Models），包括用戶、組織、團隊、機器人等實體的型別定義和介面。

This module defines business data models for account management, including type definitions and interfaces for users, organizations, teams, bots, and other entities.

## 🎯 職責 | Responsibilities

- 定義帳號相關業務模型的型別
- 提供資料傳輸物件（DTO）的介面定義
- 定義請求/回應的資料結構
- 提供模型驗證和轉換工具

## 📦 主要模型 | Main Models

### `UserBusinessModel`
用戶業務模型，定義用戶的業務層資料結構。

**主要屬性：**
- `id: string` - 用戶 ID
- `name: string` - 用戶名稱
- `email: string` - 電子郵件
- `avatar: string | null` - 頭像 URL
- `status: AccountStatus` - 帳號狀態
- `type: AccountType.USER` - 帳號類型

### `OrganizationBusinessModel`
組織業務模型，定義組織的業務層資料結構。

**主要屬性：**
- `id: string` - 組織 ID
- `name: string` - 組織名稱
- `email: string | null` - 組織電子郵件
- `avatar: string | null` - 組織頭像
- `status: AccountStatus` - 帳號狀態
- `type: AccountType.ORGANIZATION` - 帳號類型

### `TeamBusinessModel`
團隊業務模型，定義團隊的業務層資料結構。

### `BotBusinessModel`
機器人業務模型，定義機器人的業務層資料結構。

## 📝 請求/回應模型 | Request/Response Models

### `CreateOrganizationRequest`
創建組織請求模型。

```typescript
interface CreateOrganizationRequest {
  name: string;
  email?: string;
  avatar?: string;
  status?: AccountStatus;
}
```

### `UpdateOrganizationRequest`
更新組織請求模型。

```typescript
interface UpdateOrganizationRequest {
  name?: string;
  email?: string;
  avatar?: string;
  status?: AccountStatus;
}
```

## 🔗 依賴關係 | Dependencies

- **Types 層**: `@core/infra/types/account` - 基礎型別定義
- **Enums**: `AccountType`, `AccountStatus`, `OrganizationMemberRole` 等

## 📝 使用範例 | Usage Example

```typescript
import { 
  OrganizationBusinessModel, 
  CreateOrganizationRequest 
} from '@shared/models/account';

// 創建組織請求
const request: CreateOrganizationRequest = {
  name: '新組織',
  email: 'org@example.com',
  avatar: 'https://example.com/avatar.png'
};

// 使用業務模型
const org: OrganizationBusinessModel = {
  id: 'org-123',
  name: '新組織',
  email: 'org@example.com',
  avatar: 'https://example.com/avatar.png',
  status: AccountStatus.ACTIVE,
  type: AccountType.ORGANIZATION,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

## 🏗️ 架構層級 | Architecture Layer

此模組位於 **Shared Models 層**，屬於業務模型層，負責：
- 定義業務層的資料結構
- 提供型別安全的資料模型
- 與 Repository 層的資料模型分離（業務模型 vs 資料庫模型）

## 🔄 模型轉換 | Model Transformation

業務模型與資料庫模型之間的轉換通常在 Repository 層或 Service 層進行：

```
Database Model (Infra Types) 
  → Business Model (Shared Models)
  → Component/Service Usage
```

## 📚 相關文檔 | Related Documentation

- [帳號服務文檔](../services/account/README.md)
- [帳號 Repository 文檔](../../core/infra/repositories/account/README.md)
- [帳號類型定義](../../core/infra/types/account/README.md)
- [資料模型對照表](../../../../docs/reference/data-model-mapping.md)

## 🔄 更新日誌 | Changelog

**v1.0.0** (2025-01-XX)
- 初始版本
- 實現 User、Organization、Team、Bot 等核心業務模型

---

**最後更新 | Last Updated**: 2025-01-XX  
**維護者 | Maintained by**: Development Team


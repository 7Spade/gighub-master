# GigHub 日誌記錄指南
# GigHub Logging Guide

> **版本：** 1.0  
> **最後更新：** 2024-12-08  
> **狀態：** Active

## 目錄 (Table of Contents)

1. [概述 (Overview)](#概述-overview)
2. [日誌層級 (Logging Levels)](#日誌層級-logging-levels)
3. [應用日誌 (Application Logging)](#應用日誌-application-logging)
4. [審計日誌 (Audit Logging)](#審計日誌-audit-logging)
5. [最佳實踐 (Best Practices)](#最佳實踐-best-practices)
6. [程式碼範例 (Code Examples)](#程式碼範例-code-examples)
7. [Code Review Checklist](#code-review-checklist)
8. [常見錯誤 (Common Mistakes)](#常見錯誤-common-mistakes)

---

## 概述 (Overview)

GigHub 使用雙層日誌系統：
- **LoggerService**: 應用層日誌，用於除錯、錯誤追蹤和系統監控
- **AuditLogService**: 審計日誌，用於記錄業務操作、合規追蹤和安全審計

### 何時使用哪種日誌？

| 場景 | 使用 LoggerService | 使用 AuditLogService |
|------|-------------------|---------------------|
| 應用程式流程追蹤 | ✅ | ❌ |
| 錯誤和異常 | ✅ | ❌ |
| 性能監控點 | ✅ | ❌ |
| 除錯資訊 | ✅ | ❌ |
| 用戶操作記錄 | ❌ | ✅ |
| 資料變更追蹤 | ❌ | ✅ |
| 安全事件 | ✅ | ✅ (兩者都要) |
| 權限變更 | ❌ | ✅ |
| 合規審計 | ❌ | ✅ |

---

## 日誌層級 (Logging Levels)

### LoggerService 日誌級別

```typescript
enum LogLevel {
  DEBUG = 0,   // 開發除錯，不進入生產
  INFO = 1,    // 一般資訊，重要業務流程
  WARN = 2,    // 警告訊息，可能的問題
  ERROR = 3,   // 錯誤訊息，需要關注
  NONE = 4     // 禁用日誌
}
```

#### DEBUG (開發環境專用)
```typescript
// 詳細的除錯資訊
this.logger.debug('Processing blueprint data', {
  blueprintId,
  moduleCount: data.modules.length,
  validationPassed: true
});
```

**使用時機：**
- 詳細的資料結構追蹤
- 函數進入/退出點
- 變數狀態檢查
- 流程控制追蹤

**注意：** DEBUG 級別不應進入生產環境

#### INFO (重要業務事件)
```typescript
// 記錄重要的業務流程
this.logger.info('User logged in successfully', {
  userId: user.id,
  sessionId: session.id
});
```

**使用時機：**
- 重要業務操作完成
- 系統狀態變更
- 外部服務調用
- 批次處理開始/結束

#### WARN (潛在問題)
```typescript
// 記錄警告，系統可以繼續運行
this.logger.warn('Cache miss for user preferences', {
  userId,
  fallbackUsed: true
});
```

**使用時機：**
- 可恢復的錯誤
- 使用降級方案
- 配置缺失但有預設值
- 性能問題警告

#### ERROR (需要關注的錯誤)
```typescript
// 記錄錯誤，需要立即關注
this.logger.error('Failed to save organization', error);
```

**使用時機：**
- 操作失敗
- 未捕獲的異常
- 外部服務失敗
- 資料完整性問題

### AuditLogService 嚴重程度

```typescript
type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
```

| 級別 | 使用時機 | 範例 |
|------|---------|------|
| `info` | 一般操作 | 查看資料、建立任務、新增評論 |
| `warning` | 敏感操作 | 匯出資料、分享權限、批次刪除 |
| `error` | 操作失敗 | 刪除失敗、權限不足 |
| `critical` | 安全事件 | 權限變更、帳戶刪除、資料洩漏嘗試 |

---

## 應用日誌 (Application Logging)

### 基本使用

```typescript
import { inject } from '@angular/core';
import { LoggerService } from '@core/logger';

export class MyService {
  private readonly logger = inject(LoggerService);

  myMethod() {
    try {
      // 記錄開始
      this.logger.info('Starting data processing', { recordCount: 100 });
      
      // 業務邏輯
      const result = this.processData();
      
      // 記錄成功
      this.logger.info('Data processing completed', {
        processed: result.length,
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      // 記錄錯誤
      this.logger.error('Data processing failed', error);
      throw error;
    }
  }
}
```

### 結構化日誌

**✅ 好的做法：**
```typescript
// 使用結構化資料
this.logger.info('Order created', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  items: order.items.length
});
```

**❌ 不好的做法：**
```typescript
// 使用字串拼接
this.logger.info(`Order ${order.id} created by user ${user.id} with total ${order.total}`);
```

### 錯誤處理模式

```typescript
// 完整的錯誤處理和日誌記錄
async createOrganization(request: CreateOrganizationRequest): Promise<Organization> {
  try {
    this.logger.info('Creating organization', { name: request.name });
    
    const org = await firstValueFrom(
      this.organizationRepo.create(request)
    );
    
    if (!org) {
      throw new Error('Failed to create organization');
    }
    
    this.logger.info('Organization created successfully', {
      organizationId: org.id
    });
    
    return org;
  } catch (error) {
    this.logger.error('Failed to create organization', error);
    throw error;
  }
}
```

---

## 審計日誌 (Audit Logging)

### 基本使用

```typescript
import { inject } from '@angular/core';
import { AuditLogService } from '@shared/services/audit-log';

export class OrganizationService {
  private readonly auditLog = inject(AuditLogService);

  async createOrganization(request: CreateOrganizationRequest) {
    const org = await this.repo.create(request);
    
    // 記錄審計日誌
    this.auditLog.quickLog(
      'organization',
      org.id,
      'create',
      {
        entityName: org.name,
        organizationId: org.id,
        newValue: org,
        severity: 'info',
        metadata: {
          source: 'ui',
          created_by: this.currentUserId
        }
      }
    ).subscribe();
    
    return org;
  }
}
```

### 變更追蹤 (Change Tracking)

對於 UPDATE 操作，使用 `logChanges` 方法自動追蹤變更：

```typescript
async updateOrganization(
  id: string,
  request: UpdateOrganizationRequest
): Promise<Organization> {
  // 1. 取得舊值
  const oldOrg = await this.findById(id);
  
  // 2. 執行更新
  const newOrg = await firstValueFrom(
    this.organizationRepo.update(id, request)
  );
  
  // 3. 記錄變更（自動計算差異）
  this.auditLog.logChanges(
    'organization',
    id,
    'update',
    oldOrg,
    newOrg,
    {
      entityName: newOrg.name,
      organizationId: id,
      metadata: {
        source: 'ui',
        changed_fields: Object.keys(request)
      }
    }
  ).subscribe();
  
  return newOrg;
}
```

### 刪除操作

```typescript
async softDeleteOrganization(id: string): Promise<void> {
  const org = await this.findById(id);
  
  await firstValueFrom(
    this.organizationRepo.update(id, { status: 'deleted' })
  );
  
  // 記錄刪除（嚴重程度為 warning）
  this.auditLog.quickLog(
    'organization',
    id,
    'delete',
    {
      entityName: org.name,
      organizationId: id,
      oldValue: org,
      severity: 'warning',
      metadata: {
        source: 'ui',
        deletion_type: 'soft_delete'
      }
    }
  ).subscribe();
}
```

### 權限變更（Critical）

```typescript
async changeUserRole(
  userId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  await this.updateUserRole(userId, newRole);
  
  // 權限變更是 critical 級別
  this.auditLog.quickLog(
    'account',
    userId,
    'role_change',
    {
      entityName: user.name,
      oldValue: { role: oldRole },
      newValue: { role: newRole },
      severity: 'critical',
      metadata: {
        source: 'admin_panel',
        changed_by: this.currentAdminId
      }
    }
  ).subscribe();
}
```

### 批次操作

對於批次操作，使用 `logBatch`：

```typescript
async deleteTasks(taskIds: string[]): Promise<void> {
  const tasks = await this.getTasksByIds(taskIds);
  
  await this.taskRepo.deleteMany(taskIds);
  
  // 批次記錄
  const auditLogs = tasks.map(task => ({
    entity_type: 'task' as const,
    entity_id: task.id,
    entity_name: task.title,
    action: 'delete' as const,
    actor_id: this.currentUserId,
    severity: 'warning' as const,
    old_value: task,
    metadata: {
      source: 'ui',
      batch_operation: true,
      batch_size: taskIds.length
    }
  }));
  
  this.auditLog.logBatch(auditLogs).subscribe();
}
```

---

## 最佳實踐 (Best Practices)

### 1. 永遠不要直接使用 console.log

**❌ 錯誤：**
```typescript
console.log('User logged in:', userId);
console.error('Error:', error);
```

**✅ 正確：**
```typescript
this.logger.info('User logged in', { userId });
this.logger.error('Operation failed', error);
```

**原因：**
- 無法在生產環境控制日誌級別
- 無法整合到日誌聚合系統
- 除錯訊息可能洩漏敏感資訊

### 2. 提供足夠的上下文

**❌ 錯誤：**
```typescript
this.logger.info('Operation completed');
```

**✅ 正確：**
```typescript
this.logger.info('Organization update completed', {
  organizationId: org.id,
  fieldsChanged: ['name', 'email'],
  duration: Date.now() - startTime
});
```

### 3. 脫敏敏感資料

**❌ 錯誤：**
```typescript
this.logger.info('User created', {
  password: user.password,  // 不要記錄密碼！
  creditCard: user.creditCard
});
```

**✅ 正確：**
```typescript
this.logger.info('User created', {
  userId: user.id,
  email: user.email,
  // 敏感資料不記錄或脫敏
  creditCardLast4: user.creditCard.slice(-4)
});
```

**敏感資料清單：**
- 密碼和令牌
- API 金鑰
- 信用卡號
- 身份證號
- 完整的電話號碼和地址

### 4. 非同步日誌不阻塞主流程

審計日誌應該使用 `.subscribe()` 而不是 `await`：

**✅ 正確：**
```typescript
async createTask(request: CreateTaskRequest): Promise<Task> {
  const task = await this.taskRepo.create(request);
  
  // 不等待日誌完成
  this.auditLog.quickLog('task', task.id, 'create', {...}).subscribe();
  
  return task;  // 立即返回
}
```

**⚠️ 除非必要：**
```typescript
// 只有在必須確保日誌寫入成功的情況下才使用 await
const task = await this.taskRepo.create(request);
await firstValueFrom(
  this.auditLog.quickLog('task', task.id, 'create', {...})
);
```

### 5. 關鍵操作記錄開始和結束

```typescript
async processBulkImport(data: ImportData[]): Promise<void> {
  // 記錄開始
  this.logger.info('Bulk import started', {
    recordCount: data.length,
    source: 'csv_upload'
  });
  
  try {
    const results = await this.importData(data);
    
    // 記錄成功
    this.logger.info('Bulk import completed', {
      success: results.success,
      failed: results.failed,
      duration: Date.now() - startTime
    });
  } catch (error) {
    // 記錄失敗
    this.logger.error('Bulk import failed', error);
    throw error;
  }
}
```

### 6. 使用適當的日誌級別

```typescript
// ✅ INFO: 重要業務事件
this.logger.info('Payment processed', { orderId, amount });

// ✅ WARN: 可恢復的問題
this.logger.warn('Using cached data due to API timeout', { userId });

// ✅ ERROR: 需要關注的錯誤
this.logger.error('Database connection failed', error);

// ❌ 錯誤：所有事情都用 ERROR
this.logger.error('User clicked button');  // 應該用 INFO 或根本不記錄
```

### 7. 錯誤處理完整性

```typescript
async executeOperation(): Promise<Result> {
  try {
    const result = await this.performOperation();
    return result;
  } catch (error) {
    // 1. 記錄錯誤
    this.logger.error('Operation failed', error);
    
    // 2. 記錄審計（如果是業務操作）
    this.auditLog.quickLog(
      'operation',
      operationId,
      'execute',
      {
        severity: 'error',
        metadata: {
          error_message: error.message,
          failed: true
        }
      }
    ).subscribe();
    
    // 3. 向上拋出錯誤（讓調用者處理）
    throw error;
  }
}
```

---

## 程式碼範例 (Code Examples)

### 完整範例：OrganizationService

```typescript
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { LoggerService } from '@core/logger';
import { AuditLogService } from '@shared/services/audit-log';
import { OrganizationRepository } from '@core/infra/repositories/organization';
import {
  Organization,
  CreateOrganizationRequest,
  UpdateOrganizationRequest
} from '@core/infra/types/organization';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly logger = inject(LoggerService);
  private readonly auditLog = inject(AuditLogService);
  private readonly organizationRepo = inject(OrganizationRepository);

  /**
   * 建立組織
   */
  async createOrganization(
    request: CreateOrganizationRequest
  ): Promise<Organization> {
    try {
      this.logger.info('Creating organization', { name: request.name });
      
      const org = await firstValueFrom(
        this.organizationRepo.create(request)
      );
      
      if (!org) {
        throw new Error('Failed to create organization');
      }
      
      // 審計日誌
      this.auditLog.quickLog(
        'organization',
        org.id,
        'create',
        {
          entityName: org.name,
          organizationId: org.id,
          newValue: org,
          severity: 'info',
          metadata: {
            source: 'ui',
            module: 'account',
            feature: 'organization-management'
          }
        }
      ).subscribe();
      
      this.logger.info('Organization created successfully', {
        organizationId: org.id
      });
      
      return org;
    } catch (error) {
      this.logger.error('Failed to create organization', error);
      
      this.auditLog.quickLog(
        'organization',
        'N/A',
        'create',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true
          }
        }
      ).subscribe();
      
      throw error;
    }
  }

  /**
   * 更新組織
   */
  async updateOrganization(
    id: string,
    request: UpdateOrganizationRequest
  ): Promise<Organization> {
    try {
      this.logger.info('Updating organization', {
        organizationId: id,
        changes: Object.keys(request)
      });
      
      // 取得舊值
      const oldOrg = await this.findById(id);
      if (!oldOrg) {
        throw new Error('Organization not found');
      }
      
      // 執行更新
      const newOrg = await firstValueFrom(
        this.organizationRepo.update(id, request)
      );
      
      // 記錄變更（自動計算差異）
      this.auditLog.logChanges(
        'organization',
        id,
        'update',
        oldOrg,
        newOrg,
        {
          entityName: newOrg.name,
          organizationId: id,
          metadata: {
            source: 'ui',
            module: 'account',
            feature: 'organization-management'
          }
        }
      ).subscribe();
      
      this.logger.info('Organization updated successfully', {
        organizationId: id
      });
      
      return newOrg;
    } catch (error) {
      this.logger.error('Failed to update organization', error);
      
      this.auditLog.quickLog(
        'organization',
        id,
        'update',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true
          }
        }
      ).subscribe();
      
      throw error;
    }
  }

  /**
   * 軟刪除組織
   */
  async softDeleteOrganization(id: string): Promise<void> {
    try {
      this.logger.info('Deleting organization', { organizationId: id });
      
      const org = await this.findById(id);
      if (!org) {
        throw new Error('Organization not found');
      }
      
      await firstValueFrom(
        this.organizationRepo.update(id, { status: 'deleted' })
      );
      
      // 刪除是敏感操作，使用 warning 級別
      this.auditLog.quickLog(
        'organization',
        id,
        'delete',
        {
          entityName: org.name,
          organizationId: id,
          oldValue: org,
          severity: 'warning',
          metadata: {
            source: 'ui',
            module: 'account',
            feature: 'organization-management',
            deletion_type: 'soft_delete'
          }
        }
      ).subscribe();
      
      this.logger.info('Organization deleted successfully', {
        organizationId: id
      });
    } catch (error) {
      this.logger.error('Failed to delete organization', error);
      
      this.auditLog.quickLog(
        'organization',
        id,
        'delete',
        {
          severity: 'error',
          metadata: {
            error_message: (error as Error).message,
            failed: true
          }
        }
      ).subscribe();
      
      throw error;
    }
  }

  /**
   * 根據 ID 查找組織
   */
  private async findById(id: string): Promise<Organization | null> {
    return firstValueFrom(
      this.organizationRepo.findById(id)
    );
  }
}
```

---

## Code Review Checklist

在 Code Review 時，使用此檢查清單確保日誌實施正確：

### 基本檢查
- [ ] 是否使用 `LoggerService` 而非 `console.log`？
- [ ] 是否為關鍵操作加入審計日誌？
- [ ] 日誌級別是否適當（debug/info/warn/error）？
- [ ] 敏感資料是否已脫敏？

### 審計日誌檢查（CRUD 操作）
- [ ] **CREATE**: 是否記錄新實體建立？
  - [ ] 包含實體類型和 ID
  - [ ] 包含 `newValue`
  - [ ] 適當的嚴重程度（通常是 `info`）

- [ ] **UPDATE**: 是否使用 `logChanges` 記錄變更？
  - [ ] 包含 `oldValue` 和 `newValue`
  - [ ] 自動計算變更差異

- [ ] **DELETE**: 是否記錄刪除操作？
  - [ ] 包含 `oldValue`（刪除前的狀態）
  - [ ] 適當的嚴重程度（通常是 `warning` 或 `info`）

### 特殊操作檢查
- [ ] **權限變更**: 嚴重程度是否設為 `warning` 或 `critical`？
- [ ] **登入/登出**: 是否記錄？
- [ ] **失敗操作**: 是否記錄錯誤和原因？
- [ ] **批次操作**: 是否使用 `logBatch`？

### 效能檢查
- [ ] 日誌記錄是否使用非同步方式（`.subscribe()` 但不等待）？
- [ ] 是否避免在循環中記錄大量日誌？
- [ ] 是否適當使用批次記錄？

### 安全檢查
- [ ] 是否清理了密碼、令牌等敏感資料？
- [ ] 是否避免記錄完整的錯誤堆疊（可能包含敏感路徑）？
- [ ] 是否適當設定 `actor_type`（user/system/bot）？

### 可維護性檢查
- [ ] 日誌訊息是否清晰易懂？
- [ ] 是否包含足夠的上下文資訊？
- [ ] 是否使用結構化的 metadata？
- [ ] 錯誤訊息是否有助於除錯？

---

## 常見錯誤 (Common Mistakes)

### 錯誤 1: 使用 console.log

**❌ 錯誤：**
```typescript
console.log('User logged in:', userId);
console.error('Error occurred:', error);
```

**✅ 正確：**
```typescript
this.logger.info('User logged in', { userId });
this.logger.error('Error occurred', error);
```

### 錯誤 2: 缺少上下文

**❌ 錯誤：**
```typescript
this.logger.info('Organization updated');
```

**✅ 正確：**
```typescript
this.logger.info('Organization updated', {
  organizationId: org.id,
  changedFields: ['name', 'email']
});
```

### 錯誤 3: 沒有審計日誌

**❌ 錯誤：**
```typescript
async updateOrganization(id: string, request: UpdateRequest) {
  return await this.repo.update(id, request);
  // 沒有審計日誌！
}
```

**✅ 正確：**
```typescript
async updateOrganization(id: string, request: UpdateRequest) {
  const old = await this.findById(id);
  const updated = await this.repo.update(id, request);
  
  this.auditLog.logChanges(
    'organization',
    id,
    'update',
    old,
    updated,
    { entityName: updated.name }
  ).subscribe();
  
  return updated;
}
```

### 錯誤 4: 記錄敏感資料

**❌ 錯誤：**
```typescript
this.logger.info('User authentication', {
  email: user.email,
  password: user.password,  // 不要記錄密碼！
  token: authToken          // 不要記錄令牌！
});
```

**✅ 正確：**
```typescript
this.logger.info('User authentication', {
  userId: user.id,
  email: user.email,
  // 敏感資料不記錄
});
```

### 錯誤 5: 錯誤的日誌級別

**❌ 錯誤：**
```typescript
// 所有事情都用 ERROR
this.logger.error('User clicked button');
this.logger.error('Loading data...');
```

**✅ 正確：**
```typescript
// 使用適當的級別
this.logger.debug('User clicked button');
this.logger.info('Loading data started');
this.logger.error('Failed to load data', error);
```

### 錯誤 6: 阻塞主流程

**❌ 錯誤：**
```typescript
// 等待審計日誌完成，阻塞主流程
await firstValueFrom(
  this.auditLog.quickLog('task', taskId, 'create', {...})
);
return task;
```

**✅ 正確：**
```typescript
// 非同步記錄，不阻塞
this.auditLog.quickLog('task', taskId, 'create', {...}).subscribe();
return task;  // 立即返回
```

### 錯誤 7: 沒有錯誤處理

**❌ 錯誤：**
```typescript
async createTask(request: CreateTaskRequest) {
  const task = await this.repo.create(request);
  return task;
  // 沒有錯誤處理！
}
```

**✅ 正確：**
```typescript
async createTask(request: CreateTaskRequest) {
  try {
    const task = await this.repo.create(request);
    this.logger.info('Task created', { taskId: task.id });
    return task;
  } catch (error) {
    this.logger.error('Failed to create task', error);
    throw error;
  }
}
```

---

## 參考資源

- [GigHub 日誌架構文件](../../GigHub_Logging_Architecture.md)
- [LoggerService API 文件](../../src/app/core/logger/README.md)
- [AuditLogService API 文件](../../src/app/shared/services/audit-log/README.md)
- [Supabase RLS 策略](../../supabase/migrations/README.md)

---

## 更新歷史

| 版本 | 日期 | 變更內容 |
|------|------|---------|
| 1.0 | 2024-12-08 | 初始版本 - 基於架構文件建立完整指南 |

---

**問題或建議？** 請在專案中建立 Issue 或聯繫開發團隊。

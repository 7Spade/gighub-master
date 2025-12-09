# 一致性問題實作指南
# Consistency Issues Implementation Guide

> **詳細的逐步修復指南**  
> Step-by-step guide for fixing consistency issues

---

## 目錄 (Table of Contents)

1. [路由與模組命名一致性](#1-路由與模組命名一致性)
2. [元件命名一致性](#2-元件命名一致性)
3. [Service 檔案組織一致性](#3-service-檔案組織一致性)
4. [錯誤處理一致性](#4-錯誤處理一致性)
5. [API 回應格式一致性](#5-api-回應格式一致性)

---

## 1. 路由與模組命名一致性

### 問題描述

當前存在路由路徑與 ModuleType 枚舉值不一致的情況：

```typescript
// 模組類型定義
ModuleType.CHECKLISTS = 'checklists'
ModuleType.ISSUES = 'issues'
ModuleType.DIARY = 'diary'

// 但實際路由使用不同名稱
'/blueprint/:id/qc-inspections'  // CHECKLISTS 對應
'/blueprint/:id/problems'        // ISSUES 對應
'/blueprint/:id/diaries'         // DIARY 對應（複數形式）
```

### 影響範圍

- `src/app/routes/blueprint/routes.ts`
- `src/app/core/infra/types/blueprint/index.ts`
- 所有使用這些路由的連結和導航
- API 端點和文件

### 解決方案選項

#### 選項 A: 更新路由以匹配模組類型（推薦）

**優點**：
- 減少混淆
- 統一命名
- 更容易維護

**缺點**：
- 需要更新所有現有的連結
- 可能影響已有的書籤

**實作步驟**：

1. **更新路由定義**

```typescript
// src/app/routes/blueprint/routes.ts

// 修改前：
{
  path: 'qc-inspections',
  loadComponent: () => import('./qc-inspections/qc-inspections.component')
}

// 修改後：
{
  path: 'checklists',
  loadComponent: () => import('./qc-inspections/qc-inspections.component'),
  data: { 
    title: '品質管控',
    requiredModule: ModuleType.CHECKLISTS
  }
}
```

2. **添加重定向以保持向後兼容**

```typescript
// 在 routes.ts 中添加
{
  path: 'qc-inspections',
  redirectTo: 'checklists',
  pathMatch: 'full'
},
{
  path: 'problems',
  redirectTo: 'issues',
  pathMatch: 'full'
}
```

3. **更新 MODULES_CONFIG**

```typescript
// src/app/core/infra/types/blueprint/index.ts

export const MODULES_CONFIG: ExtendedModuleConfig[] = [
  {
    value: ModuleType.CHECKLISTS,
    label: '品質管控',
    icon: 'check-square',
    description: '品質檢查與巡檢清單',
    isCore: true,
    routePath: 'checklists',  // 從 'qc-inspections' 改為 'checklists'
    componentName: 'BlueprintChecklistsComponent'
  },
  {
    value: ModuleType.ISSUES,
    label: '問題追蹤',
    icon: 'warning',
    description: '施工問題登記與追蹤',
    isCore: true,
    routePath: 'issues',  // 從 'problems' 改為 'issues'
    componentName: 'BlueprintIssuesComponent'
  }
];
```

4. **更新所有導航連結**

```typescript
// 搜尋並替換所有實例

// 修改前：
this.router.navigate(['/blueprint', blueprintId, 'qc-inspections']);

// 修改後：
this.router.navigate(['/blueprint', blueprintId, 'checklists']);

// 或使用輔助函數：
const moduleConfig = getModuleConfig(ModuleType.CHECKLISTS);
this.router.navigate(['/blueprint', blueprintId, moduleConfig.routePath]);
```

5. **更新測試**

```typescript
// src/app/routes/blueprint/routes.spec.ts

it('should navigate to checklists route', () => {
  const config = getModuleConfig(ModuleType.CHECKLISTS);
  expect(config.routePath).toBe('checklists');
});
```

#### 選項 B: 保持當前路由，更新文件說明

如果因為已有大量使用者書籤或外部整合而無法更改路由：

```typescript
export const MODULES_CONFIG: ExtendedModuleConfig[] = [
  {
    value: ModuleType.CHECKLISTS,
    label: '品質管控',
    icon: 'check-square',
    description: '品質檢查與巡檢清單',
    isCore: true,
    routePath: 'qc-inspections',
    componentName: 'BlueprintQcInspectionsComponent',
    // 添加註解說明歷史原因
    /** 
     * @deprecated_name 'checklists'
     * @reason Historical: Originally designed for QC inspection workflows
     * 路由使用 'qc-inspections' 是因為最初設計時專注於品質檢查流程
     */
  }
];
```

### 驗證清單

- [ ] 所有路由定義已更新
- [ ] 重定向規則已添加
- [ ] MODULES_CONFIG 已更新
- [ ] 所有 `router.navigate` 調用已更新
- [ ] 所有 `routerLink` 指令已更新
- [ ] 測試已通過
- [ ] 文件已更新
- [ ] 無破壞性變更（或已記錄在 CHANGELOG）

---

## 2. 元件命名一致性

### 問題描述

元件檔名混用功能名稱和路由名稱：

```
✅ 一致: list.component.ts, overview.component.ts
❌ 不一致: 
  - qc-inspections.component.ts (使用路由名稱)
  - problems.component.ts (使用路由名稱)
```

### 解決方案

#### 方案：統一使用功能導向命名

**實作步驟**：

1. **重命名元件檔案**

```bash
# 在專案根目錄執行

# 重命名 QC Inspections 元件
mv src/app/routes/blueprint/qc-inspections/qc-inspections.component.ts \
   src/app/routes/blueprint/qc-inspections/checklist.component.ts
   
mv src/app/routes/blueprint/qc-inspections/qc-inspections.component.html \
   src/app/routes/blueprint/qc-inspections/checklist.component.html
   
mv src/app/routes/blueprint/qc-inspections/qc-inspections.component.less \
   src/app/routes/blueprint/qc-inspections/checklist.component.less

# 重命名 Problems 元件
mv src/app/routes/blueprint/problems/problems.component.ts \
   src/app/routes/blueprint/problems/issue.component.ts
   
mv src/app/routes/blueprint/problems/problems.component.html \
   src/app/routes/blueprint/problems/issue.component.html
   
mv src/app/routes/blueprint/problems/problems.component.less \
   src/app/routes/blueprint/problems/issue.component.less
```

2. **更新元件類別名稱**

```typescript
// checklist.component.ts

// 修改前：
@Component({
  selector: 'app-blueprint-qc-inspections',
  templateUrl: './qc-inspections.component.html',
  styleUrls: ['./qc-inspections.component.less']
})
export class BlueprintQcInspectionsComponent {}

// 修改後：
@Component({
  selector: 'app-blueprint-checklist',
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.less']
})
export class BlueprintChecklistComponent {}
```

3. **更新所有導入**

```typescript
// 修改前：
import { BlueprintQcInspectionsComponent } from './qc-inspections/qc-inspections.component';

// 修改後：
import { BlueprintChecklistComponent } from './qc-inspections/checklist.component';
```

4. **更新路由配置**

```typescript
// routes.ts
{
  path: 'checklists',
  loadComponent: () => import('./qc-inspections/checklist.component')
    .then(m => m.BlueprintChecklistComponent)
}
```

5. **建立命名規範文件**

```markdown
// docs/conventions/component-naming.md

# 元件命名規範

## 原則

1. 元件檔名使用 **功能名稱**，而非路由名稱
2. 使用 kebab-case
3. 使用單數形式（除非本質上就是複數）

## 範例

✅ 正確：
- task.component.ts (任務元件)
- checklist.component.ts (檢查清單元件)
- issue.component.ts (問題元件)

❌ 錯誤：
- qc-inspections.component.ts (使用路由名稱)
- problems.component.ts (使用路由名稱)
```

### 驗證清單

- [ ] 所有元件檔案已重命名
- [ ] 元件類別名稱已更新
- [ ] 所有導入語句已更新
- [ ] 路由配置已更新
- [ ] 測試檔案已更新
- [ ] 編譯成功
- [ ] 測試通過
- [ ] 命名規範文件已建立

---

## 3. Service 檔案組織一致性

### 問題描述

Service 檔案組織不統一：

```
✅ 一致: blueprint.service.ts, task.service.ts
❌ 不一致: file/file.service.ts, problem/problem.service.ts
```

### 解決方案

#### 推薦方案：按領域分組（Domain-Driven Structure）

**目標結構**：

```
src/app/shared/services/
├── blueprint/
│   ├── blueprint.service.ts
│   ├── blueprint-member.service.ts
│   ├── blueprint-permission.service.ts
│   └── index.ts
├── task/
│   ├── task.service.ts
│   ├── task-assignment.service.ts
│   └── index.ts
├── file/
│   ├── file.service.ts
│   ├── file-storage.service.ts
│   └── index.ts
├── checklist/
│   ├── checklist.service.ts
│   ├── checklist-item.service.ts
│   └── index.ts
└── issue/
    ├── issue.service.ts
    ├── issue-tracking.service.ts
    └── index.ts
```

**實作步驟**：

1. **建立領域資料夾**

```bash
# 為每個領域建立資料夾
mkdir -p src/app/shared/services/blueprint
mkdir -p src/app/shared/services/task
mkdir -p src/app/shared/services/checklist
mkdir -p src/app/shared/services/issue
```

2. **移動現有服務**

```bash
# 移動 blueprint 相關服務
mv src/app/shared/services/blueprint.service.ts \
   src/app/shared/services/blueprint/blueprint.service.ts

# 移動 file 服務（已經在資料夾中，保持原樣）

# 移動 problem 服務到 issue 資料夾
mv src/app/shared/services/problem/problem.service.ts \
   src/app/shared/services/issue/issue.service.ts
```

3. **建立 barrel 導出（index.ts）**

```typescript
// src/app/shared/services/blueprint/index.ts
export * from './blueprint.service';
export * from './blueprint-member.service';
export * from './blueprint-permission.service';

// src/app/shared/services/task/index.ts
export * from './task.service';
export * from './task-assignment.service';

// src/app/shared/services/issue/index.ts
export * from './issue.service';
export * from './issue-tracking.service';
```

4. **更新導入路徑**

```typescript
// 修改前：
import { BlueprintService } from '@shared/services/blueprint.service';
import { TaskService } from '@shared/services/task.service';
import { ProblemService } from '@shared/services/problem/problem.service';

// 修改後（使用 barrel 導出）：
import { BlueprintService } from '@shared/services/blueprint';
import { TaskService } from '@shared/services/task';
import { IssueService } from '@shared/services/issue';
```

5. **更新 tsconfig paths（如果使用）**

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@shared/services/*": ["src/app/shared/services/*"]
    }
  }
}
```

6. **建立服務組織規範**

```markdown
// docs/conventions/service-organization.md

# Service 組織規範

## 原則

1. 按照業務領域（Domain）組織服務
2. 每個領域一個資料夾
3. 使用 index.ts 作為 barrel 導出
4. 相關的服務放在同一個資料夾

## 資料夾結構

services/
├── [domain]/
│   ├── [domain].service.ts           # 主要服務
│   ├── [domain]-[feature].service.ts # 相關服務
│   └── index.ts                      # Barrel 導出

## 命名規範

- 主要服務: `[domain].service.ts`
- 輔助服務: `[domain]-[feature].service.ts`
- 使用 kebab-case
```

### 驗證清單

- [ ] 所有服務已按領域分組
- [ ] Barrel 導出（index.ts）已建立
- [ ] 所有導入路徑已更新
- [ ] tsconfig paths 已配置
- [ ] 編譯成功
- [ ] 測試通過
- [ ] 組織規範文件已建立

---

## 4. 錯誤處理一致性

### 問題描述

專案中存在多種錯誤處理模式，不統一：

```typescript
// 模式 1: Signal-based
private errorState = signal<string | null>(null);

// 模式 2: 直接顯示訊息
catch (error) {
  this.message.error('操作失敗');
}

// 模式 3: 混合 console.log（開發殘留）
catch (error) {
  console.log(error);
  this.logger.error('操作失敗', error);
}
```

### 解決方案

#### 建立統一的錯誤處理系統

**實作步驟**：

1. **建立 ErrorHandler Service**

```typescript
// src/app/core/error/error-handler.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LoggerService } from '../logger/logger.service';

export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  private readonly message = inject(NzMessageService);
  private readonly logger = inject(LoggerService);

  /**
   * 處理錯誤的統一入口
   */
  handleError(
    error: Error | HttpErrorResponse | unknown,
    context?: ErrorContext
  ): void {
    // 1. 解析錯誤
    const parsedError = this.parseError(error);
    
    // 2. 記錄日誌
    this.logError(parsedError, context);
    
    // 3. 顯示使用者訊息
    this.showUserMessage(parsedError);
    
    // 4. 可選：回報到監控系統
    if (parsedError.severity === ErrorSeverity.CRITICAL) {
      this.reportToMonitoring(parsedError, context);
    }
  }

  /**
   * 解析不同類型的錯誤
   */
  private parseError(error: unknown): ParsedError {
    // HTTP 錯誤
    if (error instanceof HttpErrorResponse) {
      return {
        type: 'http',
        message: this.getHttpErrorMessage(error),
        originalError: error,
        severity: this.getHttpErrorSeverity(error.status),
        statusCode: error.status
      };
    }

    // 標準 Error
    if (error instanceof Error) {
      return {
        type: 'app',
        message: error.message,
        originalError: error,
        severity: ErrorSeverity.MEDIUM,
        stack: error.stack
      };
    }

    // 未知錯誤
    return {
      type: 'unknown',
      message: '發生未知錯誤',
      originalError: error,
      severity: ErrorSeverity.LOW
    };
  }

  /**
   * 取得 HTTP 錯誤訊息
   */
  private getHttpErrorMessage(error: HttpErrorResponse): string {
    // 從後端回應取得錯誤訊息
    if (error.error?.message) {
      return error.error.message;
    }

    // 根據狀態碼返回友善訊息
    const errorMessages: Record<number, string> = {
      400: '請求參數錯誤',
      401: '未授權，請重新登入',
      403: '沒有權限執行此操作',
      404: '找不到請求的資源',
      409: '資料衝突，請重新整理後再試',
      500: '伺服器錯誤，請稍後再試',
      503: '服務暫時無法使用'
    };

    return errorMessages[error.status] || `請求失敗 (${error.status})`;
  }

  /**
   * 判斷錯誤嚴重程度
   */
  private getHttpErrorSeverity(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  /**
   * 記錄錯誤日誌
   */
  private logError(error: ParsedError, context?: ErrorContext): void {
    const logContext = {
      type: error.type,
      severity: error.severity,
      statusCode: error.statusCode,
      ...context,
      timestamp: new Date().toISOString()
    };

    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      this.logger.error(error.message, error.originalError, logContext);
    } else {
      this.logger.warn(error.message, logContext);
    }
  }

  /**
   * 顯示使用者訊息
   */
  private showUserMessage(error: ParsedError): void {
    const duration = error.severity === ErrorSeverity.CRITICAL ? 0 : 5000;

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        this.message.error(error.message, { nzDuration: duration });
        break;
      case ErrorSeverity.MEDIUM:
        this.message.warning(error.message);
        break;
      case ErrorSeverity.LOW:
        this.message.info(error.message);
        break;
    }
  }

  /**
   * 回報到監控系統
   */
  private reportToMonitoring(error: ParsedError, context?: ErrorContext): void {
    // 整合 Sentry 或其他監控系統
    // 例如:
    // Sentry.captureException(error.originalError, {
    //   contexts: { custom: context }
    // });
    
    // 目前先記錄日誌
    this.logger.error('Critical error reported to monitoring', error, context);
  }
}

interface ParsedError {
  type: 'http' | 'app' | 'unknown';
  message: string;
  originalError: unknown;
  severity: ErrorSeverity;
  statusCode?: number;
  stack?: string;
}
```

2. **在 Service 中使用統一錯誤處理**

```typescript
// src/app/shared/services/blueprint/blueprint.service.ts

import { Injectable, inject } from '@angular/core';
import { ErrorHandlerService } from '@core/error/error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class BlueprintService {
  private readonly errorHandler = inject(ErrorHandlerService);

  async createBlueprint(request: CreateBlueprintRequest): Promise<Blueprint | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('blueprints')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: 'BlueprintService',
        action: 'createBlueprint',
        metadata: { request }
      });
      return null;
    }
  }
}
```

3. **在 Component 中使用**

```typescript
// src/app/routes/blueprint/create-blueprint/create-blueprint.component.ts

import { Component, inject } from '@angular/core';
import { ErrorHandlerService } from '@core/error/error-handler.service';

@Component({
  selector: 'app-create-blueprint',
  template: `...`
})
export class CreateBlueprintComponent {
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly blueprintService = inject(BlueprintService);

  async onSubmit(): Promise<void> {
    try {
      const result = await this.blueprintService.createBlueprint(this.form.value);
      
      if (!result) {
        // ErrorHandler 已經處理錯誤顯示
        return;
      }

      this.message.success('藍圖建立成功');
      this.router.navigate(['/blueprint', result.id]);
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: 'CreateBlueprintComponent',
        action: 'onSubmit'
      });
    }
  }
}
```

4. **建立全域錯誤攔截器（HTTP）**

```typescript
// src/app/core/net/error.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../error/error-handler.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      errorHandler.handleError(error, {
        component: 'HttpInterceptor',
        action: req.method,
        metadata: {
          url: req.url,
          params: req.params.keys()
        }
      });
      
      return throwError(() => error);
    })
  );
};
```

5. **建立全域錯誤處理器（Angular）**

```typescript
// src/app/core/error/global-error-handler.ts

import { ErrorHandler, inject, Injectable } from '@angular/core';
import { ErrorHandlerService } from './error-handler.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly errorHandlerService = inject(ErrorHandlerService);

  handleError(error: Error): void {
    this.errorHandlerService.handleError(error, {
      component: 'GlobalErrorHandler',
      action: 'handleError'
    });
  }
}
```

6. **註冊錯誤處理器**

```typescript
// src/app/app.config.ts

import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { GlobalErrorHandler } from '@core/error/global-error-handler';
import { errorInterceptor } from '@core/net/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideHttpClient(
      withInterceptors([errorInterceptor])
    )
  ]
};
```

7. **移除所有 console.log**

```bash
# 搜尋所有 console.log
grep -r "console.log" src/app --include="*.ts"

# 如果發現，手動移除或使用 sed 替換
find src/app -name "*.ts" -exec sed -i '/console\.log/d' {} \;
```

### 驗證清單

- [ ] ErrorHandlerService 已建立
- [ ] Service 層錯誤處理已統一
- [ ] Component 層錯誤處理已統一
- [ ] HTTP 錯誤攔截器已設置
- [ ] 全域錯誤處理器已設置
- [ ] 所有 console.log 已移除
- [ ] 錯誤訊息對使用者友善
- [ ] 錯誤日誌包含足夠 context
- [ ] 測試涵蓋各種錯誤情況

---

## 5. API 回應格式一致性

### 問題描述

不同的 API 端點可能回傳不同格式的回應，缺乏統一標準。

### 解決方案

#### 建立統一的 API 回應格式

**實作步驟**：

1. **定義統一的回應型別**

```typescript
// src/app/core/infra/types/api/response.types.ts

/**
 * 統一的 API 回應包裝
 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 回應資料 */
  data?: T;
  /** 錯誤訊息 */
  error?: ApiError;
  /** 分頁資訊（如果適用） */
  pagination?: PaginationInfo;
  /** 元資料 */
  meta?: Record<string, any>;
}

/**
 * API 錯誤格式
 */
export interface ApiError {
  /** 錯誤代碼 */
  code: string;
  /** 錯誤訊息 */
  message: string;
  /** 詳細資訊 */
  details?: Record<string, any>;
  /** 欄位驗證錯誤 */
  fieldErrors?: FieldError[];
}

/**
 * 欄位驗證錯誤
 */
export interface FieldError {
  /** 欄位名稱 */
  field: string;
  /** 錯誤訊息 */
  message: string;
  /** 錯誤代碼 */
  code?: string;
}

/**
 * 分頁資訊
 */
export interface PaginationInfo {
  /** 當前頁碼 */
  page: number;
  /** 每頁筆數 */
  pageSize: number;
  /** 總筆數 */
  total: number;
  /** 總頁數 */
  totalPages: number;
  /** 是否有下一頁 */
  hasNext: boolean;
  /** 是否有上一頁 */
  hasPrevious: boolean;
}

/**
 * 列表回應
 */
export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}
```

2. **建立回應處理工具**

```typescript
// src/app/core/infra/api/response-handler.ts

import { ApiResponse, ApiError, PaginationInfo } from '../types/api/response.types';

export class ResponseHandler {
  /**
   * 建立成功回應
   */
  static success<T>(data: T, meta?: Record<string, any>): ApiResponse<T> {
    return {
      success: true,
      data,
      meta
    };
  }

  /**
   * 建立錯誤回應
   */
  static error(error: ApiError): ApiResponse {
    return {
      success: false,
      error
    };
  }

  /**
   * 建立列表回應
   */
  static list<T>(
    items: T[],
    pagination: PaginationInfo,
    meta?: Record<string, any>
  ): ApiResponse<T[]> {
    return {
      success: true,
      data: items,
      pagination,
      meta
    };
  }

  /**
   * 檢查回應是否成功
   */
  static isSuccess<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
    return response.success && response.data !== undefined;
  }

  /**
   * 取得錯誤訊息
   */
  static getErrorMessage(response: ApiResponse): string {
    return response.error?.message || '未知錯誤';
  }
}
```

3. **在 Service 中使用統一格式**

```typescript
// src/app/shared/services/blueprint/blueprint.service.ts

import { Injectable } from '@angular/core';
import { ApiResponse, ListResponse, ResponseHandler } from '@core';

@Injectable({
  providedIn: 'root'
})
export class BlueprintService {
  async findAll(page: number = 1, pageSize: number = 20): Promise<ListResponse<Blueprint>> {
    try {
      const { data, error, count } = await this.supabase.client
        .from('blueprints')
        .select('*', { count: 'exact' })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return ResponseHandler.list(
        data || [],
        {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      );
    } catch (error) {
      this.errorHandler.handleError(error);
      return ResponseHandler.error({
        code: 'FETCH_ERROR',
        message: '取得藍圖列表失敗'
      });
    }
  }

  async findById(id: string): Promise<ApiResponse<Blueprint>> {
    try {
      const { data, error } = await this.supabase.client
        .from('blueprints')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return ResponseHandler.success(data);
    } catch (error) {
      this.errorHandler.handleError(error);
      return ResponseHandler.error({
        code: 'NOT_FOUND',
        message: '找不到指定的藍圖'
      });
    }
  }
}
```

4. **在 Component 中使用**

```typescript
// src/app/routes/blueprint/list/list.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { BlueprintService } from '@shared/services/blueprint';
import { ResponseHandler } from '@core';

@Component({
  selector: 'app-blueprint-list',
  template: `...`
})
export class BlueprintListComponent implements OnInit {
  private readonly blueprintService = inject(BlueprintService);

  blueprints = signal<Blueprint[]>([]);
  pagination = signal<PaginationInfo | null>(null);
  loading = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadBlueprints();
  }

  async loadBlueprints(page: number = 1): Promise<void> {
    this.loading.set(true);

    try {
      const response = await this.blueprintService.findAll(page);

      if (ResponseHandler.isSuccess(response)) {
        this.blueprints.set(response.data);
        this.pagination.set(response.pagination!);
      } else {
        // 錯誤已由 ErrorHandler 處理
        this.blueprints.set([]);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async onPageChange(page: number): Promise<void> {
    await this.loadBlueprints(page);
  }
}
```

### 驗證清單

- [ ] API 回應型別已定義
- [ ] ResponseHandler 工具類已建立
- [ ] Service 層使用統一回應格式
- [ ] Component 層正確處理回應
- [ ] 錯誤情況有適當的錯誤碼
- [ ] 分頁資訊完整
- [ ] 測試涵蓋成功和失敗情況

---

## 總結

完成以上所有步驟後，專案的一致性將大幅提升：

### 改進項目檢查清單

- [ ] 路由與模組命名統一
- [ ] 元件命名規範一致
- [ ] Service 檔案組織統一
- [ ] 錯誤處理機制統一
- [ ] API 回應格式標準化
- [ ] 所有 console.log 已移除
- [ ] 文件和規範已更新
- [ ] 測試已補充

### 預期效果

1. **提升可維護性** - 統一的命名和組織讓程式碼更容易理解
2. **減少錯誤** - 統一的錯誤處理減少遺漏
3. **改善開發體驗** - 清晰的規範讓新成員更快上手
4. **提高程式碼品質** - 統一的格式和標準提升整體品質

### 實施建議

1. **逐步實施** - 不要一次改動太多，按優先級逐步完成
2. **充分測試** - 每個改動都要有對應的測試驗證
3. **團隊溝通** - 與團隊成員充分溝通變更原因和方式
4. **文件先行** - 先建立規範文件，再進行實際修改

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-08  
**下次審查**: 完成實施後

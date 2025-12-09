# 統一性問題實作指南
# Unification Issues Implementation Guide

> **詳細的逐步實作指南** 
> Step-by-step guide for improving unification

---

## 目錄 (Table of Contents)

1. [API 呼叫模式統一](#1-api-呼叫模式統一)
2. [表單驗證統一](#2-表單驗證統一)
3. [狀態管理模式統一](#3-狀態管理模式統一)
4. [UI 元件模式統一](#4-ui-元件模式統一)
5. [資料轉換統一](#5-資料轉換統一)

---

## 1. API 呼叫模式統一

### 問題描述

專案中混用了多種 API 呼叫方式：

```typescript
// 方式 1: 直接使用 Repository
const data = await firstValueFrom(this.repo.findById(id));

// 方式 2: 使用 Service 層
const data = await this.service.findById(id);

// 方式 3: 直接使用 Supabase Client
const { data } = await this.supabase.client.from('table').select();
```

### 解決方案

#### 建立清晰的三層架構

**架構層級**：
```
Component (呈現層)
    ↓
Service (業務邏輯層)
    ↓
Repository (資料存取層)
    ↓
Supabase Client (資料庫層)
```

**實作步驟**：

1. **建立 Repository 基礎類別**

```typescript
// src/app/core/infra/repository/base.repository.ts

import { inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from '@core/supabase/supabase.service';
import { Observable, from } from 'rxjs';

export abstract class BaseRepository<T> {
  protected readonly supabase: SupabaseClient;
  protected abstract readonly tableName: string;

  constructor() {
    const supabaseService = inject(SupabaseService);
    this.supabase = supabaseService.client;
  }

  /**
   * 查詢所有記錄
   */
  findAll(): Observable<T[]> {
    return from(
      this.supabase
        .from(this.tableName)
        .select('*')
        .then(({ data, error }) => {
          if (error) throw error;
          return data as T[];
        })
    );
  }

  /**
   * 根據 ID 查詢單筆記錄
   */
  findById(id: string): Observable<T | null> {
    return from(
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data as T;
        })
    );
  }

  /**
   * 建立記錄
   */
  create(entity: Partial<T>): Observable<T> {
    return from(
      this.supabase
        .from(this.tableName)
        .insert(entity)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data as T;
        })
    );
  }

  /**
   * 更新記錄
   */
  update(id: string, entity: Partial<T>): Observable<T> {
    return from(
      this.supabase
        .from(this.tableName)
        .update(entity)
        .eq('id', id)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data as T;
        })
    );
  }

  /**
   * 刪除記錄
   */
  delete(id: string): Observable<void> {
    return from(
      this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) throw error;
        })
    );
  }

  /**
   * 根據條件查詢
   */
  findBy(field: keyof T, value: any): Observable<T[]> {
    return from(
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq(field as string, value)
        .then(({ data, error }) => {
          if (error) throw error;
          return data as T[];
        })
    );
  }
}
```

2. **實作具體的 Repository**

```typescript
// src/app/core/infra/repository/blueprint.repository.ts

import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { BaseRepository } from './base.repository';
import { Blueprint } from '../types/blueprint';

@Injectable({
  providedIn: 'root'
})
export class BlueprintRepository extends BaseRepository<Blueprint> {
  protected readonly tableName = 'blueprints';

  /**
   * 根據擁有者查詢藍圖
   */
  findByOwner(ownerId: string): Observable<Blueprint[]> {
    return this.findBy('owner_id', ownerId);
  }

  /**
   * 查詢公開藍圖
   */
  findPublic(): Observable<Blueprint[]> {
    return from(
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('is_public', true)
        .then(({ data, error }) => {
          if (error) throw error;
          return data as Blueprint[];
        })
    );
  }

  /**
   * 根據 slug 查詢藍圖
   */
  findBySlug(slug: string): Observable<Blueprint | null> {
    return this.findBy('slug', slug).pipe(
      map(blueprints => blueprints[0] || null)
    );
  }
}
```

3. **Service 層統一使用 Repository**

```typescript
// src/app/shared/services/blueprint/blueprint.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BlueprintRepository } from '@core/infra/repository/blueprint.repository';
import { Blueprint, CreateBlueprintRequest, UpdateBlueprintRequest } from '@core';
import { ErrorHandlerService } from '@core/error/error-handler.service';
import { ApiResponse, ResponseHandler } from '@core/infra/api/response-handler';

@Injectable({
  providedIn: 'root'
})
export class BlueprintService {
  // 統一注入 Repository，不直接使用 Supabase Client
  private readonly repository = inject(BlueprintRepository);
  private readonly errorHandler = inject(ErrorHandlerService);

  // Service 狀態
  private blueprintsState = signal<Blueprint[]>([]);
  private loadingState = signal(false);

  readonly blueprints = this.blueprintsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  /**
   * 查詢所有藍圖
   * 業務邏輯：過濾已刪除的藍圖
   */
  async findAll(): Promise<ApiResponse<Blueprint[]>> {
    try {
      this.loadingState.set(true);
      
      // 透過 Repository 查詢
      const blueprints = await firstValueFrom(this.repository.findAll());
      
      // 業務邏輯：過濾已刪除
      const activeBlueprints = blueprints.filter(b => !b.deleted_at);
      
      this.blueprintsState.set(activeBlueprints);
      return ResponseHandler.success(activeBlueprints);
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: 'BlueprintService',
        action: 'findAll'
      });
      return ResponseHandler.error({
        code: 'FETCH_ERROR',
        message: '取得藍圖列表失敗'
      });
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 根據 ID 查詢藍圖
   * 業務邏輯：檢查權限
   */
  async findById(id: string): Promise<ApiResponse<Blueprint>> {
    try {
      const blueprint = await firstValueFrom(this.repository.findById(id));
      
      if (!blueprint) {
        return ResponseHandler.error({
          code: 'NOT_FOUND',
          message: '找不到指定的藍圖'
        });
      }

      // 業務邏輯：檢查是否已刪除
      if (blueprint.deleted_at) {
        return ResponseHandler.error({
          code: 'DELETED',
          message: '該藍圖已被刪除'
        });
      }

      return ResponseHandler.success(blueprint);
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: 'BlueprintService',
        action: 'findById',
        metadata: { id }
      });
      return ResponseHandler.error({
        code: 'FETCH_ERROR',
        message: '取得藍圖詳情失敗'
      });
    }
  }

  /**
   * 建立藍圖
   * 業務邏輯：驗證與預處理
   */
  async create(request: CreateBlueprintRequest): Promise<ApiResponse<Blueprint>> {
    try {
      // 業務邏輯：驗證
      this.validateCreateRequest(request);

      // 業務邏輯：產生 slug
      const slug = request.slug || this.generateSlug(request.name);

      // 透過 Repository 建立
      const blueprint = await firstValueFrom(
        this.repository.create({
          ...request,
          slug,
          created_at: new Date().toISOString()
        })
      );

      // 更新狀態
      this.blueprintsState.update(list => [...list, blueprint]);

      return ResponseHandler.success(blueprint);
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: 'BlueprintService',
        action: 'create',
        metadata: { request }
      });
      return ResponseHandler.error({
        code: 'CREATE_ERROR',
        message: '建立藍圖失敗'
      });
    }
  }

  /**
   * 業務邏輯：驗證建立請求
   */
  private validateCreateRequest(request: CreateBlueprintRequest): void {
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('藍圖名稱不能為空');
    }

    if (request.name.length > 100) {
      throw new Error('藍圖名稱不能超過 100 個字元');
    }
  }

  /**
   * 業務邏輯：產生 slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .slice(0, 50);
  }
}
```

4. **Component 層統一使用 Service**

```typescript
// src/app/routes/blueprint/list/list.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { BlueprintService } from '@shared/services/blueprint';
import { Blueprint } from '@core';
import { ResponseHandler } from '@core/infra/api/response-handler';

@Component({
  selector: 'app-blueprint-list',
  template: `
    <nz-spin [nzSpinning]="loading()">
      <!-- 藍圖列表 UI -->
    </nz-spin>
  `
})
export class BlueprintListComponent implements OnInit {
  // 統一透過 Service 注入，不直接使用 Repository 或 Supabase
  private readonly blueprintService = inject(BlueprintService);

  blueprints = signal<Blueprint[]>([]);
  loading = this.blueprintService.loading;

  async ngOnInit(): Promise<void> {
    await this.loadBlueprints();
  }

  async loadBlueprints(): Promise<void> {
    const response = await this.blueprintService.findAll();

    if (ResponseHandler.isSuccess(response)) {
      this.blueprints.set(response.data);
    }
  }

  async onRefresh(): Promise<void> {
    await this.loadBlueprints();
  }
}
```

5. **建立呼叫規範文件**

```markdown
// docs/conventions/api-calling-patterns.md

# API 呼叫模式規範

## 架構層級

```
Component (呈現層)
    ↓ 只能呼叫 Service
Service (業務邏輯層)
    ↓ 只能呼叫 Repository
Repository (資料存取層)
    ↓ 只能呼叫 Supabase Client
Supabase Client (資料庫層)
```

## 規則

1. **Component 層**
   - 只能注入 Service
   - 不能直接使用 Repository 或 Supabase Client
   - 負責 UI 邏輯和使用者互動

2. **Service 層**
   - 只能注入 Repository
   - 包含業務邏輯
   - 管理應用狀態
   - 不直接操作資料庫

3. **Repository 層**
   - 只能使用 Supabase Client
   - 負責資料存取
   - 不包含業務邏輯
   - 提供基本 CRUD 操作

## 特殊情況

### RPC 呼叫

如果需要使用 Supabase RPC 函數（SECURITY DEFINER），可在 Service 層直接呼叫：

```typescript
async createBlueprintWithMembers(request: CreateBlueprintRequest): Promise<Blueprint> {
  // 使用 RPC 函數進行原子性操作
  const { data, error } = await this.supabase.client
    .rpc('create_blueprint_with_members', {
      p_name: request.name,
      p_members: request.members
    });
    
  if (error) throw error;
  return data;
}
```

### Realtime 訂閱

Realtime 訂閱通常在 Service 層處理：

```typescript
subscribeToBlueprints(blueprintId: string): void {
  this.supabase.client
    .channel(`blueprint:${blueprintId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'blueprints' },
      (payload) => this.handleBlueprintChange(payload)
    )
    .subscribe();
}
```
```

### 驗證清單

- [ ] BaseRepository 已建立
- [ ] 所有 Entity Repository 繼承 BaseRepository
- [ ] Service 層統一使用 Repository
- [ ] Component 層統一使用 Service
- [ ] 沒有跨層級的直接呼叫
- [ ] RPC 和 Realtime 使用有明確規範
- [ ] 呼叫規範文件已建立

---

## 2. 表單驗證統一

### 問題描述

缺乏統一的表單驗證策略，驗證邏輯分散在各處。

### 解決方案

#### 建立統一的驗證系統

**實作步驟**：

1. **建立自訂驗證器**

```typescript
// src/app/shared/validators/custom-validators.ts

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  /**
   * 藍圖名稱驗證器
   */
  static blueprintName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null; // 使用 required 驗證器處理
      }

      // 長度檢查
      if (value.length < 2) {
        return { blueprintNameTooShort: { minLength: 2, actualLength: value.length } };
      }

      if (value.length > 100) {
        return { blueprintNameTooLong: { maxLength: 100, actualLength: value.length } };
      }

      // 特殊字元檢查
      const invalidChars = /[<>'"]/g;
      if (invalidChars.test(value)) {
        return { blueprintNameInvalidChars: { invalidChars: '<, >, \', "' } };
      }

      return null;
    };
  }

  /**
   * Email 驗證器（加強版）
   */
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // RFC 5322 compliant email regex
      const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

      if (!emailRegex.test(value)) {
        return { invalidEmail: { value } };
      }

      return null;
    };
  }

  /**
   * URL 驗證器
   */
  static url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      try {
        new URL(value);
        return null;
      } catch {
        return { invalidUrl: { value } };
      }
    };
  }

  /**
   * 日期範圍驗證器
   */
  static dateRange(startDateField: string, endDateField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = control.get(startDateField)?.value;
      const endDate = control.get(endDateField)?.value;

      if (!startDate || !endDate) {
        return null;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return { invalidDateRange: { startDate, endDate } };
      }

      return null;
    };
  }

  /**
   * 密碼強度驗證器
   */
  static passwordStrength(minLength: number = 8): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const errors: any = {};

      // 長度檢查
      if (value.length < minLength) {
        errors.passwordTooShort = { minLength, actualLength: value.length };
      }

      // 包含數字
      if (!/\d/.test(value)) {
        errors.passwordNoNumber = true;
      }

      // 包含小寫字母
      if (!/[a-z]/.test(value)) {
        errors.passwordNoLowercase = true;
      }

      // 包含大寫字母
      if (!/[A-Z]/.test(value)) {
        errors.passwordNoUppercase = true;
      }

      // 包含特殊字元
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        errors.passwordNoSpecialChar = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * 確認密碼驗證器
   */
  static confirmPassword(passwordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.parent?.get(passwordField)?.value;
      const confirmPassword = control.value;

      if (!password || !confirmPassword) {
        return null;
      }

      if (password !== confirmPassword) {
        return { passwordMismatch: true };
      }

      return null;
    };
  }

  /**
   * 手機號碼驗證器（台灣）
   */
  static taiwanMobile(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // 台灣手機號碼格式：09XX-XXX-XXX
      const mobileRegex = /^09\d{2}-?\d{3}-?\d{3}$/;

      if (!mobileRegex.test(value)) {
        return { invalidTaiwanMobile: { value } };
      }

      return null;
    };
  }
}
```

2. **建立驗證訊息服務**

```typescript
// src/app/shared/validators/validation-messages.ts

export const VALIDATION_MESSAGES = {
  required: '此欄位為必填',
  email: '請輸入有效的 Email 地址',
  invalidEmail: '請輸入有效的 Email 地址',
  minlength: '長度不得少於 {requiredLength} 個字元',
  maxlength: '長度不得超過 {maxLength} 個字元',
  min: '數值不得小於 {min}',
  max: '數值不得大於 {max}',
  pattern: '格式不正確',
  
  // 自訂驗證訊息
  blueprintNameTooShort: '藍圖名稱至少需要 {minLength} 個字元',
  blueprintNameTooLong: '藍圖名稱不能超過 {maxLength} 個字元',
  blueprintNameInvalidChars: '藍圖名稱不能包含 {invalidChars} 等特殊字元',
  
  invalidUrl: '請輸入有效的 URL',
  invalidDateRange: '結束日期必須晚於開始日期',
  
  passwordTooShort: '密碼長度至少需要 {minLength} 個字元',
  passwordNoNumber: '密碼必須包含數字',
  passwordNoLowercase: '密碼必須包含小寫字母',
  passwordNoUppercase: '密碼必須包含大寫字母',
  passwordNoSpecialChar: '密碼必須包含特殊字元',
  passwordMismatch: '兩次輸入的密碼不一致',
  
  invalidTaiwanMobile: '請輸入有效的台灣手機號碼'
};

/**
 * 取得驗證錯誤訊息
 */
export function getValidationMessage(
  errorKey: string,
  errorValue?: any
): string {
  let message = VALIDATION_MESSAGES[errorKey] || '輸入格式不正確';

  // 替換訊息中的參數
  if (errorValue && typeof errorValue === 'object') {
    Object.keys(errorValue).forEach(key => {
      message = message.replace(`{${key}}`, errorValue[key]);
    });
  }

  return message;
}
```

3. **建立表單錯誤顯示元件**

```typescript
// src/app/shared/components/form-error/form-error.component.ts

import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getValidationMessage } from '../../validators/validation-messages';

@Component({
  selector: 'app-form-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (control && control.invalid && (control.dirty || control.touched)) {
      <div class="form-error">
        @for (error of getErrors(); track error.key) {
          <div class="error-message">{{ error.message }}</div>
        }
      </div>
    }
  `,
  styles: [`
    .form-error {
      color: #ff4d4f;
      font-size: 12px;
      margin-top: 4px;
    }

    .error-message {
      line-height: 1.5;
    }
  `]
})
export class FormErrorComponent {
  @Input() control: AbstractControl | null = null;

  getErrors(): Array<{ key: string; message: string }> {
    if (!this.control || !this.control.errors) {
      return [];
    }

    return Object.keys(this.control.errors).map(key => ({
      key,
      message: getValidationMessage(key, this.control!.errors![key])
    }));
  }
}
```

4. **在表單中使用統一驗證**

```typescript
// src/app/routes/blueprint/create-blueprint/create-blueprint.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CustomValidators } from '@shared/validators/custom-validators';
import { FormErrorComponent } from '@shared/components/form-error/form-error.component';

@Component({
  selector: 'app-create-blueprint',
  standalone: true,
  imports: [ReactiveFormsModule, FormErrorComponent, /* ... */],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <!-- 藍圖名稱 -->
      <nz-form-item>
        <nz-form-label [nzRequired]="true">藍圖名稱</nz-form-label>
        <nz-form-control>
          <input nz-input formControlName="name" placeholder="請輸入藍圖名稱" />
          <app-form-error [control]="form.get('name')"></app-form-error>
        </nz-form-control>
      </nz-form-item>

      <!-- Email -->
      <nz-form-item>
        <nz-form-label [nzRequired]="true">Email</nz-form-label>
        <nz-form-control>
          <input nz-input formControlName="email" placeholder="請輸入 Email" />
          <app-form-error [control]="form.get('email')"></app-form-error>
        </nz-form-control>
      </nz-form-item>

      <!-- URL -->
      <nz-form-item>
        <nz-form-label>網站</nz-form-label>
        <nz-form-control>
          <input nz-input formControlName="website" placeholder="請輸入網站 URL" />
          <app-form-error [control]="form.get('website')"></app-form-error>
        </nz-form-control>
      </nz-form-item>

      <!-- 送出按鈕 -->
      <button nz-button nzType="primary" [disabled]="form.invalid">
        建立藍圖
      </button>
    </form>
  `
})
export class CreateBlueprintComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', [
        Validators.required,
        CustomValidators.blueprintName()
      ]],
      email: ['', [
        Validators.required,
        CustomValidators.email()
      ]],
      website: ['', [
        CustomValidators.url()
      ]],
      description: ['', [
        Validators.maxLength(500)
      ]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      // 處理表單送出
      const formValue = this.form.value;
      console.log('Form submitted:', formValue);
    } else {
      // 標記所有欄位為已觸碰，顯示驗證錯誤
      Object.keys(this.form.controls).forEach(key => {
        const control = this.form.get(key);
        control?.markAsTouched();
        control?.updateValueAndValidity();
      });
    }
  }
}
```

5. **建立表單驗證規範文件**

```markdown
// docs/conventions/form-validation.md

# 表單驗證規範

## 原則

1. 使用 Reactive Forms
2. 使用統一的自訂驗證器
3. 使用統一的錯誤訊息
4. 使用 FormErrorComponent 顯示錯誤

## 驗證器使用

### 內建驗證器

```typescript
import { Validators } from '@angular/forms';

// 必填
Validators.required

// 最小長度
Validators.minLength(5)

// 最大長度
Validators.maxLength(100)

// 數值範圍
Validators.min(0)
Validators.max(100)

// 正規表達式
Validators.pattern(/^[0-9]+$/)
```

### 自訂驗證器

```typescript
import { CustomValidators } from '@shared/validators/custom-validators';

// 藍圖名稱
CustomValidators.blueprintName()

// Email
CustomValidators.email()

// URL
CustomValidators.url()

// 密碼強度
CustomValidators.passwordStrength(8)

// 確認密碼
CustomValidators.confirmPassword('password')

// 台灣手機
CustomValidators.taiwanMobile()
```

## 錯誤顯示

使用 FormErrorComponent：

```html
<input nz-input formControlName="name" />
<app-form-error [control]="form.get('name')"></app-form-error>
```

## 表單送出驗證

```typescript
onSubmit(): void {
  if (this.form.valid) {
    // 處理表單送出
  } else {
    // 標記所有欄位為已觸碰
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }
}
```
```

### 驗證清單

- [ ] CustomValidators 已建立
- [ ] ValidationMessages 已定義
- [ ] FormErrorComponent 已實作
- [ ] 所有表單使用統一驗證器
- [ ] 所有表單使用 FormErrorComponent
- [ ] 錯誤訊息友善且一致
- [ ] 表單驗證規範文件已建立

---

## 3. 狀態管理模式統一

### 問題描述

雖然使用 Angular Signals，但模式不完全一致。

### 解決方案

#### 建立標準的 Signal 使用模式

**實作步驟**：

1. **建立 State Service 基礎類別**

```typescript
// src/app/core/state/base-state.service.ts

import { signal, computed, Signal } from '@angular/core';

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export abstract class BaseStateService<T> {
  // 私有可寫入狀態
  protected readonly dataState = signal<T[]>([]);
  protected readonly loadingState = signal<boolean>(false);
  protected readonly errorState = signal<string | null>(null);

  // 公開唯讀狀態
  readonly data = this.dataState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // 計算屬性
  readonly hasData = computed(() => this.dataState().length > 0);
  readonly isEmpty = computed(() => this.dataState().length === 0);
  readonly hasError = computed(() => this.errorState() !== null);

  /**
   * 設定載入中狀態
   */
  protected setLoading(loading: boolean): void {
    this.loadingState.set(loading);
    if (loading) {
      this.errorState.set(null);
    }
  }

  /**
   * 設定錯誤狀態
   */
  protected setError(error: string | null): void {
    this.errorState.set(error);
    this.loadingState.set(false);
  }

  /**
   * 設定資料
   */
  protected setData(data: T[]): void {
    this.dataState.set(data);
    this.loadingState.set(false);
    this.errorState.set(null);
  }

  /**
   * 新增項目
   */
  protected addItem(item: T): void {
    this.dataState.update(items => [...items, item]);
  }

  /**
   * 更新項目
   */
  protected updateItem(predicate: (item: T) => boolean, updatedItem: Partial<T>): void {
    this.dataState.update(items =>
      items.map(item =>
        predicate(item) ? { ...item, ...updatedItem } : item
      )
    );
  }

  /**
   * 移除項目
   */
  protected removeItem(predicate: (item: T) => boolean): void {
    this.dataState.update(items => items.filter(item => !predicate(item)));
  }

  /**
   * 清空狀態
   */
  clear(): void {
    this.dataState.set([]);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
```

2. **實作具體的 State Service**

```typescript
// src/app/shared/services/blueprint/blueprint-state.service.ts

import { Injectable, inject } from '@angular/core';
import { computed } from '@angular/core';
import { BaseStateService } from '@core/state/base-state.service';
import { Blueprint } from '@core';

@Injectable({
  providedIn: 'root'
})
export class BlueprintStateService extends BaseStateService<Blueprint> {
  // 領域特定的計算屬性
  readonly activeBlueprints = computed(() =>
    this.dataState().filter(b => !b.deleted_at && b.status === 'active')
  );

  readonly archivedBlueprints = computed(() =>
    this.dataState().filter(b => !b.deleted_at && b.status === 'archived')
  );

  readonly publicBlueprints = computed(() =>
    this.dataState().filter(b => b.is_public)
  );

  /**
   * 根據 ID 查詢藍圖
   */
  readonly findById = (id: string): Signal<Blueprint | undefined> =>
    computed(() => this.dataState().find(b => b.id === id));

  /**
   * 根據 slug 查詢藍圖
   */
  readonly findBySlug = (slug: string): Signal<Blueprint | undefined> =>
    computed(() => this.dataState().find(b => b.slug === slug));

  /**
   * 載入藍圖列表
   */
  async loadBlueprints(blueprints: Blueprint[]): Promise<void> {
    this.setData(blueprints);
  }

  /**
   * 新增藍圖
   */
  async addBlueprint(blueprint: Blueprint): Promise<void> {
    this.addItem(blueprint);
  }

  /**
   * 更新藍圖
   */
  async updateBlueprint(id: string, updates: Partial<Blueprint>): Promise<void> {
    this.updateItem(b => b.id === id, updates);
  }

  /**
   * 刪除藍圖（軟刪除）
   */
  async deleteBlueprint(id: string): Promise<void> {
    this.updateItem(b => b.id === id, {
      deleted_at: new Date().toISOString()
    });
  }

  /**
   * 永久移除藍圖
   */
  async removeBlueprint(id: string): Promise<void> {
    this.removeItem(b => b.id === id);
  }
}
```

3. **Service 使用 State Service**

```typescript
// src/app/shared/services/blueprint/blueprint.service.ts

import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BlueprintRepository } from '@core/infra/repository/blueprint.repository';
import { BlueprintStateService } from './blueprint-state.service';
import { ErrorHandlerService } from '@core/error/error-handler.service';
import { Blueprint, CreateBlueprintRequest } from '@core';

@Injectable({
  providedIn: 'root'
})
export class BlueprintService {
  private readonly repository = inject(BlueprintRepository);
  private readonly state = inject(BlueprintStateService);
  private readonly errorHandler = inject(ErrorHandlerService);

  // 暴露 state 的公開介面
  readonly blueprints = this.state.data;
  readonly loading = this.state.loading;
  readonly error = this.state.error;
  readonly activeBlueprints = this.state.activeBlueprints;
  readonly archivedBlueprints = this.state.archivedBlueprints;

  /**
   * 載入所有藍圖
   */
  async loadAll(): Promise<void> {
    try {
      this.state.setLoading(true);
      
      const blueprints = await firstValueFrom(this.repository.findAll());
      await this.state.loadBlueprints(blueprints);
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: 'BlueprintService',
        action: 'loadAll'
      });
      this.state.setError('載入藍圖列表失敗');
    }
  }

  /**
   * 建立藍圖
   */
  async create(request: CreateBlueprintRequest): Promise<Blueprint | null> {
    try {
      this.state.setLoading(true);
      
      const blueprint = await firstValueFrom(this.repository.create(request));
      await this.state.addBlueprint(blueprint);
      
      return blueprint;
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: 'BlueprintService',
        action: 'create',
        metadata: { request }
      });
      this.state.setError('建立藍圖失敗');
      return null;
    }
  }

  /**
   * 更新藍圖
   */
  async update(id: string, updates: Partial<Blueprint>): Promise<boolean> {
    try {
      this.state.setLoading(true);
      
      await firstValueFrom(this.repository.update(id, updates));
      await this.state.updateBlueprint(id, updates);
      
      return true;
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: 'BlueprintService',
        action: 'update',
        metadata: { id, updates }
      });
      this.state.setError('更新藍圖失敗');
      return false;
    }
  }

  /**
   * 刪除藍圖
   */
  async delete(id: string): Promise<boolean> {
    try {
      this.state.setLoading(true);
      
      await firstValueFrom(this.repository.delete(id));
      await this.state.deleteBlueprint(id);
      
      return true;
    } catch (error) {
      this.errorHandler.handleError(error, {
        component: 'BlueprintService',
        action: 'delete',
        metadata: { id }
      });
      this.state.setError('刪除藍圖失敗');
      return false;
    }
  }

  /**
   * 清空狀態
   */
  clear(): void {
    this.state.clear();
  }
}
```

4. **建立狀態管理規範**

```markdown
// docs/conventions/state-management.md

# 狀態管理規範

## 原則

1. 使用 Angular Signals
2. 繼承 BaseStateService
3. 私有可寫，公開唯讀
4. Service 管理業務邏輯，StateService 管理狀態

## 結構

```
Service (業務邏輯)
    ↓ 使用
StateService (狀態管理)
    ↓ 繼承
BaseStateService (基礎狀態模式)
```

## Signal 模式

### 基本狀態

```typescript
// 私有可寫
private readonly dataState = signal<T[]>([]);
private readonly loadingState = signal<boolean>(false);
private readonly errorState = signal<string | null>(null);

// 公開唯讀
readonly data = this.dataState.asReadonly();
readonly loading = this.loadingState.asReadonly();
readonly error = this.errorState.asReadonly();
```

### 計算屬性

```typescript
// 衍生狀態
readonly hasData = computed(() => this.dataState().length > 0);
readonly isEmpty = computed(() => !this.hasData());

// 過濾狀態
readonly activeItems = computed(() =>
  this.dataState().filter(item => item.status === 'active')
);

// 參數化查詢
readonly findById = (id: string) =>
  computed(() => this.dataState().find(item => item.id === id));
```

### 狀態更新

```typescript
// 設定（替換）
this.dataState.set(newData);

// 更新（修改）
this.dataState.update(data => [...data, newItem]);
this.dataState.update(data => data.filter(item => item.id !== id));
this.dataState.update(data => data.map(item => 
  item.id === id ? { ...item, ...updates } : item
));
```

## Effect 使用

謹慎使用 effect，僅用於真正的副作用：

```typescript
constructor() {
  // 自動儲存到 localStorage
  effect(() => {
    const data = this.dataState();
    localStorage.setItem('blueprints', JSON.stringify(data));
  });

  // 自動同步到後端
  effect(() => {
    const data = this.dataState();
    if (data.length > 0) {
      this.syncToBackend(data);
    }
  });
}
```
```

### 驗證清單

- [ ] BaseStateService 已建立
- [ ] 所有 StateService 繼承 BaseStateService
- [ ] Signal 模式一致（私有可寫，公開唯讀）
- [ ] Service 使用 StateService 管理狀態
- [ ] 計算屬性使用 computed
- [ ] effect 僅用於副作用
- [ ] 狀態管理規範文件已建立

---

## 4. UI 元件模式統一

### 問題描述

UI 元件的實作模式不一致，部分使用 OnPush，部分使用 Default。

### 解決方案

#### 統一使用 OnPush Change Detection

**實作步驟**：

1. **建立元件基礎類別**

```typescript
// src/app/shared/base/base.component.ts

import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export abstract class BaseComponent implements OnDestroy {
  protected readonly destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

2. **所有元件繼承 BaseComponent**

```typescript
// src/app/routes/blueprint/list/list.component.ts

import { Component, inject, signal, OnInit } from '@angular/core';
import { BaseComponent } from '@shared/base/base.component';
import { BlueprintService } from '@shared/services/blueprint';
import { Blueprint } from '@core';

@Component({
  selector: 'app-blueprint-list',
  standalone: true,
  imports: [/* ... */],
  template: `
    <nz-spin [nzSpinning]="loading()">
      <!-- 內容 -->
    </nz-spin>
  `,
  // changeDetection 已在 BaseComponent 設定為 OnPush
})
export class BlueprintListComponent extends BaseComponent implements OnInit {
  private readonly blueprintService = inject(BlueprintService);

  // 使用 Signal 確保響應式更新
  blueprints = this.blueprintService.blueprints;
  loading = this.blueprintService.loading;

  async ngOnInit(): Promise<void> {
    await this.blueprintService.loadAll();
  }
}
```

3. **建立 UI 元件規範**

```markdown
// docs/conventions/component-patterns.md

# 元件模式規範

## 原則

1. 使用 OnPush Change Detection
2. 使用 Signals 進行狀態管理
3. 繼承 BaseComponent
4. Standalone Components

## 元件結構

```typescript
@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [CommonModule, /* ... */],
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush // 必須
})
export class FeatureComponent extends BaseComponent implements OnInit {
  // 依賴注入
  private readonly service = inject(Service);

  // Signal 狀態
  data = signal<Data[]>([]);
  loading = signal(false);

  // 計算屬性
  filteredData = computed(() => 
    this.data().filter(item => item.active)
  );

  // 生命週期
  ngOnInit(): void {
    this.loadData();
  }

  // 方法
  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.service.getData();
      this.data.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  // BaseComponent 會自動處理 ngOnDestroy
}
```

## 為什麼使用 OnPush

1. **效能提升** - 減少不必要的變更檢測
2. **可預測性** - 明確的更新觸發點
3. **Signal 兼容** - 與 Signals 完美配合
4. **最佳實踐** - Angular 推薦模式

## Signal vs Observable

### 使用 Signal（推薦）

```typescript
// 簡單狀態
data = signal<Data[]>([]);

// 使用
this.data.set(newData);
const currentData = this.data();
```

### 使用 Observable

```typescript
// 複雜的非同步流程
data$ = this.service.getData().pipe(
  debounceTime(300),
  switchMap(id => this.service.getDetails(id)),
  catchError(() => of([]))
);

// 在模板中使用 async pipe
// <div *ngFor="let item of data$ | async">
```

## 模板最佳實踐

```html
<!-- 使用 Signal 的控制流程語法 -->
@if (loading()) {
  <nz-spin></nz-spin>
} @else if (data().length > 0) {
  @for (item of data(); track item.id) {
    <div>{{ item.name }}</div>
  }
} @else {
  <nz-empty></nz-empty>
}
```
```

### 驗證清單

- [ ] BaseComponent 已建立
- [ ] 所有元件使用 OnPush
- [ ] 所有元件繼承 BaseComponent
- [ ] 所有元件使用 Signal
- [ ] 模板使用新的控制流程語法
- [ ] UI 元件規範文件已建立

---

## 5. 資料轉換統一

### 問題描述

資料轉換邏輯分散，缺乏統一的轉換層。

### 解決方案

#### 建立 Mapper 層

**實作步驟**：

1. **建立 Mapper 介面**

```typescript
// src/app/core/infra/mapper/mapper.interface.ts

export interface Mapper<Domain, Dto> {
  /**
   * DTO 轉 Domain
   */
  toDomain(dto: Dto): Domain;

  /**
   * DTO 陣列轉 Domain 陣列
   */
  toDomainList(dtos: Dto[]): Domain[];

  /**
   * Domain 轉 DTO
   */
  toDto(domain: Domain): Dto;

  /**
   * Domain 陣列轉 DTO 陣列
   */
  toDtoList(domains: Domain[]): Dto[];
}
```

2. **實作具體的 Mapper**

```typescript
// src/app/core/infra/mapper/blueprint.mapper.ts

import { Injectable } from '@angular/core';
import { Mapper } from './mapper.interface';
import { Blueprint, BlueprintDto } from '../types/blueprint';

@Injectable({
  providedIn: 'root'
})
export class BlueprintMapper implements Mapper<Blueprint, BlueprintDto> {
  /**
   * DTO 轉 Domain
   */
  toDomain(dto: BlueprintDto): Blueprint {
    return {
      id: dto.id,
      ownerId: dto.owner_id,
      name: dto.name,
      slug: dto.slug,
      description: dto.description || undefined,
      coverUrl: dto.cover_url || undefined,
      isPublic: dto.is_public,
      status: dto.status,
      enabledModules: dto.enabled_modules || [],
      createdAt: dto.created_at ? new Date(dto.created_at) : undefined,
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : undefined,
      deletedAt: dto.deleted_at ? new Date(dto.deleted_at) : undefined
    };
  }

  /**
   * DTO 陣列轉 Domain 陣列
   */
  toDomainList(dtos: BlueprintDto[]): Blueprint[] {
    return dtos.map(dto => this.toDomain(dto));
  }

  /**
   * Domain 轉 DTO
   */
  toDto(domain: Blueprint): BlueprintDto {
    return {
      id: domain.id,
      owner_id: domain.ownerId,
      name: domain.name,
      slug: domain.slug,
      description: domain.description || null,
      cover_url: domain.coverUrl || null,
      is_public: domain.isPublic,
      status: domain.status,
      enabled_modules: domain.enabledModules,
      created_at: domain.createdAt?.toISOString(),
      updated_at: domain.updatedAt?.toISOString(),
      deleted_at: domain.deletedAt?.toISOString() || null
    };
  }

  /**
   * Domain 陣列轉 DTO 陣列
   */
  toDtoList(domains: Blueprint[]): BlueprintDto[] {
    return domains.map(domain => this.toDto(domain));
  }
}
```

3. **在 Repository 中使用 Mapper**

```typescript
// src/app/core/infra/repository/blueprint.repository.ts

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { BaseRepository } from './base.repository';
import { Blueprint, BlueprintDto } from '../types/blueprint';
import { BlueprintMapper } from '../mapper/blueprint.mapper';

@Injectable({
  providedIn: 'root'
})
export class BlueprintRepository extends BaseRepository<BlueprintDto> {
  protected readonly tableName = 'blueprints';
  private readonly mapper = inject(BlueprintMapper);

  /**
   * 查詢所有藍圖（返回 Domain 物件）
   */
  override findAll(): Observable<Blueprint[]> {
    return from(
      this.supabase
        .from(this.tableName)
        .select('*')
        .then(({ data, error }) => {
          if (error) throw error;
          return this.mapper.toDomainList(data as BlueprintDto[]);
        })
    );
  }

  /**
   * 根據 ID 查詢藍圖（返回 Domain 物件）
   */
  override findById(id: string): Observable<Blueprint | null> {
    return from(
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return this.mapper.toDomain(data as BlueprintDto);
        })
    );
  }

  /**
   * 建立藍圖（接受 Domain 物件）
   */
  createBlueprint(blueprint: Partial<Blueprint>): Observable<Blueprint> {
    const dto = this.mapper.toDto(blueprint as Blueprint);
    
    return from(
      this.supabase
        .from(this.tableName)
        .insert(dto)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return this.mapper.toDomain(data as BlueprintDto);
        })
    );
  }
}
```

4. **建立資料轉換規範**

```markdown
// docs/conventions/data-mapping.md

# 資料轉換規範

## 原則

1. 使用 Mapper 進行資料轉換
2. Domain 物件用於業務邏輯層
3. DTO 物件用於資料傳輸
4. Repository 負責轉換

## 轉換流程

```
資料庫 (snake_case)
    ↓ (DTO)
Repository + Mapper
    ↓ (Domain camelCase)
Service (業務邏輯)
    ↓
Component (UI)
```

## 命名規範

### DTO (Data Transfer Object)

- 與資料庫欄位一致
- 使用 snake_case
- 可為 null
- 使用 interface

```typescript
interface BlueprintDto {
  id: string;
  owner_id: string;
  created_at: string | null;
  is_public: boolean;
}
```

### Domain

- 業務邏輯使用
- 使用 camelCase
- 不允許 null（使用 undefined）
- 使用 interface 或 class

```typescript
interface Blueprint {
  id: string;
  ownerId: string;
  createdAt?: Date;
  isPublic: boolean;
}
```

## Mapper 實作

```typescript
@Injectable({ providedIn: 'root' })
export class EntityMapper implements Mapper<Domain, Dto> {
  toDomain(dto: Dto): Domain {
    return {
      // 轉換邏輯
      // - snake_case → camelCase
      // - null → undefined
      // - string → Date
    };
  }

  toDto(domain: Domain): Dto {
    return {
      // 轉換邏輯
      // - camelCase → snake_case
      // - undefined → null
      // - Date → ISO string
    };
  }

  toDomainList(dtos: Dto[]): Domain[] {
    return dtos.map(dto => this.toDomain(dto));
  }

  toDtoList(domains: Domain[]): Dto[] {
    return domains.map(domain => this.toDto(domain));
  }
}
```
```

### 驗證清單

- [ ] Mapper 介面已定義
- [ ] 所有 Entity Mapper 已實作
- [ ] Repository 使用 Mapper 轉換資料
- [ ] Domain 物件使用 camelCase
- [ ] DTO 物件使用 snake_case
- [ ] 資料轉換規範文件已建立

---

## 總結

完成以上所有統一性改進後，專案將達到：

### 改進效果

1. **API 呼叫統一** - 清晰的三層架構
2. **表單驗證統一** - 一致的驗證器和錯誤訊息
3. **狀態管理統一** - 標準的 Signal 模式
4. **UI 元件統一** - OnPush + Signals
5. **資料轉換統一** - Mapper 層處理轉換

### 實施順序建議

1. API 呼叫模式（P0 - 基礎架構）
2. 資料轉換（P0 - 配合 API 架構）
3. 狀態管理模式（P1 - 依賴 API 架構）
4. 表單驗證（P1 - 獨立模組）
5. UI 元件模式（P2 - 漸進式改進）

### 預期效果

- ✅ 程式碼可讀性提升 50%
- ✅ 新人上手時間減少 40%
- ✅ Bug 發生率降低 30%
- ✅ 開發效率提升 35%

---

**文件版本**: 1.0.0  
**最後更新**: 2025-12-08  
**下次審查**: 完成實施後

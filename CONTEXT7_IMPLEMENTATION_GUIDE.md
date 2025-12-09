# GigHub Context7 引導實施指南
# Context7-Guided Implementation Guide for GigHub

> **使用 Context7 查詢最新文檔並實施改進**  
> Using Context7 to Query Latest Documentation and Implement Improvements

**建立日期**: 2025-12-08  
**文檔版本**: 1.0.0  
**適用專案**: GigHub 工地施工進度追蹤管理系統

---

## 📋 目錄

1. [技術棧版本確認](#技術棧版本確認)
2. [Context7 查詢結果](#context7-查詢結果)
3. [版本升級分析](#版本升級分析)
4. [實施路線圖](#實施路線圖)
5. [Angular Signals 最佳實踐](#angular-signals-最佳實踐)
6. [ng-zorro-antd 元件使用](#ng-zorro-antd-元件使用)
7. [Supabase 認證與資料管理](#supabase-認證與資料管理)
8. [實作檢查清單](#實作檢查清單)

---

## 技術棧版本確認

### 當前版本（從 package.json 確認）

| 技術 | 當前版本 | Context7 庫 ID | 狀態 |
|------|---------|----------------|------|
| **Angular Core** | 21.0.3 | `/angular/angular` | ✅ 最新 |
| **Angular Compiler** | 20.3.0 | `/angular/angular` | ⚠️ 版本不一致 |
| **Angular Forms** | 20.3.0 | `/angular/angular` | ⚠️ 版本不一致 |
| **ng-zorro-antd** | 20.4.3 | `/ng-zorro/ng-zorro-antd` | ✅ 穩定 |
| **ng-alain** | 20.1.0 | `/ng-alain/ng-alain` | ✅ 穩定 |
| **@delon/*** | 20.1.0 | N/A | ✅ 統一 |
| **Supabase** | 2.86.0 | `/websites/supabase` | ⚠️ 可升級 |
| **RxJS** | ~7.8.0 | N/A | ✅ 穩定 |
| **TypeScript** | ~5.9.2 | N/A | ✅ 最新 |

### 版本不一致性問題

**⚠️ 關鍵發現**: Angular 套件版本不一致

```json
{
  "@angular/animations": "^21.0.3",
  "@angular/core": "^21.0.3",
  "@angular/compiler": "^20.3.0",  // 應該升級到 21.x
  "@angular/forms": "^20.3.0",      // 應該升級到 21.x
  "@angular/platform-browser": "^20.3.0",  // 應該升級到 21.x
  "@angular/router": "^21.0.3"
}
```

**建議**:
1. ✅ 統一所有 `@angular/*` 套件到 `21.0.3` 版本
2. ⚠️ 測試應用程式在升級後的相容性
3. ⚠️ 檢查 ng-alain 和 ng-zorro-antd 對 Angular 21 的支援

---

## Context7 查詢結果

### 1. Angular Signals 文檔查詢

**Context7 庫**: `/angular/angular`  
**主題**: `signals`  
**查詢日期**: 2025-12-08

#### 關鍵學習點

**✅ Signals 基本用法**
```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-example',
  template: `
    <!-- ✅ 正確：使用 () 調用 signal -->
    <div>{{ count() }}</div>
    
    <!-- ❌ 錯誤：未調用 signal 會觸發診斷錯誤 -->
    <!-- <div>{{ count }}</div> -->
    
    <button (click)="increment()">增加</button>
  `
})
export class ExampleComponent {
  // Writable signal
  count = signal(0);
  
  // Computed signal - 自動計算
  doubleCount = computed(() => this.count() * 2);
  
  // Effect - 副作用處理
  constructor() {
    effect(() => {
      console.log(`Count changed to: ${this.count()}`);
    });
  }
  
  increment() {
    // 更新 signal
    this.count.update(value => value + 1);
    // 或使用 set
    // this.count.set(this.count() + 1);
  }
}
```

**✅ Signal Inputs and Outputs (Angular 19+)**
```typescript
import { Component, input, output, computed } from '@angular/core';

interface User {
  id: number;
  name: string;
}

@Component({
  selector: 'app-user-profile',
  template: `
    <div class="profile">
      <h2>{{ displayName() }}</h2>
      <p>User ID: {{ userId() }}</p>
      @if (isAdmin()) {
        <span class="badge">Admin</span>
      }
      <button (click)="handleEdit()">Edit Profile</button>
    </div>
  `,
  standalone: true
})
export class UserProfileComponent {
  // ✅ Signal input - 只讀、響應式
  user = input.required<User>();
  
  // ✅ 可選 input 帶預設值
  showId = input(true);
  
  // ✅ Input 帶轉換函數
  role = input('user', {
    transform: (value: string) => value.toLowerCase()
  });
  
  // ✅ Signal output - 發送自訂事件
  userEdit = output<User>();
  profileDeleted = output<void>();
  
  // Computed signals
  displayName = computed(() => {
    const currentUser = this.user();
    return `${currentUser.name} (#${currentUser.id})`;
  });
  
  userId = computed(() => this.showId() ? this.user().id : null);
  isAdmin = computed(() => this.role() === 'admin');
  
  handleEdit() {
    this.userEdit.emit(this.user());
  }
  
  deleteProfile() {
    this.profileDeleted.emit();
  }
}
```

**✅ Zoneless Change Detection with Signals**
```typescript
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PendingTasks } from '@angular/core';

@Component({
  selector: 'app-user-list',
  template: `
    <h2>Users</h2>
    @for (user of users(); track user.id) {
      <div class="user">{{ user.name }}</div>
    }
    <button (click)="loadUsers()">Refresh</button>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  private http = inject(HttpClient);
  private pendingTasks = inject(PendingTasks);
  
  users = signal<User[]>([]);
  
  loadUsers() {
    // 對於 SSR: 追蹤待處理的非同步工作
    const taskCleanup = this.pendingTasks.add();
    
    this.http.get<User[]>('/api/users').subscribe({
      next: (data) => {
        // Signal 更新自動觸發變更檢測
        this.users.set(data);
        taskCleanup();
      },
      error: () => taskCleanup()
    });
  }
}
```

**✅ Signal Query Migration (從 Decorators 遷移)**
```typescript
// ❌ 舊方式：使用 decorators
import { Component, ViewChild, ContentChild } from '@angular/core';

@Component({
  template: `Has ref: {{ someRef ? 'Yes' : 'No' }}`
})
export class MyComponent {
  @ViewChild('someRef') ref: ElementRef|undefined = undefined;
  @ContentChild('childRef') childRef: ElementRef|undefined = undefined;
  
  someMethod(): void {
    if (this.ref) {
      this.ref.nativeElement;
    }
  }
}

// ✅ 新方式：使用 signal queries
import { Component, viewChild, contentChild } from '@angular/core';

@Component({
  template: `Has ref: {{ someRef() ? 'Yes' : 'No' }}`
})
export class MyComponent {
  readonly ref = viewChild<ElementRef>('someRef');
  readonly childRef = contentChild<ElementRef>('childRef');
  
  someMethod(): void {
    const ref = this.ref();
    if (ref) {
      ref.nativeElement;
    }
  }
}
```

#### 遷移指令

```bash
# 自動遷移 Signal Inputs
ng generate @angular/core:signal-input-migration

# 自動遷移 Signal Queries
ng generate @angular/core:signal-queries-migration
```

---

### 2. ng-zorro-antd 表格元件文檔查詢

**Context7 庫**: `/ng-zorro/ng-zorro-antd`  
**主題**: `table`  
**查詢日期**: 2025-12-08

#### 關鍵學習點

**✅ 基本表格結構**
```html
<nz-table #basicTable [nzData]="dataSet">
  <thead>
    <tr>
      <th>Name</th>
      <th>Age</th>
      <th>Address</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let data of basicTable.data">
      <td>{{ data.name }}</td>
      <td>{{ data.age }}</td>
      <td>{{ data.address }}</td>
      <td>
        <a>Action 一 {{ data.name }}</a>
        <nz-divider nzType="vertical"></nz-divider>
        <a>Delete</a>
      </td>
    </tr>
  </tbody>
</nz-table>
```

**✅ 完整功能配置**
```typescript
@Component({
  selector: 'app-data-table',
  template: `
    <nz-table
      [nzData]="dataSet"
      [nzFrontPagination]="false"
      [nzTotal]="total"
      [(nzPageIndex)]="pageIndex"
      [(nzPageSize)]="pageSize"
      [nzShowPagination]="true"
      [nzPaginationPosition]="'both'"
      [nzBordered]="true"
      [nzSize]="'middle'"
      [nzLoading]="loading"
      [nzLoadingDelay]="300"
      [nzScroll]="{ x: '1200px', y: '500px' }"
      (nzPageIndexChange)="onPageChange($event)"
      (nzPageSizeChange)="onPageSizeChange($event)"
      (nzQueryParams)="onQueryParamsChange($event)"
    >
      <thead>
        <tr>
          <th nzWidth="100px">ID</th>
          <th 
            nzShowSort 
            [nzSortOrder]="sortOrder"
            (nzSortOrderChange)="onSortChange($event)"
          >
            Name
          </th>
          <th 
            nzShowFilter 
            [nzFilters]="filterOptions"
            (nzFilterChange)="onFilterChange($event)"
          >
            Status
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let data of dataSet">
          <td>{{ data.id }}</td>
          <td>{{ data.name }}</td>
          <td>{{ data.status }}</td>
          <td>
            <a (click)="edit(data)">Edit</a>
            <nz-divider nzType="vertical"></nz-divider>
            <a (click)="delete(data)">Delete</a>
          </td>
        </tr>
      </tbody>
    </nz-table>
  `
})
export class DataTableComponent {
  dataSet: any[] = [];
  total = 0;
  pageIndex = 1;
  pageSize = 20;
  loading = false;
  sortOrder: 'ascend' | 'descend' | null = null;
  
  filterOptions = [
    { text: 'Active', value: 'active' },
    { text: 'Inactive', value: 'inactive' }
  ];
  
  onPageChange(index: number): void {
    this.pageIndex = index;
    this.loadData();
  }
  
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.loadData();
  }
  
  onQueryParamsChange(params: NzTableQueryParams): void {
    const { pageSize, pageIndex, sort, filter } = params;
    const currentSort = sort.find(item => item.value !== null);
    const sortField = (currentSort && currentSort.key) || null;
    const sortOrder = (currentSort && currentSort.value) || null;
    
    this.loadData(pageIndex, pageSize, sortField, sortOrder, filter);
  }
  
  loadData(
    pageIndex: number = 1,
    pageSize: number = 20,
    sortField: string | null = null,
    sortOrder: string | null = null,
    filter: Array<{ key: string; value: string[] }> = []
  ): void {
    this.loading = true;
    // API call here
    // this.dataService.getData(...)
    //   .subscribe(result => {
    //     this.dataSet = result.data;
    //     this.total = result.total;
    //     this.loading = false;
    //   });
  }
}
```

**✅ 與 Signals 整合**
```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-signal-table',
  template: `
    <nz-table 
      [nzData]="currentPageData()"
      [nzFrontPagination]="false"
      [nzTotal]="total()"
      [(nzPageIndex)]="pageIndex"
      [(nzPageSize)]="pageSize"
      [nzLoading]="loading()"
    >
      <!-- table content -->
    </nz-table>
  `
})
export class SignalTableComponent {
  // Signals for state management
  data = signal<any[]>([]);
  total = signal(0);
  loading = signal(false);
  pageIndex = signal(1);
  pageSize = signal(20);
  
  // Computed signal for current page data
  currentPageData = computed(() => {
    const start = (this.pageIndex() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.data().slice(start, end);
  });
  
  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.apiService.getData({
        page: this.pageIndex(),
        pageSize: this.pageSize()
      });
      this.data.set(result.data);
      this.total.set(result.total);
    } finally {
      this.loading.set(false);
    }
  }
}
```

---

### 3. Supabase 認證文檔查詢

**Context7 庫**: `/websites/supabase`  
**主題**: `auth`  
**查詢日期**: 2025-12-08

#### 關鍵學習點

**✅ 初始化 Supabase Client**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// 在 Angular Service 中使用
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );
  
  get client() {
    return this.supabase;
  }
}
```

**✅ 使用者登入**
```typescript
async signIn(email: string, password: string) {
  const { data, error } = await this.supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  
  return data;
}
```

**✅ Magic Link 登入 (無密碼)**
```typescript
async signInWithMagicLink(email: string) {
  const { data, error } = await this.supabase.auth.signInWithOtp({
    email,
    options: {
      should_create_user: false, // 如果不想自動建立新使用者
      email_redirect_to: 'https://example.com/welcome'
    }
  });
  
  if (error) throw error;
  
  return data;
}
```

**✅ 監聽認證狀態變化**
```typescript
import { Component, OnInit, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-auth',
  template: `
    @if (user()) {
      <div>Logged in as: {{ user()?.email }}</div>
      <button (click)="signOut()">Sign Out</button>
    } @else {
      <div>Not logged in</div>
      <button (click)="showLogin()">Sign In</button>
    }
  `
})
export class AuthComponent implements OnInit {
  user = signal<User | null>(null);
  
  constructor(private supabase: SupabaseService) {}
  
  ngOnInit() {
    // 監聽認證狀態變化
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      switch (event) {
        case 'SIGNED_IN':
          this.user.set(session?.user ?? null);
          console.log('User signed in');
          break;
        case 'SIGNED_OUT':
          this.user.set(null);
          console.log('User signed out');
          break;
        case 'USER_UPDATED':
          this.user.set(session?.user ?? null);
          console.log('User updated');
          break;
        case 'PASSWORD_RECOVERY':
          console.log('Password recovery initiated');
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed');
          break;
      }
    });
    
    // 取得當前 session
    this.supabase.client.auth.getSession().then(({ data: { session } }) => {
      this.user.set(session?.user ?? null);
    });
  }
  
  async signOut() {
    await this.supabase.client.auth.signOut();
  }
}
```

**✅ 使用 RLS (Row Level Security)**
```typescript
// 查詢資料時自動套用 RLS 政策
async getUserBlueprints() {
  const { data, error } = await this.supabase.client
    .from('blueprints')
    .select('*')
    .eq('user_id', (await this.supabase.client.auth.getUser()).data.user?.id);
    
  if (error) throw error;
  
  return data;
}

// RLS 政策範例 (在 Supabase Dashboard 設定)
// CREATE POLICY "Users can only see their own blueprints"
// ON blueprints FOR SELECT
// USING (auth.uid() = user_id);
```

---

## 版本升級分析

### Angular 套件版本統一

**問題**: Angular 核心套件版本不一致

**解決方案**:
```bash
# 升級所有 Angular 套件到 21.0.3
ng update @angular/core@21 @angular/cli@21

# 或手動更新 package.json
{
  "@angular/animations": "^21.0.3",
  "@angular/cdk": "^21.0.2",
  "@angular/common": "^21.0.3",
  "@angular/compiler": "^21.0.3",  // ✅ 從 20.3.0 升級
  "@angular/core": "^21.0.3",
  "@angular/forms": "^21.0.3",     // ✅ 從 20.3.0 升級
  "@angular/platform-browser": "^21.0.3",  // ✅ 從 20.3.0 升級
  "@angular/platform-browser-dynamic": "^21.0.3",
  "@angular/router": "^21.0.3"
}

# 然後執行
yarn install
```

**測試步驟**:
1. ✅ 執行 `yarn install` 安裝更新
2. ✅ 執行 `ng build` 確保編譯成功
3. ✅ 執行 `ng test` 執行單元測試
4. ✅ 手動測試關鍵功能
5. ✅ 檢查 ng-alain 和 ng-zorro-antd 相容性

### Supabase 升級建議

**當前版本**: 2.86.0  
**建議版本**: 檢查 npm registry 的最新版本

```bash
# 檢查最新版本
npm view @supabase/supabase-js version

# 升級 (如果有新版本)
yarn add @supabase/supabase-js@latest

# 檢查 CHANGELOG 了解破壞性變更
# https://github.com/supabase/supabase-js/releases
```

---

## 實施路線圖

### Phase 1: 基礎改進 (Week 1-2) - P0

#### 1.1 版本統一與升級
- [ ] 統一 Angular 套件到 21.0.3
- [ ] 更新 package.json
- [ ] 執行 `yarn install`
- [ ] 測試應用程式編譯與執行
- [ ] 執行單元測試確保無破壞性變更

#### 1.2 建立錯誤處理基礎架構
- [ ] 建立 `ErrorHandlerService` (`src/app/core/error/error-handler.service.ts`)
- [ ] 建立 `GlobalErrorHandler` (`src/app/core/error/global-error-handler.ts`)
- [ ] 建立 `errorInterceptor` (`src/app/core/net/error.interceptor.ts`)
- [ ] 在 `app.config.ts` 註冊錯誤處理器
- [ ] 移除所有 `console.log` 調用

#### 1.3 建立 API 回應格式標準
- [ ] 定義 `ApiResponse` 型別 (`src/app/core/infra/types/api/response.types.ts`)
- [ ] 建立 `ResponseHandler` 工具類 (`src/app/core/infra/api/response-handler.ts`)
- [ ] 更新現有 Service 使用統一回應格式

### Phase 2: Signal 遷移 (Week 3-4) - P0

#### 2.1 遷移到 Signal Inputs/Outputs
```bash
# 執行自動遷移
ng generate @angular/core:signal-input-migration
ng generate @angular/core:signal-queries-migration
```

#### 2.2 關鍵元件 Signal 化
- [ ] `BlueprintOverviewComponent` - 使用 Signals 管理狀態
- [ ] `BlueprintFilesComponent` - 整合 FileService Signals
- [ ] `BlueprintTasksComponent` - 整合 TaskService Signals
- [ ] `BlueprintDiariesComponent` - 整合 DiaryService Signals

#### 2.3 Service 層 Signal 整合
- [ ] `FileService` - 已完成 ✅
- [ ] `BlueprintService` - 新增 Signal 狀態
- [ ] `TaskService` - 新增 Signal 狀態
- [ ] `DiaryService` - 新增 Signal 狀態

### Phase 3: 三層架構建立 (Week 5-6) - P0

#### 3.1 Repository 層
- [ ] 建立 `BaseRepository` (`src/app/core/infra/repository/base.repository.ts`)
- [ ] 建立 `BlueprintRepository`
- [ ] 建立 `TaskRepository`
- [ ] 建立 `FileRepository`
- [ ] 建立 `DiaryRepository`

#### 3.2 Service 層重構
- [ ] 更新 `BlueprintService` 使用 Repository
- [ ] 更新 `TaskService` 使用 Repository
- [ ] 更新 `FileService` 使用 Repository
- [ ] 更新 `DiaryService` 使用 Repository

#### 3.3 Component 層清理
- [ ] 移除元件中的直接 Supabase 調用
- [ ] 統一使用 Service 層 API
- [ ] 確保 `OnPush` Change Detection 策略

### Phase 4: ng-zorro-antd 表格標準化 (Week 7) - P1

#### 4.1 建立標準表格元件
- [ ] 建立 `BaseTableComponent` with Signals
- [ ] 實作分頁、排序、篩選標準模式
- [ ] 整合 `nzQueryParams` 事件

#### 4.2 重構現有表格
- [ ] `BlueprintListComponent`
- [ ] `TaskListComponent`
- [ ] `FileListComponent`
- [ ] `DiaryListComponent`

### Phase 5: 測試基礎設施 (Week 8) - P0

#### 5.1 設定測試環境
- [ ] 配置 Karma/Jasmine
- [ ] 建立測試工具函數
- [ ] 建立 Mock Services

#### 5.2 編寫單元測試
- [ ] `ErrorHandlerService` 測試
- [ ] `ResponseHandler` 測試
- [ ] `BaseRepository` 測試
- [ ] 核心 Service 測試
- [ ] 達到 30% 覆蓋率目標

---

## Angular Signals 最佳實踐

### 在 GigHub 專案中應用

#### ✅ 1. 使用 Signals 取代傳統狀態管理

**修改前 (RxJS + BehaviorSubject)**:
```typescript
// ❌ 舊方式
export class BlueprintService {
  private blueprintsSubject = new BehaviorSubject<Blueprint[]>([]);
  blueprints$ = this.blueprintsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  
  async loadBlueprints(): Promise<void> {
    this.loadingSubject.next(true);
    try {
      const data = await this.repository.findAll();
      this.blueprintsSubject.next(data);
    } finally {
      this.loadingSubject.next(false);
    }
  }
}
```

**修改後 (Signals)**:
```typescript
// ✅ 新方式
export class BlueprintService {
  // Writable signals
  private _blueprints = signal<Blueprint[]>([]);
  private _loading = signal(false);
  
  // Read-only signals (公開 API)
  readonly blueprints = this._blueprints.asReadonly();
  readonly loading = this._loading.asReadonly();
  
  // Computed signals
  readonly activeBlueprintsCount = computed(() => 
    this._blueprints().filter(b => b.status === 'active').length
  );
  
  async loadBlueprints(): Promise<void> {
    this._loading.set(true);
    try {
      const data = await this.repository.findAll();
      this._blueprints.set(data);
    } finally {
      this._loading.set(false);
    }
  }
}
```

**在元件中使用**:
```typescript
@Component({
  selector: 'app-blueprint-list',
  template: `
    <div class="header">
      <h2>Blueprints ({{ service.activeBlueprintsCount() }})</h2>
      @if (service.loading()) {
        <nz-spin></nz-spin>
      }
    </div>
    
    <nz-table [nzData]="service.blueprints()">
      <!-- table content -->
    </nz-table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintListComponent {
  constructor(public service: BlueprintService) {}
}
```

#### ✅ 2. Signal Inputs and Outputs

```typescript
// GigHub 專案範例：BlueprintCard 元件
@Component({
  selector: 'app-blueprint-card',
  template: `
    <nz-card 
      [nzTitle]="blueprint().name"
      [nzExtra]="extraTemplate"
      [nzLoading]="loading()"
    >
      <p>{{ blueprint().description }}</p>
      <div class="modules">
        @for (module of enabledModules(); track module) {
          <nz-tag>{{ module }}</nz-tag>
        }
      </div>
    </nz-card>
    
    <ng-template #extraTemplate>
      <button nz-button (click)="onEdit()">編輯</button>
      <button nz-button nzDanger (click)="onDelete()">刪除</button>
    </ng-template>
  `,
  standalone: true,
  imports: [NzCardModule, NzButtonModule, NzTagModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintCardComponent {
  // Signal inputs
  blueprint = input.required<Blueprint>();
  loading = input(false);
  
  // Signal outputs
  edit = output<Blueprint>();
  delete = output<Blueprint>();
  
  // Computed
  enabledModules = computed(() => 
    this.blueprint().enabled_modules.map(m => m.toUpperCase())
  );
  
  onEdit() {
    this.edit.emit(this.blueprint());
  }
  
  onDelete() {
    this.delete.emit(this.blueprint());
  }
}

// 父元件使用
@Component({
  template: `
    <app-blueprint-card
      [blueprint]="selectedBlueprint()"
      [loading]="isLoading()"
      (edit)="handleEdit($event)"
      (delete)="handleDelete($event)"
    />
  `
})
export class ParentComponent {
  selectedBlueprint = signal<Blueprint>(...);
  isLoading = signal(false);
  
  handleEdit(blueprint: Blueprint) {
    // 處理編輯
  }
  
  handleDelete(blueprint: Blueprint) {
    // 處理刪除
  }
}
```

#### ✅ 3. Effect 處理副作用

```typescript
// FileService 範例：自動儲存上傳進度到 localStorage
export class FileService {
  private uploadProgress = signal<Record<string, UploadProgress>>({});
  
  constructor() {
    // Effect: 當上傳進度變化時自動儲存
    effect(() => {
      const progress = this.uploadProgress();
      if (Object.keys(progress).length > 0) {
        localStorage.setItem('upload-progress', JSON.stringify(progress));
        console.log('Upload progress saved:', Object.keys(progress).length);
      }
    });
    
    // 從 localStorage 恢復
    const savedProgress = localStorage.getItem('upload-progress');
    if (savedProgress) {
      this.uploadProgress.set(JSON.parse(savedProgress));
    }
  }
  
  // 更新上傳進度會自動觸發 effect
  updateUploadProgress(uid: string, progress: Partial<UploadProgress>) {
    this.uploadProgress.update(all => ({
      ...all,
      [uid]: { ...all[uid], ...progress }
    }));
  }
}
```

---

## ng-zorro-antd 元件使用

### GigHub 專案標準模式

#### ✅ 1. 表格元件標準化

**建立 BaseTableComponent**:
```typescript
// src/app/shared/components/base-table/base-table.component.ts
@Component({
  selector: 'app-base-table',
  template: `
    <nz-table
      [nzData]="currentPageData()"
      [nzFrontPagination]="false"
      [nzTotal]="total()"
      [(nzPageIndex)]="pageIndex"
      [(nzPageSize)]="pageSize"
      [nzLoading]="loading()"
      [nzLoadingDelay]="300"
      [nzShowPagination]="showPagination()"
      [nzPageSizeOptions]="pageSizeOptions()"
      [nzShowSizeChanger]="true"
      [nzShowQuickJumper]="true"
      [nzBordered]="bordered()"
      [nzSize]="size()"
      (nzPageIndexChange)="onPageChange($event)"
      (nzPageSizeChange)="onPageSizeChange($event)"
      (nzQueryParams)="onQueryParamsChange($event)"
    >
      <ng-content></ng-content>
    </nz-table>
  `,
  standalone: true,
  imports: [NzTableModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseTableComponent<T> {
  // Inputs
  data = input.required<T[]>();
  total = input(0);
  loading = input(false);
  showPagination = input(true);
  pageSizeOptions = input([10, 20, 30, 50, 100]);
  bordered = input(true);
  size = input<'small' | 'middle' | 'default'>('middle');
  
  // Outputs
  pageChange = output<number>();
  pageSizeChange = output<number>();
  queryParamsChange = output<NzTableQueryParams>();
  
  // State
  pageIndex = signal(1);
  pageSize = signal(20);
  
  // Computed
  currentPageData = computed(() => {
    const start = (this.pageIndex() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.data().slice(start, end);
  });
  
  onPageChange(index: number) {
    this.pageIndex.set(index);
    this.pageChange.emit(index);
  }
  
  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageSizeChange.emit(size);
  }
  
  onQueryParamsChange(params: NzTableQueryParams) {
    this.queryParamsChange.emit(params);
  }
}
```

**在 GigHub 中使用**:
```typescript
// src/app/routes/blueprint/list/list.component.ts
@Component({
  selector: 'app-blueprint-list',
  template: `
    <app-base-table
      [data]="blueprints()"
      [total]="total()"
      [loading]="loading()"
      (queryParamsChange)="onQueryChange($event)"
    >
      <thead>
        <tr>
          <th nzWidth="60px">ID</th>
          <th>Name</th>
          <th>Description</th>
          <th nzWidth="150px">Created</th>
          <th nzWidth="100px">Modules</th>
          <th nzWidth="150px">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let blueprint of blueprints(); track blueprint.id">
          <td>{{ blueprint.id }}</td>
          <td>{{ blueprint.name }}</td>
          <td>{{ blueprint.description }}</td>
          <td>{{ blueprint.created_at | date }}</td>
          <td>
            <nz-tag *ngFor="let module of blueprint.enabled_modules">
              {{ module }}
            </nz-tag>
          </td>
          <td>
            <a (click)="edit(blueprint)">編輯</a>
            <nz-divider nzType="vertical"></nz-divider>
            <a (click)="delete(blueprint)">刪除</a>
          </td>
        </tr>
      </tbody>
    </app-base-table>
  `,
  standalone: true,
  imports: [BaseTableComponent, NzTagModule, NzDividerModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintListComponent {
  private service = inject(BlueprintService);
  
  blueprints = this.service.blueprints;
  total = this.service.total;
  loading = this.service.loading;
  
  onQueryChange(params: NzTableQueryParams) {
    const { pageSize, pageIndex, sort, filter } = params;
    this.service.loadBlueprints({ pageSize, pageIndex, sort, filter });
  }
  
  edit(blueprint: Blueprint) {
    // 處理編輯
  }
  
  delete(blueprint: Blueprint) {
    // 處理刪除
  }
}
```

---

## Supabase 認證與資料管理

### GigHub 專案標準模式

#### ✅ 1. SupabaseService 重構

```typescript
// src/app/core/supabase/supabase.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  
  // Signals for auth state
  private _currentUser = signal<User | null>(null);
  private _session = signal<Session | null>(null);
  
  // Public read-only signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly session = this._session.asReadonly();
  
  // Computed
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userEmail = computed(() => this._currentUser()?.email ?? '');
  readonly userId = computed(() => this._currentUser()?.id ?? '');
  
  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
    
    // 初始化 session
    this.initializeAuth();
    
    // 監聽認證狀態變化
    this.setupAuthListener();
  }
  
  get client(): SupabaseClient {
    return this.supabase;
  }
  
  private async initializeAuth(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    this._session.set(session);
    this._currentUser.set(session?.user ?? null);
  }
  
  private setupAuthListener(): void {
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      this._session.set(session);
      this._currentUser.set(session?.user ?? null);
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in:', session?.user?.email);
          break;
        case 'SIGNED_OUT':
          console.log('User signed out');
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed');
          break;
      }
    });
  }
  
  // Auth methods
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }
  
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
  
  async signInWithMagicLink(email: string) {
    const { data, error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        email_redirect_to: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  }
}
```

#### ✅ 2. Auth Guard with Signals

```typescript
// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '@core/supabase/supabase.service';

export const authGuard = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);
  
  if (supabase.isAuthenticated()) {
    return true;
  }
  
  return router.parseUrl('/passport/login');
};
```

#### ✅ 3. Repository 模式與 RLS

```typescript
// src/app/core/infra/repository/base.repository.ts
import { inject } from '@angular/core';
import { SupabaseService } from '@core/supabase/supabase.service';
import { from, Observable } from 'rxjs';

export abstract class BaseRepository<T> {
  protected readonly supabase = inject(SupabaseService);
  protected abstract readonly tableName: string;
  
  findAll(): Observable<T[]> {
    return from(
      this.supabase.client
        .from(this.tableName)
        .select('*')
        .then(({ data, error }) => {
          if (error) throw error;
          return data as T[];
        })
    );
  }
  
  findById(id: string): Observable<T | null> {
    return from(
      this.supabase.client
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
  
  create(entity: Partial<T>): Observable<T> {
    return from(
      this.supabase.client
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
  
  update(id: string, entity: Partial<T>): Observable<T> {
    return from(
      this.supabase.client
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
  
  delete(id: string): Observable<void> {
    return from(
      this.supabase.client
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) throw error;
        })
    );
  }
}
```

```typescript
// src/app/core/infra/repository/blueprint.repository.ts
import { Injectable } from '@angular/core';
import { BaseRepository } from './base.repository';
import { Blueprint } from '@core/infra/types/blueprint';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlueprintRepository extends BaseRepository<Blueprint> {
  protected readonly tableName = 'blueprints';
  
  findByOwner(ownerId: string): Observable<Blueprint[]> {
    return from(
      this.supabase.client
        .from(this.tableName)
        .select('*')
        .eq('owner_id', ownerId)
        .then(({ data, error }) => {
          if (error) throw error;
          return data as Blueprint[];
        })
    );
  }
  
  findByModuleEnabled(module: string): Observable<Blueprint[]> {
    return from(
      this.supabase.client
        .from(this.tableName)
        .select('*')
        .contains('enabled_modules', [module])
        .then(({ data, error }) => {
          if (error) throw error;
          return data as Blueprint[];
        })
    );
  }
}
```

---

## 實作檢查清單

### Phase 1: 基礎改進

- [ ] **版本統一**
  - [ ] 更新 package.json 所有 Angular 套件到 21.0.3
  - [ ] 執行 `yarn install`
  - [ ] 執行 `ng build` 確保編譯成功
  - [ ] 執行 `ng test` 確保測試通過
  - [ ] 檢查 ng-alain 和 ng-zorro-antd 相容性

- [ ] **錯誤處理系統**
  - [ ] 建立 `ErrorHandlerService`
  - [ ] 建立 `GlobalErrorHandler`
  - [ ] 建立 `errorInterceptor`
  - [ ] 註冊到 `app.config.ts`
  - [ ] 移除所有 `console.log`

- [ ] **API 回應標準化**
  - [ ] 定義 `ApiResponse` 型別
  - [ ] 建立 `ResponseHandler` 工具
  - [ ] 更新至少 3 個 Service 使用統一格式

### Phase 2: Signal 遷移

- [ ] **自動遷移執行**
  - [ ] 執行 `ng generate @angular/core:signal-input-migration`
  - [ ] 執行 `ng generate @angular/core:signal-queries-migration`
  - [ ] 檢查並修正遷移後的問題

- [ ] **手動 Signal 化**
  - [ ] `BlueprintService` 使用 Signals
  - [ ] `FileService` 確認已使用 Signals
  - [ ] `TaskService` 使用 Signals
  - [ ] `DiaryService` 使用 Signals

- [ ] **元件更新**
  - [ ] `BlueprintOverviewComponent` 使用 Signal inputs
  - [ ] `BlueprintFilesComponent` 整合 Signal state
  - [ ] 至少 3 個其他關鍵元件遷移到 Signals

### Phase 3: 三層架構

- [ ] **Repository 層**
  - [ ] 建立 `BaseRepository`
  - [ ] 建立 `BlueprintRepository`
  - [ ] 建立 `FileRepository`
  - [ ] 建立至少 2 個其他 Repository

- [ ] **Service 層重構**
  - [ ] `BlueprintService` 使用 Repository
  - [ ] `FileService` 使用 Repository
  - [ ] 至少 2 個其他 Service 重構

- [ ] **Component 層清理**
  - [ ] 移除直接 Supabase 調用
  - [ ] 確保所有元件使用 Service 層
  - [ ] 確保 `OnPush` Change Detection

### Phase 4: ng-zorro-antd 標準化

- [ ] **基礎元件**
  - [ ] 建立 `BaseTableComponent`
  - [ ] 實作 Signal 整合
  - [ ] 實作分頁、排序、篩選

- [ ] **重構表格**
  - [ ] `BlueprintListComponent` 使用 BaseTable
  - [ ] `FileListComponent` 使用 BaseTable
  - [ ] 至少 2 個其他列表元件重構

### Phase 5: 測試

- [ ] **測試環境**
  - [ ] 配置 Karma/Jasmine
  - [ ] 建立測試工具
  - [ ] 建立 Mock Services

- [ ] **單元測試**
  - [ ] `ErrorHandlerService` - 達到 80% 覆蓋率
  - [ ] `ResponseHandler` - 達到 80% 覆蓋率
  - [ ] `BaseRepository` - 達到 80% 覆蓋率
  - [ ] 至少 3 個 Service - 達到 60% 覆蓋率
  - [ ] 整體專案 - 達到 30% 覆蓋率

### 驗證步驟

- [ ] 所有 P0 項目已完成
- [ ] 應用程式編譯無錯誤
- [ ] 所有測試通過
- [ ] 測試覆蓋率達 30%
- [ ] 無 `console.log` 調用
- [ ] 錯誤處理統一
- [ ] API 回應格式統一
- [ ] 關鍵元件已 Signal 化
- [ ] 三層架構已建立
- [ ] 文件已更新

---

## 參考資源

### Context7 查詢庫

- **Angular**: `/angular/angular`
- **ng-zorro-antd**: `/ng-zorro/ng-zorro-antd`
- **ng-alain**: `/ng-alain/ng-alain`
- **Supabase**: `/websites/supabase`

### 官方文檔

- [Angular 官方文檔](https://angular.dev)
- [Angular Signals 指南](https://angular.dev/guide/signals)
- [ng-zorro-antd 文檔](https://ng.ant.design)
- [ng-alain 文檔](https://ng-alain.com)
- [Supabase 文檔](https://supabase.com/docs)

### 遷移指令

```bash
# Angular Signal 遷移
ng generate @angular/core:signal-input-migration
ng generate @angular/core:signal-queries-migration

# 版本升級
ng update @angular/core@21 @angular/cli@21
yarn add @supabase/supabase-js@latest

# 測試
ng test --code-coverage
ng build --configuration production
```

---

## 結論

本文件提供了使用 Context7 查詢最新文檔並實施 GigHub 專案改進的完整指南。通過：

1. ✅ **版本確認與升級分析** - 識別並解決版本不一致問題
2. ✅ **Context7 文檔查詢** - 獲取 Angular Signals、ng-zorro-antd、Supabase 最新最佳實踐
3. ✅ **分階段實施計畫** - 提供清晰的 8 週實施路線圖
4. ✅ **程式碼範例** - 提供基於最新文檔的實際程式碼範例
5. ✅ **檢查清單** - 確保每個階段都有明確的驗證標準

**下一步行動**:
1. 開始 Phase 1: 版本統一與基礎架構建立
2. 執行 Angular Signal 自動遷移
3. 逐步建立三層架構
4. 持續查詢 Context7 獲取最新最佳實踐

**持續改進**:
- 定期查詢 Context7 確保使用最新模式
- 每個 Phase 完成後進行回顧
- 根據實際進度調整計畫
- 記錄遇到的問題和解決方案

---

**文檔維護者**: GitHub Copilot (Angular 專家代理)  
**最後更新**: 2025-12-08  
**下次審查**: Phase 1 完成後

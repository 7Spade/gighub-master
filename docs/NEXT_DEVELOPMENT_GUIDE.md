# 📋 GigHub 下一步開發指南

> 基於專案現況分析的開發方向建議

**建立日期**: 2025-12-02

---

## 📊 專案現況總覽

### 功能完成度概覽

```
┌────────────────────────────────────────────────────────────────┐
│                        完成度評估                               │
├────────────────────────────────────────────────────────────────┤
│ 基礎層 (Foundation Layer)                                       │
│   ✅ 認證系統 (Supabase Auth)                 ████████████ 完成 │
│   ✅ 使用者管理                               ████████████ 完成 │
│   ✅ 組織管理                                 ████████████ 完成 │
│   🔶 Bot 管理                                 ██████░░░░░░ 50%  │
├────────────────────────────────────────────────────────────────┤
│ 容器層 (Container Layer)                                        │
│   ✅ 藍圖系統                                 ████████████ 完成 │
│   🔶 權限控制 (RBAC)                          ████████░░░░ 70%  │
│   🔴 事件總線                                 ░░░░░░░░░░░░ 0%   │
│   🔴 搜尋引擎                                 ░░░░░░░░░░░░ 0%   │
├────────────────────────────────────────────────────────────────┤
│ 業務層 (Business Layer)                                         │
│   🔶 任務管理                                 ████░░░░░░░░ 30%  │
│   🔶 日誌管理                                 ██░░░░░░░░░░ 15%  │
│   🔶 待辦事項                                 ████░░░░░░░░ 35%  │
│   🔴 品質驗收                                 ░░░░░░░░░░░░ 0%   │
│   🔴 檔案管理                                 ░░░░░░░░░░░░ 0%   │
└────────────────────────────────────────────────────────────────┘
```

### 技術棧

| 層級 | 技術 | 版本 | 說明 |
|------|------|------|------|
| 前端框架 | Angular (Standalone Components) | 20.3+ | 使用 Signals, inject(), @if/@for 控制流 |
| UI 框架 | NG-ZORRO + @delon/abc | 20.x | 企業級 UI 元件庫 |
| 狀態管理 | Angular Signals | 20.3+ | signal(), computed(), linkedSignal() |
| 後端服務 | Supabase (PostgreSQL + Auth) | 2.86+ | BaaS 後端服務 |
| 型別系統 | TypeScript | 5.9 | 完整類型安全 |
| 響應式 | RxJS | 7.8 | 搭配 toSignal()/toObservable() |

---

## 🎯 開發優先級建議

基於專案現況分析，以下是建議的開發優先順序：

### 🔴 最高優先級 - 立即執行 (1-2 週)

#### 1. 任務管理模組完善 ⭐⭐⭐⭐⭐

**現況**：UI 框架已完成（樹狀圖、表格、看板視圖），但後端整合不完整

**待完成項目**：
1. **TaskRepository 資料存取層** - 連接 Supabase
2. **任務 RPC 函數** - 建立/更新/刪除任務的原子操作
3. **任務指派功能** - 連接 `task_assignees` 資料表
4. **進度計算** - 從葉節點向上計算父任務進度
5. **移除 Mock 資料** - 切換到真實資料庫操作

**涉及檔案**：
```
src/app/
├── core/infra/repositories/task/        ← 待建立
├── shared/services/task/task.service.ts ← 需修改（移除 mock）
└── routes/blueprint/tasks/              ← 已完成 UI
```

**為什麼優先**：
- 任務是核心業務模組，所有其他功能依附於此
- UI 已完成，只需完成後端整合
- 資料庫 schema 已設計完成

---

### 🟠 高優先級 - 短期目標 (2-4 週)

#### 2. 施工日誌模組 ⭐⭐⭐⭐

**現況**：資料庫已設計，前端僅有列表框架

**待完成項目**：
1. **DiaryRepository** - 資料存取層
2. **日誌建立表單** - 完整的日誌填寫 UI
3. **日誌條目管理** - `daily_log_entries` 整合
4. **照片上傳** - Supabase Storage 整合
5. **天氣選擇器** - 基於 `weather_type` 枚舉

**相關資料表**：
- `daily_logs` - 日誌主表
- `daily_log_entries` - 日誌條目

**商業價值**：
- 工地主任每日必用功能
- 法規要求的施工紀錄

#### 3. 檔案管理模組 ⭐⭐⭐⭐

**現況**：資料庫結構已在 `seed.sql` 中設計，前端未開始

**待完成項目**：
1. **Supabase Storage 配置** - bucket 設定
2. **FileRepository** - 資料存取層
3. **FileService** - 業務邏輯
4. **檔案上傳元件** - 拖拉上傳 UI
5. **檔案預覽** - 圖片/PDF 預覽

**依賴關係**：
- 日誌照片上傳需要此模組
- 任務附件需要此模組

---

### 🟡 中優先級 - 中期目標 (4-6 週)

#### 4. 權限控制完善 ⭐⭐⭐

**現況**：基礎 RBAC 已實現，但細粒度權限控制不完整

**待完成項目**：
1. **blueprint_roles 整合** - 自訂角色系統
2. **權限 Guard 強化** - 路由層權限控制
3. **UI 權限控制** - 按鈕/操作的條件顯示
4. **PermissionDirective** - 權限指令

#### 5. 任務評論與討論 ⭐⭐⭐

**現況**：資料表已設計 (`task_comments`)，前端未實現

**待完成項目**：
1. **TaskCommentService** - 評論 CRUD
2. **CommentThreadComponent** - 評論列表
3. **@提及功能** - 使用者提及

---

### 🟢 一般優先級 - 長期目標 (6+ 週)

#### 6. 品質驗收模組 ⭐⭐

**現況**：僅有資料庫 enum 定義

**待建立**：
- 檢查清單系統
- 驗收流程
- 驗收報告

#### 7. 通知中心 ⭐⭐

**待建立**：
- 通知資料表
- 即時通知 (Supabase Realtime)
- 通知 UI 元件

#### 8. 報表與分析 ⭐

**待建立**：
- 進度報表
- 工時統計
- Dashboard 強化

---

## 📁 建議的目錄結構

### 任務模組完整結構
```
src/app/
├── core/
│   ├── facades/
│   │   └── task/
│   │       ├── task.facade.ts
│   │       └── index.ts
│   └── infra/
│       ├── repositories/
│       │   └── task/
│       │       ├── task.repository.ts
│       │       └── index.ts
│       └── types/
│           └── task/
│               └── index.ts
├── shared/
│   ├── services/
│   │   └── task/
│   │       ├── task.service.ts    ← 已存在，需修改
│   │       └── index.ts
│   └── models/
│       └── task/
│           ├── task.models.ts
│           └── index.ts
└── routes/
    └── blueprint/
        └── tasks/                  ← 已完成
            ├── task-list/
            ├── task-detail/
            ├── task-create/
            └── components/
```

### 日誌模組結構
```
src/app/
├── core/
│   └── infra/
│       └── repositories/
│           └── diary/
│               ├── diary.repository.ts
│               └── index.ts
├── shared/
│   └── services/
│       └── diary/
│           ├── diary.service.ts
│           └── index.ts
└── routes/
    └── blueprint/
        └── diary/
            ├── diary-list/
            ├── diary-form/
            ├── diary-detail/
            └── components/
```

---

## 🔧 技術建議 (Angular 20 現代化模式)

> 以下技術建議基於 Angular 20.3.x 官方文檔，使用 Context7 驗證的最新 API 和最佳實踐。

### 1. Repository 模式 (使用 inject() 函數)

建議所有資料存取都通過 Repository 層，使用 Angular 20 的 `inject()` 函數進行依賴注入：

```typescript
// src/app/core/infra/repositories/task/task.repository.ts
import { inject, Injectable } from '@angular/core';
import { SupabaseService } from '@core/supabase';
import type { Database } from '@core/supabase/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type CreateTaskRequest = Database['public']['Tables']['tasks']['Insert'];

@Injectable({ providedIn: 'root' })
export class TaskRepository {
  // Angular 20 推薦使用 inject() 函數而非構造函數注入
  private readonly supabase = inject(SupabaseService);

  async findByBlueprint(blueprintId: string): Promise<Task[]> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .select('*')
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .order('sort_order');
    
    if (error) throw error;
    return data as Task[];
  }

  async create(request: CreateTaskRequest): Promise<Task> {
    // 使用 RPC 函數進行原子操作
    const { data, error } = await this.supabase.client
      .rpc('create_task', { ...request });
    
    if (error) throw error;
    return data;
  }

  async update(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }
}
```

### 2. Signal 狀態管理 (Angular 20 Signals + linkedSignal)

使用 Angular 20 的 `signal()`、`computed()` 和 `linkedSignal()` 進行響應式狀態管理：

```typescript
// src/app/shared/services/task/task.service.ts
import { inject, Injectable, signal, computed, linkedSignal } from '@angular/core';
import { TaskRepository } from '@core/infra/repositories/task';
import type { Task } from '@shared/models/task';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly repo = inject(TaskRepository);
  
  // 核心狀態 signals
  private readonly tasksState = signal<Task[]>([]);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  
  // Readonly signals 供外部消費
  readonly tasks = this.tasksState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  
  // Computed signals - 自動追蹤依賴並更新
  readonly taskTree = computed(() => this.buildTree(this.tasksState()));
  readonly taskCount = computed(() => this.tasksState().length);
  readonly hasError = computed(() => this.errorState() !== null);
  
  // linkedSignal - 當來源 signal 變化時自動更新選中狀態
  readonly selectedTask = linkedSignal<Task[], Task | null>({
    source: this.tasksState,
    computation: (tasks, previous) => {
      // 保持選中狀態，如果任務還存在則保留選擇
      if (previous?.value) {
        return tasks.find(t => t.id === previous.value!.id) ?? null;
      }
      return null;
    }
  });

  async loadTasks(blueprintId: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    
    try {
      const tasks = await this.repo.findByBlueprint(blueprintId);
      this.tasksState.set(tasks);
    } catch (err) {
      this.errorState.set(err instanceof Error ? err.message : '載入失敗');
    } finally {
      this.loadingState.set(false);
    }
  }

  selectTask(task: Task): void {
    this.selectedTask.set(task);
  }

  private buildTree(tasks: Task[]): Task[] {
    // 建立任務樹狀結構
    const taskMap = new Map(tasks.map(t => [t.id, { ...t, children: [] }]));
    const roots: Task[] = [];
    
    for (const task of taskMap.values()) {
      if (task.parent_id && taskMap.has(task.parent_id)) {
        taskMap.get(task.parent_id)!.children.push(task);
      } else {
        roots.push(task);
      }
    }
    
    return roots;
  }
}
```

### 3. RxJS 整合 (toSignal 和 toObservable)

在需要與 RxJS Observable 互操作時，使用 Angular 20 的 `toSignal()` 和 `toObservable()`：

```typescript
// 將 Observable 轉換為 Signal
import { Component, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { interval, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-realtime-status',
  standalone: true,
  template: `
    <div>狀態: {{ status() }}</div>
    <div>搜尋結果: {{ searchResults() | json }}</div>
  `
})
export class RealtimeStatusComponent {
  private readonly http = inject(HttpClient);
  
  // Observable → Signal (自動訂閱和取消訂閱)
  readonly status = toSignal(
    interval(5000).pipe(
      switchMap(() => this.http.get<string>('/api/status'))
    ),
    { initialValue: '載入中...' }
  );

  // 搜尋功能：Signal → Observable → Signal
  readonly searchQuery = signal('');
  
  readonly searchResults = toSignal(
    toObservable(this.searchQuery).pipe(
      switchMap(query => this.http.get<any[]>(`/api/search?q=${query}`))
    ),
    { initialValue: [] }
  );
}
```

### 4. Supabase TypeScript 類型安全

使用 Supabase CLI 生成 TypeScript 類型，確保完整的類型安全：

```bash
# 生成類型定義
npx supabase gen types typescript --local > src/app/core/supabase/database.types.ts
```

```typescript
// src/app/core/supabase/supabase.service.ts
import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env/environment';
import type { Database } from './database.types';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  // 使用泛型確保類型安全
  readonly client: SupabaseClient<Database> = createClient<Database>(
    environment.supabaseUrl,
    environment.supabaseAnonKey
  );

  // 類型安全的表格存取
  from<T extends keyof Database['public']['Tables']>(table: T) {
    return this.client.from(table);
  }

  // 類型安全的 RPC 調用
  rpc<T extends keyof Database['public']['Functions']>(
    fn: T,
    args: Database['public']['Functions'][T]['Args']
  ) {
    return this.client.rpc(fn, args as any);
  }
}
```

### 5. 元件設計模式 (Angular 20 Standalone)

使用 Angular 20 的 Standalone Components 和現代化模式：

```typescript
// src/app/routes/blueprint/tasks/task-list/task-list.component.ts
import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { TaskService } from '@shared/services/task';
import type { Task } from '@shared/models/task';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [SHARED_IMPORTS],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (taskService.loading()) {
      <nz-spin nzTip="載入中..."></nz-spin>
    } @else if (taskService.hasError()) {
      <nz-alert 
        nzType="error" 
        [nzMessage]="taskService.error()"
        nzShowIcon
      ></nz-alert>
    } @else {
      <nz-table
        #basicTable
        [nzData]="taskService.tasks()"
        [nzFrontPagination]="false"
        [nzShowPagination]="true"
        nzSize="middle"
      >
        <thead>
          <tr>
            <th>任務名稱</th>
            <th>狀態</th>
            <th>進度</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          @for (task of basicTable.data; track task.id) {
            <tr 
              [class.selected]="taskService.selectedTask()?.id === task.id"
              (click)="taskService.selectTask(task)"
            >
              <td>{{ task.name }}</td>
              <td>
                <nz-tag [nzColor]="getStatusColor(task.status)">
                  {{ task.status }}
                </nz-tag>
              </td>
              <td>
                <nz-progress 
                  [nzPercent]="task.progress" 
                  nzSize="small"
                ></nz-progress>
              </td>
              <td>
                <a (click)="onEdit.emit(task); $event.stopPropagation()">編輯</a>
                <nz-divider nzType="vertical"></nz-divider>
                <a 
                  nz-popconfirm
                  nzPopconfirmTitle="確定要刪除嗎？"
                  (nzOnConfirm)="onDelete.emit(task)"
                  (click)="$event.stopPropagation()"
                >刪除</a>
              </td>
            </tr>
          }
        </tbody>
      </nz-table>
    }
  `
})
export class TaskListComponent {
  // Angular 20: 使用 inject() 函數
  readonly taskService = inject(TaskService);
  
  // Angular 20: 使用 input() 和 output() 函數
  readonly blueprintId = input.required<string>();
  readonly onEdit = output<Task>();
  readonly onDelete = output<Task>();

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'default',
      'in_progress': 'processing',
      'completed': 'success',
      'blocked': 'error'
    };
    return colors[status] ?? 'default';
  }
}
```

### 6. 錯誤處理模式

統一使用專案的錯誤處理模式，搭配 Angular 20 的 Signal：

```typescript
import { inject, Injectable, signal, computed } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly msg = inject(NzMessageService);
  private readonly repo = inject(TaskRepository);
  
  private readonly errorState = signal<Error | null>(null);
  readonly error = this.errorState.asReadonly();
  readonly hasError = computed(() => this.errorState() !== null);

  async createTask(request: CreateTaskRequest): Promise<Task | null> {
    try {
      const task = await this.repo.create(request);
      this.msg.success('任務建立成功');
      this.errorState.set(null);
      return task;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('操作失敗');
      this.errorState.set(error);
      this.msg.error(error.message);
      return null;
    }
  }
}
```

### 7. 表單處理 (Reactive Forms + Signal)

結合 Angular Reactive Forms 和 Signals：

```typescript
// src/app/routes/blueprint/tasks/task-form/task-form.component.ts
import { Component, inject, input, output, effect } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <form nz-form [formGroup]="form" (ngSubmit)="onSubmit()">
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzRequired nzFor="name">任務名稱</nz-form-label>
        <nz-form-control [nzSpan]="14" nzErrorTip="請輸入任務名稱">
          <input nz-input formControlName="name" id="name" />
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-label [nzSpan]="6" nzFor="description">描述</nz-form-label>
        <nz-form-control [nzSpan]="14">
          <textarea nz-input formControlName="description" id="description" rows="4"></textarea>
        </nz-form-control>
      </nz-form-item>
      
      <nz-form-item>
        <nz-form-control [nzSpan]="14" [nzOffset]="6">
          <button nz-button nzType="primary" [disabled]="!form.valid">
            {{ editMode() ? '更新' : '建立' }}
          </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `
})
export class TaskFormComponent {
  private readonly fb = inject(FormBuilder);
  
  // 使用 input signal 接收編輯資料
  readonly task = input<Task | null>(null);
  readonly onSave = output<CreateTaskRequest>();
  
  readonly editMode = computed(() => this.task() !== null);
  
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    parent_id: [null as string | null],
    priority: ['medium' as 'low' | 'medium' | 'high']
  });

  constructor() {
    // 使用 effect 監聽 task 變化並更新表單
    effect(() => {
      const task = this.task();
      if (task) {
        this.form.patchValue({
          name: task.name,
          description: task.description ?? '',
          parent_id: task.parent_id,
          priority: task.priority
        });
      } else {
        this.form.reset({ priority: 'medium' });
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.onSave.emit(this.form.value as CreateTaskRequest);
    }
  }
}
```

---

## 📝 立即行動清單

### 本週 (Week 1) - 基礎設施建立

- [ ] **生成 Supabase TypeScript 類型**
  ```bash
  npx supabase gen types typescript --local > src/app/core/supabase/database.types.ts
  ```
- [ ] 建立 `TaskRepository` 資料存取層（使用 `inject()` 函數）
- [ ] 實現任務 CRUD 的真實資料庫操作（完整類型安全）
- [ ] 移除 `TaskService` 中的 mock 資料
- [ ] 使用 `signal()` 和 `computed()` 重構狀態管理

### 下週 (Week 2) - 進階功能整合

- [ ] 實現 `linkedSignal` 管理任務選擇狀態
- [ ] 實現任務指派功能（使用 `task_assignees` 資料表）
- [ ] 實現父任務進度自動計算（使用 `computed()` signals）
- [ ] 使用 `effect()` 處理副作用（如：通知、日誌）
- [ ] 測試完整的任務管理流程

### 第三週 (Week 3) - 日誌模組開發

- [ ] 建立 `DiaryRepository` 資料存取層
- [ ] 完成日誌表單 UI（使用 Reactive Forms + Signal）
- [ ] 整合 Supabase Storage 進行照片上傳
- [ ] 實現日誌條目管理
- [ ] 使用 `toSignal()` 整合 Supabase Realtime 訂閱

---

## 🔄 版本升級建議

### 當前版本狀態

| 套件 | 當前版本 | 最新版本 | 建議 |
|------|---------|---------|------|
| @angular/core | 20.3.0 | 20.3.x | ✅ 已是最新 |
| @delon/abc | 20.1.0 | 20.1.x | ✅ 已是最新 |
| ng-zorro-antd | 20.4.3 | 20.4.x | ✅ 已是最新 |
| @supabase/supabase-js | 2.86.0 | 2.x | ✅ 已是最新 |
| TypeScript | 5.9.2 | 5.9.x | ✅ 已是最新 |

### Angular 20 新特性使用

本專案應充分利用 Angular 20 的新特性：

1. **`signal()`, `computed()`, `effect()`** - 響應式狀態管理
2. **`linkedSignal()`** - 依賴狀態同步
3. **`inject()` 函數** - 現代化依賴注入
4. **`input()`, `output()` 函數** - 元件通訊
5. **`@if`, `@for`, `@switch`** - 控制流語法
6. **`toSignal()`, `toObservable()`** - RxJS 互操作

---

## 📚 相關文件

- [系統架構](GigHub_Architecture.md)
- [功能文件](features/README.md)
- [產品需求](prd/construction-site-management.md)
- [Supabase Schema](../seed.sql)
- [Angular 官方文檔](https://angular.dev)
- [ng-alain 文檔](https://ng-alain.com)
- [ng-zorro-antd 文檔](https://ng.ant.design)
- [Supabase 文檔](https://supabase.com/docs)

---

## 🎯 總結

基於專案分析和 Angular 20 最佳實踐，**建議的開發順序**為：

1. **📌 基礎設施現代化**
   - 生成 Supabase TypeScript 類型
   - 建立類型安全的 Repository 層
   - 採用 Angular 20 Signal 模式

2. **📌 任務模組完善** - 最高優先，已有 UI 只需完成後端

3. **📌 施工日誌模組** - 核心業務需求

4. **📌 檔案管理模組** - 支援日誌和任務附件

5. **權限控制完善** - 提升安全性

6. **其他模組** - 按需開發

### 最重要的下一步

1. 執行 `npx supabase gen types typescript --local > src/app/core/supabase/database.types.ts` 生成類型
2. 完成 `TaskRepository`（使用 `inject()` 函數和完整類型）
3. 重構 `TaskService`（使用 `signal()`, `computed()`, `linkedSignal()`）
4. 移除 mock 資料，連接真實資料庫

---

**最後更新**: 2025-12-02
**技術參考**: Angular 20.3 官方文檔 (via Context7)

# Angular + ng-alain + Supabase 程式風格指南

> 本專案的程式碼風格規範，確保團隊開發一致性

---

## 📁 檔案結構

### Feature 垂直切片結構

```
src/app/features/{feature-name}/
├── {feature-name}.routes.ts         # 路由配置
├── shell/                           # 邏輯容器層
│   ├── {feature}-shell/
│   │   ├── {feature}-shell.component.ts
│   │   └── {feature}-shell.component.html
│   └── dialogs/                     # 對話框
├── data-access/                     # 資料存取層
│   ├── stores/                      # Signals Store
│   │   └── {feature}.store.ts
│   ├── services/                    # 業務服務
│   │   └── {feature}.service.ts
│   └── repositories/                # Supabase Repository
│       └── {feature}.repository.ts
├── domain/                          # 領域層
│   ├── enums/                       # 枚舉定義
│   ├── interfaces/                  # 介面定義
│   ├── models/                      # 領域模型
│   └── types/                       # 類型定義
├── ui/                              # 展示層
│   ├── {sub-feature}/
│   │   ├── {component}.component.ts
│   │   ├── {component}.component.html
│   │   └── {component}.component.less
│   └── shared/                      # Feature 內共用元件
└── utils/                           # 工具函數
```

---

## 🧩 Component 風格

### Standalone Component 模板

```typescript
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  // 輸入 - 使用 input() 函數
  task = input.required<Task>();
  isEditable = input(false);

  // 輸出 - 使用 output() 函數
  taskSelected = output<Task>();
  taskDeleted = output<string>();

  // 依賴注入 - 使用 inject() 函數
  private readonly taskStore = inject(TaskStore);

  // 計算屬性 - 使用 computed()
  protected readonly isOverdue = computed(() => {
    const task = this.task();
    return task.dueDate && new Date(task.dueDate) < new Date();
  });

  // 事件處理
  protected onSelect(): void {
    this.taskSelected.emit(this.task());
  }
}
```

### Component 大小限制

| 項目 | 限制 |
|------|------|
| TypeScript 檔案 | < 500 行 |
| Template 檔案 | < 300 行 |
| LESS 檔案 | < 200 行 |

---

## 📦 Store 風格 (Signals)

### Store 模板

```typescript
import { Injectable, computed, inject, signal } from '@angular/core';
import { TaskRepository } from '../repositories/task.repository';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly repository = inject(TaskRepository);

  // 私有狀態
  private readonly _tasks = signal<Task[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // 公開唯讀狀態
  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 計算屬性
  readonly pendingTasks = computed(() =>
    this._tasks().filter(t => t.status === 'pending')
  );

  readonly taskCount = computed(() => this._tasks().length);

  // 載入資料
  async loadTasks(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const tasks = await this.repository.findByBlueprint(blueprintId);
      this._tasks.set(tasks);
    } catch (error) {
      this._error.set('載入任務失敗');
      console.error('[TaskStore] loadTasks error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  // 建立
  async createTask(data: CreateTaskDto): Promise<Task | null> {
    try {
      const task = await this.repository.create(data);
      this._tasks.update(tasks => [...tasks, task]);
      return task;
    } catch (error) {
      this._error.set('建立任務失敗');
      return null;
    }
  }

  // 更新
  async updateTask(id: string, data: UpdateTaskDto): Promise<boolean> {
    try {
      const updated = await this.repository.update(id, data);
      this._tasks.update(tasks =>
        tasks.map(t => (t.id === id ? updated : t))
      );
      return true;
    } catch (error) {
      this._error.set('更新任務失敗');
      return false;
    }
  }

  // 刪除
  async deleteTask(id: string): Promise<boolean> {
    try {
      await this.repository.delete(id);
      this._tasks.update(tasks => tasks.filter(t => t.id !== id));
      return true;
    } catch (error) {
      this._error.set('刪除任務失敗');
      return false;
    }
  }

  // 重置狀態
  reset(): void {
    this._tasks.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
```

---

## 🗄️ Repository 風格

### Repository 模板

```typescript
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';

@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = 'tasks';

  async findByBlueprint(blueprintId: string): Promise<Task[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .eq('blueprint_id', blueprintId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async findById(id: string): Promise<Task | null> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
```

---

## 📝 模板風格

### ng-zorro-antd + ng-alain 慣例

```html
<!-- 頁面容器 -->
<page-header [title]="'任務管理'" [breadcrumb]="breadcrumb">
  <ng-template #breadcrumb>
    <nz-breadcrumb>
      <nz-breadcrumb-item>首頁</nz-breadcrumb-item>
      <nz-breadcrumb-item>任務管理</nz-breadcrumb-item>
    </nz-breadcrumb>
  </ng-template>
</page-header>

<!-- 內容區 -->
<nz-card [nzBordered]="false">
  <!-- 工具列 -->
  <div class="mb-md">
    <nz-space>
      <button *nzSpaceItem nz-button nzType="primary" (click)="onCreate()">
        <span nz-icon nzType="plus"></span>
        新增任務
      </button>
      <nz-input-group *nzSpaceItem [nzSuffix]="suffixIcon" style="width: 200px">
        <input nz-input placeholder="搜尋任務" [(ngModel)]="searchText" />
      </nz-input-group>
    </nz-space>
    <ng-template #suffixIcon>
      <span nz-icon nzType="search"></span>
    </ng-template>
  </div>

  <!-- 資料表格 -->
  <nz-table
    #basicTable
    [nzData]="tasks()"
    [nzLoading]="loading()"
    [nzShowPagination]="true"
    [nzPageSize]="20"
  >
    <thead>
      <tr>
        <th>名稱</th>
        <th nzWidth="100px">狀態</th>
        <th nzWidth="150px">操作</th>
      </tr>
    </thead>
    <tbody>
      @for (task of basicTable.data; track task.id) {
        <tr>
          <td>{{ task.name }}</td>
          <td>
            <nz-tag [nzColor]="getStatusColor(task.status)">
              {{ task.status | taskStatus }}
            </nz-tag>
          </td>
          <td>
            <a (click)="onEdit(task)">編輯</a>
            <nz-divider nzType="vertical"></nz-divider>
            <a nz-popconfirm nzPopconfirmTitle="確定刪除？" (nzOnConfirm)="onDelete(task.id)">
              刪除
            </a>
          </td>
        </tr>
      }
    </tbody>
  </nz-table>
</nz-card>
```

### Control Flow 語法

使用 Angular 17+ 的新控制流語法：

```html
<!-- 條件渲染 -->
@if (loading()) {
  <nz-spin nzSimple></nz-spin>
} @else if (error()) {
  <nz-result nzStatus="error" [nzTitle]="error()"></nz-result>
} @else {
  <div>內容</div>
}

<!-- 迴圈 -->
@for (task of tasks(); track task.id) {
  <app-task-card [task]="task" />
} @empty {
  <nz-empty nzNotFoundContent="暫無任務"></nz-empty>
}

<!-- Switch -->
@switch (status()) {
  @case ('pending') { <nz-tag nzColor="default">待處理</nz-tag> }
  @case ('progress') { <nz-tag nzColor="processing">進行中</nz-tag> }
  @case ('completed') { <nz-tag nzColor="success">已完成</nz-tag> }
  @default { <nz-tag>未知</nz-tag> }
}
```

---

## 🎨 樣式風格

### LESS 變數使用

```less
@import '~@delon/theme/styles/layout/default/mixins';

.task-card {
  padding: @padding-md;
  border-radius: @border-radius-base;
  background: @component-background;
  
  &:hover {
    box-shadow: @box-shadow-base;
  }
  
  &__title {
    font-size: @font-size-lg;
    color: @heading-color;
  }
  
  &__status {
    color: @text-color-secondary;
  }
}
```

### 響應式設計

```less
.task-grid {
  display: grid;
  gap: @padding-md;
  grid-template-columns: repeat(4, 1fr);
  
  @media (max-width: @screen-lg) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: @screen-md) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: @screen-sm) {
    grid-template-columns: 1fr;
  }
}
```

---

## 🔗 Import 順序

```typescript
// 1. Angular 核心
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 2. ng-zorro-antd
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';

// 3. @delon
import { PageHeaderModule } from '@delon/abc/page-header';

// 4. 專案內部 - 共用
import { SharedModule } from '@shared';

// 5. 專案內部 - 功能相關
import { TaskStore } from '../data-access/stores/task.store';
import { Task } from '../domain/models/task.model';
```

---

## 📚 參考資源

- [Angular 官方風格指南](https://angular.dev/style-guide)
- [ng-alain 開發指南](https://ng-alain.com/docs/getting-started)
- [ng-zorro-antd 元件庫](https://ng.ant.design/components/overview)
- [Supabase 最佳實踐](https://supabase.com/docs/guides/database/best-practices)

---

**最後更新**: 2025-11-27

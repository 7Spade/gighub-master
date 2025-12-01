# Standalone Component 生成 Prompt

> 生成符合專案規範的 Angular Standalone Component

---

## 🎯 用途

快速生成符合專案規範的 Standalone Component，包含：

- TypeScript 元件類別
- HTML 模板
- LESS 樣式
- 基本測試

---

## 📋 Prompt 模板

```
請生成一個 Standalone Component：

## 元件名稱
[element-name] (kebab-case)

## 元件類型
[ ] 展示元件 (Presentational)
[ ] 容器元件 (Container/Smart)
[ ] 表單元件 (Form)
[ ] 對話框元件 (Dialog)

## 所屬位置
[src/app/features/xxx/ui/ 或 src/app/shared/components/]

## 輸入屬性 (Inputs)
- [屬性名]: [類型] - [描述]

## 輸出事件 (Outputs)
- [事件名]: [類型] - [描述]

## 依賴服務
- [服務名]

## UI 框架元件
- [ng-zorro 元件]

## 功能描述
[元件的功能描述]
```

---

## 📝 範例

### 輸入

```
## 元件名稱
task-card

## 元件類型
[x] 展示元件 (Presentational)

## 所屬位置
src/app/features/blueprint/ui/task/

## 輸入屬性 (Inputs)
- task: Task (required) - 任務資料
- isEditable: boolean = false - 是否可編輯

## 輸出事件 (Outputs)
- taskSelected: Task - 選擇任務
- taskEdit: Task - 編輯任務
- taskDelete: string - 刪除任務 (id)

## 依賴服務
無

## UI 框架元件
- nz-card
- nz-tag
- nz-avatar
- nz-dropdown

## 功能描述
任務卡片元件，顯示任務的基本資訊，包含標題、狀態、優先級、負責人。
點擊卡片觸發選擇事件，提供編輯和刪除操作。
```

### 輸出

#### 1. TypeScript 元件

```typescript
// task-card.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { Task } from '../../../domain/models/task.model';
import { TaskStatus } from '../../../domain/enums/task-status.enum';
import { TaskPriority } from '../../../domain/enums/task-priority.enum';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzTagModule,
    NzAvatarModule,
    NzDropDownModule,
    NzIconModule,
  ],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  // 輸入屬性
  task = input.required<Task>();
  isEditable = input(false);

  // 輸出事件
  taskSelected = output<Task>();
  taskEdit = output<Task>();
  taskDelete = output<string>();

  // 計算屬性
  protected readonly isOverdue = computed(() => {
    const task = this.task();
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;
  });

  protected readonly statusColor = computed(() => {
    switch (this.task().status) {
      case TaskStatus.PENDING:
        return 'default';
      case TaskStatus.IN_PROGRESS:
        return 'processing';
      case TaskStatus.IN_REVIEW:
        return 'warning';
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  });

  protected readonly priorityColor = computed(() => {
    switch (this.task().priority) {
      case TaskPriority.HIGHEST:
        return 'red';
      case TaskPriority.HIGH:
        return 'orange';
      case TaskPriority.MEDIUM:
        return 'blue';
      case TaskPriority.LOW:
        return 'green';
      case TaskPriority.LOWEST:
        return 'default';
      default:
        return 'default';
    }
  });

  // 事件處理
  protected onCardClick(): void {
    this.taskSelected.emit(this.task());
  }

  protected onEdit(event: Event): void {
    event.stopPropagation();
    this.taskEdit.emit(this.task());
  }

  protected onDelete(event: Event): void {
    event.stopPropagation();
    this.taskDelete.emit(this.task().id);
  }
}
```

#### 2. HTML 模板

```html
<!-- task-card.component.html -->
<nz-card
  class="task-card"
  [class.task-card--overdue]="isOverdue()"
  [nzHoverable]="true"
  (click)="onCardClick()"
>
  <!-- 卡片標題 -->
  <div class="task-card__header">
    <span class="task-card__title">{{ task().title }}</span>
    
    @if (isEditable()) {
      <nz-dropdown-menu #menu="nzDropdownMenu">
        <ul nz-menu>
          <li nz-menu-item (click)="onEdit($event)">
            <span nz-icon nzType="edit"></span>
            編輯
          </li>
          <li nz-menu-item nzDanger (click)="onDelete($event)">
            <span nz-icon nzType="delete"></span>
            刪除
          </li>
        </ul>
      </nz-dropdown-menu>
      
      <button
        nz-button
        nz-dropdown
        [nzDropdownMenu]="menu"
        nzTrigger="click"
        nzType="text"
        nzSize="small"
        (click)="$event.stopPropagation()"
      >
        <span nz-icon nzType="more"></span>
      </button>
    }
  </div>

  <!-- 狀態與優先級 -->
  <div class="task-card__tags">
    <nz-tag [nzColor]="statusColor()">
      {{ task().status }}
    </nz-tag>
    <nz-tag [nzColor]="priorityColor()">
      {{ task().priority }}
    </nz-tag>
  </div>

  <!-- 負責人 -->
  @if (task().assignee) {
    <div class="task-card__assignee">
      <nz-avatar
        [nzSize]="24"
        [nzSrc]="task().assignee?.avatarUrl"
        [nzText]="task().assignee?.name?.charAt(0)"
      ></nz-avatar>
      <span class="task-card__assignee-name">
        {{ task().assignee?.name }}
      </span>
    </div>
  }

  <!-- 截止日期 -->
  @if (task().dueDate) {
    <div class="task-card__due-date" [class.task-card__due-date--overdue]="isOverdue()">
      <span nz-icon nzType="calendar"></span>
      {{ task().dueDate | date:'yyyy/MM/dd' }}
    </div>
  }
</nz-card>
```

#### 3. LESS 樣式

```less
// task-card.component.less
@import '~@delon/theme/styles/layout/default/mixins';

.task-card {
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    box-shadow: @box-shadow-base;
  }

  &--overdue {
    border-left: 3px solid @error-color;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: @padding-sm;
  }

  &__title {
    font-size: @font-size-base;
    font-weight: 500;
    color: @heading-color;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__tags {
    display: flex;
    gap: @padding-xs;
    margin-bottom: @padding-sm;
  }

  &__assignee {
    display: flex;
    align-items: center;
    gap: @padding-xs;
    margin-bottom: @padding-sm;

    &-name {
      font-size: @font-size-sm;
      color: @text-color-secondary;
    }
  }

  &__due-date {
    font-size: @font-size-sm;
    color: @text-color-secondary;
    display: flex;
    align-items: center;
    gap: @padding-xs;

    &--overdue {
      color: @error-color;
    }
  }
}
```

#### 4. 測試檔案

```typescript
// task-card.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { Task } from '../../../domain/models/task.model';
import { TaskStatus } from '../../../domain/enums/task-status.enum';
import { TaskPriority } from '../../../domain/enums/task-priority.enum';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;

  const mockTask: Task = {
    id: 'task-1',
    title: '測試任務',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date(),
    assignee: {
      id: 'user-1',
      name: '測試用戶',
      avatarUrl: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('task', mockTask);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onCardClick_whenClicked_shouldEmitTaskSelected', () => {
    const spy = jest.spyOn(component.taskSelected, 'emit');
    component['onCardClick']();
    expect(spy).toHaveBeenCalledWith(mockTask);
  });

  it('isOverdue_whenPastDueAndNotCompleted_shouldReturnTrue', () => {
    const pastTask = { ...mockTask, dueDate: new Date('2020-01-01') };
    fixture.componentRef.setInput('task', pastTask);
    fixture.detectChanges();
    expect(component['isOverdue']()).toBe(true);
  });
});
```

---

## 📚 參考資源

- [程式風格指南](../styleguide.md)
- [Angular 官方文檔](https://angular.dev)
- [ng-zorro-antd 元件庫](https://ng.ant.design)

---

**最後更新**: 2025-11-27

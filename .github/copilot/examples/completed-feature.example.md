# 完整垂直切片範例：任務模組

> 展示任務系統（主核心模組）的完整實作範例

---

## 📋 模組概述

### 功能說明

任務系統是工地管理的核心模組，提供：

- 任務樹狀結構管理
- 多視圖切換（樹狀圖、表格、看板）
- 任務狀態流轉
- 任務指派與追蹤
- 拖拉排序

### 已完成狀態

| 功能 | 狀態 |
|------|------|
| 任務樹元件 | ✅ 已完成 |
| 任務表格元件 | ✅ 已完成 |
| 視圖切換 | ✅ 已完成 |
| 搜尋篩選 | ✅ 已完成 |
| Store 狀態管理 | ✅ 已完成 |
| Repository | ✅ 已完成 |
| 建立/編輯對話框 | 🔶 進行中 |
| 拖拉排序 | ⬜ 待實現 |

---

## 📁 目錄結構

```
src/app/features/blueprint/
├── data-access/
│   ├── stores/
│   │   └── task.store.ts          ← 任務狀態管理
│   └── repositories/
│       └── task.repository.ts     ← 任務資料存取
├── domain/
│   ├── enums/
│   │   ├── task-status.enum.ts    ← 任務狀態枚舉
│   │   ├── task-priority.enum.ts  ← 任務優先級枚舉
│   │   └── task-type.enum.ts      ← 任務類型枚舉
│   └── interfaces/
│       └── task.interface.ts      ← 任務介面定義
└── ui/
    └── task/
        ├── task-tree/
        │   ├── task-tree.component.ts
        │   ├── task-tree.component.html
        │   └── task-tree.component.less
        └── task-table/
            ├── task-table.component.ts
            ├── task-table.component.html
            └── task-table.component.less
```

---

## 🔤 Domain 層實作

### 枚舉定義

```typescript
// domain/enums/task-status.enum.ts
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
}

export const TASK_STATUS_OPTIONS = [
  { value: TaskStatus.PENDING, label: '待處理', color: 'default' },
  { value: TaskStatus.IN_PROGRESS, label: '進行中', color: 'processing' },
  { value: TaskStatus.IN_REVIEW, label: '審核中', color: 'warning' },
  { value: TaskStatus.COMPLETED, label: '已完成', color: 'success' },
  { value: TaskStatus.CANCELLED, label: '已取消', color: 'error' },
  { value: TaskStatus.BLOCKED, label: '已阻塞', color: 'magenta' },
];
```

### 介面定義

```typescript
// domain/interfaces/task.interface.ts
export interface Task {
  id: string;
  blueprintId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;
  progress: number;
  parentId?: string;
  depth: number;
  sortOrder: number;
  assigneeId?: string;
  assignee?: AccountSummary;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskTreeNode extends Task {
  children: TaskTreeNode[];
  expanded: boolean;
  selected: boolean;
}

export interface CreateTaskDto {
  blueprintId: string;
  title: string;
  description?: string;
  parentId?: string;
  assigneeId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  progress?: number;
  assigneeId?: string;
}
```

---

## 📦 Data Access 層實作

### Repository

```typescript
// data-access/repositories/task.repository.ts
@Injectable({ providedIn: 'root' })
export class TaskRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = 'tasks';

  async findByBlueprint(blueprintId: string): Promise<Task[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        *,
        assignee:assignee_id(id, name, avatar_url)
      `)
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return this.mapToTasks(data ?? []);
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    // 計算深度與排序
    let depth = 0;
    let sortOrder = 0;

    if (dto.parentId) {
      const parent = await this.findById(dto.parentId);
      if (parent) {
        depth = parent.depth + 1;
        if (depth > 10) {
          throw new Error('任務層級不能超過 10 層');
        }
      }
    }

    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({
        blueprint_id: dto.blueprintId,
        title: dto.title,
        description: dto.description,
        parent_id: dto.parentId,
        depth,
        sort_order: sortOrder,
        assignee_id: dto.assigneeId,
        created_by: await this.supabase.getUserAccountId(),
      })
      .select(`*, assignee:assignee_id(id, name, avatar_url)`)
      .single();

    if (error) throw error;
    return this.mapToTask(data);
  }

  // ... 其他方法
}
```

### Store

```typescript
// data-access/stores/task.store.ts
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly repository = inject(TaskRepository);

  // 狀態
  private readonly _tasks = signal<Task[]>([]);
  private readonly _selectedTask = signal<Task | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _viewMode = signal<'tree' | 'table' | 'board'>('tree');
  private readonly _expandedIds = signal<Set<string>>(new Set());

  // 公開狀態
  readonly tasks = this._tasks.asReadonly();
  readonly selectedTask = this._selectedTask.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly viewMode = this._viewMode.asReadonly();

  // 計算屬性
  readonly taskTree = computed(() => this.buildTree(this._tasks()));
  readonly taskCount = computed(() => this._tasks().length);
  readonly pendingCount = computed(() => 
    this._tasks().filter(t => t.status === TaskStatus.PENDING).length
  );

  // 方法
  async loadTasks(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const tasks = await this.repository.findByBlueprint(blueprintId);
      this._tasks.set(tasks);
    } catch (error) {
      this._error.set('載入任務失敗');
    } finally {
      this._loading.set(false);
    }
  }

  async createTask(dto: CreateTaskDto): Promise<Task | null> {
    try {
      const task = await this.repository.create(dto);
      this._tasks.update(tasks => [...tasks, task]);
      return task;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : '建立任務失敗');
      return null;
    }
  }

  // 視圖切換
  setViewMode(mode: 'tree' | 'table' | 'board'): void {
    this._viewMode.set(mode);
  }

  // 展開/收合
  toggleExpand(taskId: string): void {
    this._expandedIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(taskId)) {
        newIds.delete(taskId);
      } else {
        newIds.add(taskId);
      }
      return newIds;
    });
  }

  // 建立樹狀結構
  private buildTree(tasks: Task[]): TaskTreeNode[] {
    const taskMap = new Map<string, TaskTreeNode>();
    const roots: TaskTreeNode[] = [];

    // 建立節點
    tasks.forEach(task => {
      taskMap.set(task.id, {
        ...task,
        children: [],
        expanded: this._expandedIds().has(task.id),
        selected: this._selectedTask()?.id === task.id,
      });
    });

    // 建立關係
    tasks.forEach(task => {
      const node = taskMap.get(task.id)!;
      if (task.parentId) {
        const parent = taskMap.get(task.parentId);
        parent?.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return this.sortTree(roots);
  }

  private sortTree(nodes: TaskTreeNode[]): TaskTreeNode[] {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach(node => {
      node.children = this.sortTree(node.children);
    });
    return nodes;
  }
}
```

---

## 🖼️ UI 層實作

### 任務樹元件

```typescript
// ui/task/task-tree/task-tree.component.ts
@Component({
  selector: 'app-task-tree',
  standalone: true,
  imports: [
    CommonModule,
    NzTreeModule,
    NzTagModule,
    NzAvatarModule,
    NzDropDownModule,
  ],
  templateUrl: './task-tree.component.html',
  styleUrl: './task-tree.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTreeComponent {
  // 輸入
  blueprintId = input.required<string>();
  
  // 輸出
  taskSelected = output<Task>();
  taskEdit = output<Task>();
  taskDelete = output<string>();

  // 注入
  private readonly store = inject(TaskStore);

  // 狀態
  protected readonly taskTree = this.store.taskTree;
  protected readonly loading = this.store.loading;
  protected readonly selectedTask = this.store.selectedTask;

  // 事件處理
  protected onNodeClick(node: TaskTreeNode): void {
    this.store.selectTask(node);
    this.taskSelected.emit(node);
  }

  protected onToggle(node: TaskTreeNode): void {
    this.store.toggleExpand(node.id);
  }

  protected onEdit(event: Event, node: TaskTreeNode): void {
    event.stopPropagation();
    this.taskEdit.emit(node);
  }

  protected onDelete(event: Event, node: TaskTreeNode): void {
    event.stopPropagation();
    this.taskDelete.emit(node.id);
  }

  protected getStatusColor(status: TaskStatus): string {
    return TASK_STATUS_OPTIONS.find(s => s.value === status)?.color ?? 'default';
  }
}
```

### 任務樹模板

```html
<!-- ui/task/task-tree/task-tree.component.html -->
<div class="task-tree">
  @if (loading()) {
    <div class="task-tree__loading">
      <nz-spin nzSize="large"></nz-spin>
    </div>
  } @else {
    <div class="task-tree__content">
      @for (node of taskTree(); track node.id) {
        <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node, level: 0 }">
        </ng-container>
      } @empty {
        <nz-empty nzNotFoundContent="暫無任務"></nz-empty>
      }
    </div>
  }
</div>

<ng-template #nodeTemplate let-node let-level="level">
  <div 
    class="task-tree__node"
    [class.task-tree__node--selected]="selectedTask()?.id === node.id"
    [style.padding-left.px]="level * 24"
    (click)="onNodeClick(node)"
  >
    <!-- 展開/收合 -->
    @if (node.children.length > 0) {
      <button 
        class="task-tree__toggle" 
        (click)="onToggle(node); $event.stopPropagation()"
      >
        <span nz-icon [nzType]="node.expanded ? 'caret-down' : 'caret-right'"></span>
      </button>
    } @else {
      <span class="task-tree__toggle-placeholder"></span>
    }

    <!-- 任務資訊 -->
    <div class="task-tree__info">
      <span class="task-tree__title">{{ node.title }}</span>
      <nz-tag [nzColor]="getStatusColor(node.status)" nzMode="default">
        {{ node.status | taskStatus }}
      </nz-tag>
    </div>

    <!-- 負責人 -->
    @if (node.assignee) {
      <nz-avatar 
        [nzSize]="24" 
        [nzSrc]="node.assignee.avatarUrl"
        [nzText]="node.assignee.name?.charAt(0)"
      ></nz-avatar>
    }

    <!-- 操作選單 -->
    <nz-dropdown-menu #actionMenu="nzDropdownMenu">
      <ul nz-menu>
        <li nz-menu-item (click)="onEdit($event, node)">編輯</li>
        <li nz-menu-item nzDanger (click)="onDelete($event, node)">刪除</li>
      </ul>
    </nz-dropdown-menu>
    <button 
      nz-button 
      nz-dropdown 
      [nzDropdownMenu]="actionMenu"
      nzType="text"
      (click)="$event.stopPropagation()"
    >
      <span nz-icon nzType="more"></span>
    </button>
  </div>

  <!-- 子節點 -->
  @if (node.expanded && node.children.length > 0) {
    @for (child of node.children; track child.id) {
      <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child, level: level + 1 }">
      </ng-container>
    }
  }
</ng-template>
```

### 任務樹樣式

```less
// ui/task/task-tree/task-tree.component.less
@import '~@delon/theme/styles/layout/default/mixins';

.task-tree {
  &__loading {
    display: flex;
    justify-content: center;
    padding: @padding-lg * 2;
  }

  &__node {
    display: flex;
    align-items: center;
    gap: @padding-sm;
    padding: @padding-sm @padding-md;
    cursor: pointer;
    border-radius: @border-radius-base;
    transition: background-color 0.2s;

    &:hover {
      background-color: @item-hover-bg;
    }

    &--selected {
      background-color: @primary-1;
    }
  }

  &__toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: @text-color-secondary;

    &:hover {
      color: @primary-color;
    }
  }

  &__toggle-placeholder {
    width: 24px;
  }

  &__info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: @padding-sm;
    min-width: 0;
  }

  &__title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
```

---

## 🧪 測試範例

### Store 測試

```typescript
// data-access/stores/task.store.spec.ts
describe('TaskStore', () => {
  let store: TaskStore;
  let repositoryMock: jest.Mocked<TaskRepository>;

  beforeEach(() => {
    repositoryMock = {
      findByBlueprint: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<TaskRepository>;

    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TaskRepository, useValue: repositoryMock },
      ],
    });

    store = TestBed.inject(TaskStore);
  });

  describe('taskTree computed', () => {
    it('taskTree_whenTasksHaveParent_shouldBuildHierarchy', () => {
      // Arrange
      const tasks = [
        { id: '1', title: 'Parent', parentId: null, depth: 0, sortOrder: 0 },
        { id: '2', title: 'Child', parentId: '1', depth: 1, sortOrder: 0 },
      ];
      store['_tasks'].set(tasks as Task[]);

      // Act
      const tree = store.taskTree();

      // Assert
      expect(tree.length).toBe(1);
      expect(tree[0].children.length).toBe(1);
      expect(tree[0].children[0].title).toBe('Child');
    });
  });

  describe('toggleExpand', () => {
    it('toggleExpand_whenNotExpanded_shouldAddToExpandedIds', () => {
      // Act
      store.toggleExpand('task-1');

      // Assert
      expect(store['_expandedIds']().has('task-1')).toBe(true);
    });

    it('toggleExpand_whenExpanded_shouldRemoveFromExpandedIds', () => {
      // Arrange
      store['_expandedIds'].set(new Set(['task-1']));

      // Act
      store.toggleExpand('task-1');

      // Assert
      expect(store['_expandedIds']().has('task-1')).toBe(false);
    });
  });
});
```

---

## 📚 參考資源

- [任務系統 Blueprint](../blueprints/task-module.blueprint.md)
- [PRD 任務系統需求](../../../docs/prd/construction-site-management.md)
- [程式風格指南](../styleguide.md)

---

**最後更新**: 2025-11-27

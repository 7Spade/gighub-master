# 任務系統模組 Blueprint

> 任務系統（主核心模組）的標準實作模板

---

## 🎯 概述

任務系統是工地管理的核心模組，所有其他業務模組都圍繞任務展開。

### 核心功能

- 任務 CRUD（建立、讀取、更新、刪除）
- 任務樹狀結構（父子任務關係）
- 任務狀態流轉
- 任務指派與追蹤
- 多視圖切換（樹狀圖、表格、看板）

---

## 📁 目錄結構

```
src/app/features/blueprint/
├── data-access/
│   ├── stores/
│   │   └── task.store.ts
│   ├── services/
│   │   └── task.service.ts
│   └── repositories/
│       └── task.repository.ts
├── domain/
│   ├── enums/
│   │   ├── task-status.enum.ts
│   │   ├── task-priority.enum.ts
│   │   └── task-type.enum.ts
│   ├── interfaces/
│   │   └── task.interface.ts
│   └── models/
│       └── task.model.ts
└── ui/
    └── task/
        ├── task-tree/
        │   ├── task-tree.component.ts
        │   ├── task-tree.component.html
        │   └── task-tree.component.less
        ├── task-table/
        │   ├── task-table.component.ts
        │   ├── task-table.component.html
        │   └── task-table.component.less
        ├── task-board/
        │   ├── task-board.component.ts
        │   ├── task-board.component.html
        │   └── task-board.component.less
        └── task-form-dialog/
            ├── task-form-dialog.component.ts
            ├── task-form-dialog.component.html
            └── task-form-dialog.component.less
```

---

## 📋 Domain 層

### Enums

```typescript
// domain/enums/task-status.enum.ts
export enum TaskStatus {
  PENDING = 'pending',       // 待處理
  IN_PROGRESS = 'in_progress', // 進行中
  IN_REVIEW = 'in_review',   // 審核中
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled',   // 已取消
  BLOCKED = 'blocked',       // 已阻塞
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '待處理',
  [TaskStatus.IN_PROGRESS]: '進行中',
  [TaskStatus.IN_REVIEW]: '審核中',
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.CANCELLED]: '已取消',
  [TaskStatus.BLOCKED]: '已阻塞',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'default',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.IN_REVIEW]: 'warning',
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.CANCELLED]: 'error',
  [TaskStatus.BLOCKED]: 'magenta',
};
```

```typescript
// domain/enums/task-priority.enum.ts
export enum TaskPriority {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest',
}

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.LOWEST]: '最低',
  [TaskPriority.LOW]: '低',
  [TaskPriority.MEDIUM]: '中',
  [TaskPriority.HIGH]: '高',
  [TaskPriority.HIGHEST]: '最高',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.LOWEST]: 'default',
  [TaskPriority.LOW]: 'green',
  [TaskPriority.MEDIUM]: 'blue',
  [TaskPriority.HIGH]: 'orange',
  [TaskPriority.HIGHEST]: 'red',
};
```

### Interface

```typescript
// domain/interfaces/task.interface.ts
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskType } from '../enums/task-type.enum';

export interface Task {
  id: string;
  blueprintId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;

  // 時間
  startDate?: Date;
  dueDate?: Date;
  completedAt?: Date;

  // 進度
  progress: number; // 0-100

  // 層級
  parentId?: string;
  depth: number;
  sortOrder: number;

  // 關聯
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdById: string;

  // 時間戳
  createdAt: Date;
  updatedAt: Date;

  // 子任務（前端計算）
  children?: Task[];
}

export interface CreateTaskDto {
  blueprintId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  taskType?: TaskType;
  startDate?: Date;
  dueDate?: Date;
  parentId?: string;
  assigneeId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  taskType?: TaskType;
  startDate?: Date;
  dueDate?: Date;
  progress?: number;
  assigneeId?: string;
}

export interface TaskTreeNode extends Task {
  children: TaskTreeNode[];
  expanded?: boolean;
  selected?: boolean;
}
```

---

## 📦 Data Access 層

### Repository

```typescript
// data-access/repositories/task.repository.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Task, CreateTaskDto, UpdateTaskDto } from '../../domain/interfaces/task.interface';

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

  async findById(id: string): Promise<Task | null> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        *,
        assignee:assignee_id(id, name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapToTask(data);
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    // 計算 depth 和 sort_order
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

    // 取得同層級的最大 sort_order
    const siblings = await this.getSiblings(dto.blueprintId, dto.parentId);
    sortOrder = siblings.length > 0 
      ? Math.max(...siblings.map(s => s.sortOrder)) + 1 
      : 0;

    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({
        blueprint_id: dto.blueprintId,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? 'pending',
        priority: dto.priority ?? 'medium',
        task_type: dto.taskType ?? 'task',
        start_date: dto.startDate?.toISOString(),
        due_date: dto.dueDate?.toISOString(),
        parent_id: dto.parentId,
        depth,
        sort_order: sortOrder,
        assignee_id: dto.assigneeId,
        created_by: await this.supabase.getUserAccountId(),
      })
      .select(`
        *,
        assignee:assignee_id(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return this.mapToTask(data);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.taskType !== undefined) updateData.task_type = dto.taskType;
    if (dto.startDate !== undefined) updateData.start_date = dto.startDate?.toISOString();
    if (dto.dueDate !== undefined) updateData.due_date = dto.dueDate?.toISOString();
    if (dto.progress !== undefined) updateData.progress = dto.progress;
    if (dto.assigneeId !== undefined) updateData.assignee_id = dto.assigneeId;

    // 如果更新為完成狀態，記錄完成時間
    if (dto.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assignee:assignee_id(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return this.mapToTask(data);
  }

  async delete(id: string): Promise<void> {
    // 軟刪除
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  async updateSortOrder(id: string, sortOrder: number): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .update({ sort_order: sortOrder })
      .eq('id', id);

    if (error) throw error;
  }

  private async getSiblings(blueprintId: string, parentId?: string): Promise<Task[]> {
    let query = this.supabase.client
      .from(this.TABLE)
      .select('sort_order')
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null);

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data?.map(d => ({ sortOrder: d.sort_order })) as Task[];
  }

  private mapToTask(row: Record<string, unknown>): Task {
    return {
      id: row['id'] as string,
      blueprintId: row['blueprint_id'] as string,
      title: row['title'] as string,
      description: row['description'] as string | undefined,
      status: row['status'] as TaskStatus,
      priority: row['priority'] as TaskPriority,
      taskType: row['task_type'] as TaskType,
      startDate: row['start_date'] ? new Date(row['start_date'] as string) : undefined,
      dueDate: row['due_date'] ? new Date(row['due_date'] as string) : undefined,
      completedAt: row['completed_at'] ? new Date(row['completed_at'] as string) : undefined,
      progress: row['progress'] as number,
      parentId: row['parent_id'] as string | undefined,
      depth: row['depth'] as number,
      sortOrder: row['sort_order'] as number,
      assigneeId: row['assignee_id'] as string | undefined,
      assignee: row['assignee'] as Task['assignee'],
      createdById: row['created_by'] as string,
      createdAt: new Date(row['created_at'] as string),
      updatedAt: new Date(row['updated_at'] as string),
    };
  }

  private mapToTasks(rows: Record<string, unknown>[]): Task[] {
    return rows.map(row => this.mapToTask(row));
  }
}
```

### Store

```typescript
// data-access/stores/task.store.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { TaskRepository } from '../repositories/task.repository';
import { Task, CreateTaskDto, UpdateTaskDto, TaskTreeNode } from '../../domain/interfaces/task.interface';

@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly repository = inject(TaskRepository);

  // 私有狀態
  private readonly _tasks = signal<Task[]>([]);
  private readonly _selectedTask = signal<Task | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // 公開唯讀狀態
  readonly tasks = this._tasks.asReadonly();
  readonly selectedTask = this._selectedTask.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 計算屬性
  readonly taskCount = computed(() => this._tasks().length);

  readonly taskTree = computed(() => this.buildTree(this._tasks()));

  readonly rootTasks = computed(() =>
    this._tasks().filter(t => !t.parentId)
  );

  readonly pendingTasks = computed(() =>
    this._tasks().filter(t => t.status === 'pending')
  );

  readonly overdueTasks = computed(() =>
    this._tasks().filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < new Date() && 
      t.status !== 'completed' && 
      t.status !== 'cancelled'
    )
  );

  /**
   * 載入藍圖的所有任務
   */
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

  /**
   * 建立任務
   */
  async createTask(dto: CreateTaskDto): Promise<Task | null> {
    try {
      const task = await this.repository.create(dto);
      this._tasks.update(tasks => [...tasks, task]);
      return task;
    } catch (error) {
      this._error.set(error instanceof Error ? error.message : '建立任務失敗');
      console.error('[TaskStore] createTask error:', error);
      return null;
    }
  }

  /**
   * 更新任務
   */
  async updateTask(id: string, dto: UpdateTaskDto): Promise<boolean> {
    try {
      const updated = await this.repository.update(id, dto);
      this._tasks.update(tasks =>
        tasks.map(t => (t.id === id ? updated : t))
      );
      if (this._selectedTask()?.id === id) {
        this._selectedTask.set(updated);
      }
      return true;
    } catch (error) {
      this._error.set('更新任務失敗');
      console.error('[TaskStore] updateTask error:', error);
      return false;
    }
  }

  /**
   * 刪除任務
   */
  async deleteTask(id: string): Promise<boolean> {
    try {
      await this.repository.delete(id);
      this._tasks.update(tasks => tasks.filter(t => t.id !== id));
      if (this._selectedTask()?.id === id) {
        this._selectedTask.set(null);
      }
      return true;
    } catch (error) {
      this._error.set('刪除任務失敗');
      console.error('[TaskStore] deleteTask error:', error);
      return false;
    }
  }

  /**
   * 選擇任務
   */
  selectTask(task: Task | null): void {
    this._selectedTask.set(task);
  }

  /**
   * 取得子任務
   */
  getChildTasks(parentId: string): Task[] {
    return this._tasks().filter(t => t.parentId === parentId);
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._tasks.set([]);
    this._selectedTask.set(null);
    this._loading.set(false);
    this._error.set(null);
  }

  /**
   * 建立樹狀結構
   */
  private buildTree(tasks: Task[]): TaskTreeNode[] {
    const taskMap = new Map<string, TaskTreeNode>();
    const roots: TaskTreeNode[] = [];

    // 建立所有節點
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [] });
    });

    // 建立父子關係
    tasks.forEach(task => {
      const node = taskMap.get(task.id)!;
      if (task.parentId) {
        const parent = taskMap.get(task.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // 排序
    const sortChildren = (nodes: TaskTreeNode[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      nodes.forEach(node => sortChildren(node.children));
    };
    sortChildren(roots);

    return roots;
  }
}
```

---

## 📚 參考資源

- [系統架構設計圖](../../../docs/architecture/system-architecture.md)
- [PRD 任務系統需求](../../../docs/prd/construction-site-management.md)
- [Feature 標準結構](./angular-feature.blueprint.md)

---

**最後更新**: 2025-11-27

# 任務管理模組 - 詳細開發指南

## 概述

本文檔提供任務管理模組的詳細開發實作指南，作為 GigHub 平台下一階段開發的參考。

---

## 1. 資料庫 Schema 設計

### 1.1 SQL 遷移腳本

建議創建以下 Supabase 遷移文件：

```sql
-- supabase/migrations/YYYYMMDD_create_tasks.sql

-- ============================================================================
-- 1. 枚舉類型定義
-- ============================================================================

-- 任務狀態 (注意：資料庫已有定義，此處為參考)
-- 已存在於 init.sql: task_status ENUM ('pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked')

-- 任務優先級 (注意：資料庫已有定義，此處為參考)
-- 已存在於 init.sql: task_priority ENUM ('lowest', 'low', 'medium', 'high', 'highest')

-- 任務依賴類型
CREATE TYPE dependency_type AS ENUM (
    'finish_to_start',   -- 完成後開始 (FS)
    'start_to_start',    -- 同時開始 (SS)
    'finish_to_finish',  -- 同時完成 (FF)
    'start_to_finish'    -- 開始後完成 (SF)
);

-- 注意：啟用 ltree 擴展 (如果需要使用階層路徑功能)
-- CREATE EXTENSION IF NOT EXISTS ltree;

-- ============================================================================
-- 2. 任務表擴展欄位 (基於現有 tasks 表)
-- 現有表結構請參考 supabase/seeds/init.sql
-- 以下是建議的擴展欄位
-- ============================================================================

-- 如需添加額外欄位，使用 ALTER TABLE:
-- ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ;
-- ALTER TABLE tasks ADD COLUMN estimated_hours DECIMAL(10,2);
-- ALTER TABLE tasks ADD COLUMN actual_hours DECIMAL(10,2);
-- ALTER TABLE tasks ADD COLUMN tags TEXT[] DEFAULT '{}';
-- ALTER TABLE tasks ADD COLUMN level INTEGER DEFAULT 0;

-- ============================================================================
-- 3. 任務指派表 (多人指派支援)
-- ============================================================================

CREATE TABLE task_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'assignee', -- assignee, reviewer, watcher
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES accounts(id),
    
    UNIQUE(task_id, account_id)
);

CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_account ON task_assignments(account_id);

-- ============================================================================
-- 4. 任務依賴關係表
-- ============================================================================

CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    predecessor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    successor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type dependency_type NOT NULL DEFAULT 'finish_to_start',
    lag_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(predecessor_id, successor_id),
    CONSTRAINT no_self_dependency CHECK (predecessor_id != successor_id)
);

CREATE INDEX idx_task_deps_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX idx_task_deps_successor ON task_dependencies(successor_id);

-- ============================================================================
-- 5. 任務評論/活動表
-- ============================================================================

CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES accounts(id),
    content TEXT NOT NULL,
    is_activity BOOLEAN DEFAULT false, -- true = 系統活動記錄
    activity_type VARCHAR(50), -- status_change, assignment, etc.
    activity_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_task_comments_task ON task_comments(task_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 6. RLS 政策
-- ============================================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- 任務 RLS: 藍圖成員可讀取
CREATE POLICY "Tasks are viewable by blueprint members" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM blueprint_members bm
            WHERE bm.blueprint_id = tasks.blueprint_id
            AND bm.account_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM blueprints b
            WHERE b.id = tasks.blueprint_id
            AND b.owner_id = auth.uid()
        )
    );

-- 任務 RLS: contributor 以上可編輯
CREATE POLICY "Tasks are editable by contributors" ON tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM blueprint_members bm
            WHERE bm.blueprint_id = tasks.blueprint_id
            AND bm.account_id = auth.uid()
            AND bm.role IN ('contributor', 'maintainer')
        )
        OR
        EXISTS (
            SELECT 1 FROM blueprints b
            WHERE b.id = tasks.blueprint_id
            AND b.owner_id = auth.uid()
        )
    );

-- ============================================================================
-- 7. 觸發器
-- ============================================================================

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 計算子任務進度
CREATE OR REPLACE FUNCTION update_parent_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_id UUID;
    avg_progress INTEGER;
BEGIN
    v_parent_id := COALESCE(NEW.parent_id, OLD.parent_id);
    
    IF v_parent_id IS NOT NULL THEN
        SELECT COALESCE(AVG(completion_rate), 0)::INTEGER
        INTO avg_progress
        FROM tasks
        WHERE tasks.parent_id = v_parent_id AND tasks.deleted_at IS NULL;
        
        UPDATE tasks SET completion_rate = avg_progress
        WHERE tasks.id = v_parent_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_task_progress
    AFTER INSERT OR UPDATE OF completion_rate OR DELETE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_progress();
```

---

## 2. TypeScript 型別定義

### 2.1 `src/app/core/infra/types/task/index.ts`

```typescript
/**
 * Task Types Module
 * 任務類型定義模組
 */

// ============================================================================
// Enums (與 supabase/seeds/init.sql 保持一致)
// ============================================================================

/**
 * 任務狀態枚舉
 * 對應資料庫: task_status
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked'
}

/**
 * 任務優先級枚舉
 * 對應資料庫: task_priority
 */
export enum TaskPriority {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest'
}

export enum DependencyType {
  FINISH_TO_START = 'finish_to_start',
  START_TO_START = 'start_to_start',
  FINISH_TO_FINISH = 'finish_to_finish',
  START_TO_FINISH = 'start_to_finish'
}

export enum AssignmentRole {
  ASSIGNEE = 'assignee',
  REVIEWER = 'reviewer',
  WATCHER = 'watcher'
}

// ============================================================================
// Entity Interfaces (與 supabase/seeds/init.sql 保持一致)
// ============================================================================

/**
 * 任務實體介面
 * 對應資料庫: tasks 表
 */
export interface Task {
  id: string;
  blueprint_id: string;
  parent_id?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string | null;  // 負責人
  reviewer_id?: string | null;  // 審核人
  start_date?: string | null;
  due_date?: string | null;
  completion_rate: number;      // 完成度 0-100
  sort_order: number;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  account_id: string;
  role: AssignmentRole;
  assigned_at?: string;
  assigned_by?: string | null;
}

export interface TaskDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  dependency_type: DependencyType;
  lag_days: number;
  created_at?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  is_activity: boolean;
  activity_type?: string | null;
  activity_data?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// ============================================================================
// Query Options
// ============================================================================

export interface TaskQueryOptions {
  blueprintId?: string;
  parentId?: string | null;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assigneeId?: string;  // 對應 assignee_id 欄位
  dueBefore?: string;
  dueAfter?: string;
  includeDeleted?: boolean;
  includeSubtasks?: boolean;
}

export interface TaskSortOptions {
  field: 'title' | 'status' | 'priority' | 'due_date' | 'created_at' | 'sort_order';
  direction: 'asc' | 'desc';
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateTaskRequest {
  blueprintId: string;
  parentId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  assigneeId?: string;
  reviewerId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  completionRate?: number;
  assigneeId?: string | null;
  reviewerId?: string | null;
}

export interface BatchUpdateTaskRequest {
  taskIds: string[];
  updates: Partial<UpdateTaskRequest>;
}
```

---

## 3. Repository 實作

### 3.1 `src/app/core/infra/repositories/task/task.repository.ts`

```typescript
/**
 * Task Repository
 * 任務資料存取層
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { Task, TaskQueryOptions, TaskSortOptions } from '../../types/task';

@Injectable({
  providedIn: 'root'
})
export class TaskRepository {
  private readonly supabase = inject(SupabaseService);

  /**
   * 根據 ID 查詢任務
   */
  findById(id: string): Observable<Task | null> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] findById error:', error);
          return null;
        }
        return data as Task;
      })
    );
  }

  /**
   * 查詢藍圖下的任務
   */
  findByBlueprint(
    blueprintId: string,
    options?: TaskQueryOptions,
    sort?: TaskSortOptions
  ): Observable<Task[]> {
    let query = this.supabase.client
      .from('tasks')
      .select('*')
      .eq('blueprint_id', blueprintId);

    if (!options?.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    if (options?.parentId !== undefined) {
      query = options.parentId === null 
        ? query.is('parent_id', null)
        : query.eq('parent_id', options.parentId);
    }

    if (options?.status) {
      const statuses = Array.isArray(options.status) 
        ? options.status 
        : [options.status];
      query = query.in('status', statuses);
    }

    if (options?.priority) {
      const priorities = Array.isArray(options.priority) 
        ? options.priority 
        : [options.priority];
      query = query.in('priority', priorities);
    }

    if (options?.assigneeId) {
      query = query.eq('assignee_id', options.assigneeId);
    }

    if (options?.dueBefore) {
      query = query.lte('due_date', options.dueBefore);
    }

    if (options?.dueAfter) {
      query = query.gte('due_date', options.dueAfter);
    }

    // 排序
    const sortField = sort?.field || 'sort_order';
    const sortDir = sort?.direction || 'asc';
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 查詢子任務
   */
  findChildren(parentId: string): Observable<Task[]> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('parent_id', parentId)
        .is('deleted_at', null)
        .order('sort_order')
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] findChildren error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 創建任務
   */
  create(task: Partial<Task>): Observable<Task | null> {
    return from(
      this.supabase.client
        .from('tasks')
        .insert(task)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] create error:', error);
          return null;
        }
        return data as Task;
      })
    );
  }

  /**
   * 更新任務
   */
  update(id: string, updates: Partial<Task>): Observable<Task | null> {
    return from(
      this.supabase.client
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] update error:', error);
          return null;
        }
        return data as Task;
      })
    );
  }

  /**
   * 批量更新任務
   */
  batchUpdate(ids: string[], updates: Partial<Task>): Observable<Task[]> {
    return from(
      this.supabase.client
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .in('id', ids)
        .select()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] batchUpdate error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 軟刪除任務
   */
  softDelete(id: string): Observable<boolean> {
    return from(
      this.supabase.client
        .from('tasks')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('[TaskRepository] softDelete error:', error);
          return false;
        }
        return true;
      })
    );
  }

  /**
   * 更新排序
   */
  updateSortOrder(taskOrders: { id: string; sort_order: number }[]): Observable<boolean> {
    // 使用 upsert 批量更新排序
    const updates = taskOrders.map(t => ({
      id: t.id,
      sort_order: t.sort_order,
      updated_at: new Date().toISOString()
    }));

    return from(
      this.supabase.client
        .from('tasks')
        .upsert(updates, { onConflict: 'id' })
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('[TaskRepository] updateSortOrder error:', error);
          return false;
        }
        return true;
      })
    );
  }
}
```

---

## 4. 服務層實作

### 4.1 `src/app/shared/services/task/task.service.ts`

```typescript
/**
 * Task Service
 * 任務業務服務
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  TaskRepository, 
  Task, 
  TaskStatus, 
  TaskPriority,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQueryOptions 
} from '@core';
import { firstValueFrom } from 'rxjs';

export interface TaskWithChildren extends Task {
  children?: TaskWithChildren[];
  isExpanded?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly taskRepo = inject(TaskRepository);

  // State
  private tasksState = signal<Task[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);
  private currentBlueprintId = signal<string | null>(null);

  // Readonly signals
  readonly tasks = this.tasksState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // Computed signals
  readonly taskTree = computed<TaskWithChildren[]>(() => {
    return this.buildTaskTree(this.tasksState());
  });

  readonly tasksByStatus = computed<Record<TaskStatus, Task[]>>(() => {
    const result = {} as Record<TaskStatus, Task[]>;
    Object.values(TaskStatus).forEach(status => {
      result[status] = this.tasksState().filter(t => t.status === status);
    });
    return result;
  });

  readonly taskStats = computed(() => {
    const tasks = this.tasksState();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const inReview = tasks.filter(t => t.status === TaskStatus.IN_REVIEW).length;
    const overdue = tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < new Date() && 
      t.status !== TaskStatus.COMPLETED
    ).length;

    return {
      total,
      completed,
      inProgress,
      inReview,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  /**
   * 載入藍圖任務
   */
  async loadTasks(blueprintId: string, options?: TaskQueryOptions): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.currentBlueprintId.set(blueprintId);

    try {
      const tasks = await firstValueFrom(
        this.taskRepo.findByBlueprint(blueprintId, options)
      );
      this.tasksState.set(tasks);
    } catch (err) {
      console.error('[TaskService] loadTasks error:', err);
      this.errorState.set(err instanceof Error ? err.message : '載入任務失敗');
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 創建任務
   */
  async createTask(request: CreateTaskRequest): Promise<Task> {
    const taskData: Partial<Task> = {
      blueprint_id: request.blueprintId,
      parent_id: request.parentId || null,
      title: request.title,
      description: request.description,
      status: request.status || TaskStatus.PENDING,
      priority: request.priority || TaskPriority.MEDIUM,
      start_date: request.startDate,
      due_date: request.dueDate,
      assignee_id: request.assigneeId,
      completion_rate: 0
    };

    const task = await firstValueFrom(this.taskRepo.create(taskData));
    if (!task) {
      throw new Error('創建任務失敗');
    }

    // 更新本地狀態
    this.tasksState.update(tasks => [...tasks, task]);
    return task;
  }

  /**
   * 更新任務
   */
  async updateTask(id: string, request: UpdateTaskRequest): Promise<Task> {
    const updates: Partial<Task> = {};

    if (request.title !== undefined) updates.title = request.title;
    if (request.description !== undefined) updates.description = request.description;
    if (request.status !== undefined) updates.status = request.status;
    if (request.priority !== undefined) updates.priority = request.priority;
    if (request.startDate !== undefined) updates.start_date = request.startDate;
    if (request.dueDate !== undefined) updates.due_date = request.dueDate;
    if (request.completionRate !== undefined) updates.completion_rate = request.completionRate;
    if (request.assigneeId !== undefined) updates.assignee_id = request.assigneeId;
    if (request.reviewerId !== undefined) updates.reviewer_id = request.reviewerId;

    const task = await firstValueFrom(this.taskRepo.update(id, updates));
    if (!task) {
      throw new Error('更新任務失敗');
    }

    // 更新本地狀態
    this.tasksState.update(tasks => 
      tasks.map(t => t.id === id ? task : t)
    );

    return task;
  }

  /**
   * 刪除任務
   */
  async deleteTask(id: string): Promise<void> {
    const success = await firstValueFrom(this.taskRepo.softDelete(id));
    if (!success) {
      throw new Error('刪除任務失敗');
    }

    // 更新本地狀態
    this.tasksState.update(tasks => tasks.filter(t => t.id !== id));
  }

  /**
   * 更改任務狀態
   */
  async changeStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.updateTask(id, { status });
  }

  /**
   * 批量更改狀態
   */
  async batchChangeStatus(ids: string[], status: TaskStatus): Promise<void> {
    const updates: Partial<Task> = { status };
    if (status === TaskStatus.COMPLETED) {
      updates.completed_at = new Date().toISOString();
    }

    const tasks = await firstValueFrom(this.taskRepo.batchUpdate(ids, updates));
    
    // 更新本地狀態
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    this.tasksState.update(current => 
      current.map(t => taskMap.get(t.id) || t)
    );
  }

  /**
   * 重新排序任務
   */
  async reorderTasks(taskOrders: { id: string; sort_order: number }[]): Promise<void> {
    const success = await firstValueFrom(this.taskRepo.updateSortOrder(taskOrders));
    if (!success) {
      throw new Error('排序更新失敗');
    }

    // 更新本地狀態
    const orderMap = new Map(taskOrders.map(t => [t.id, t.sort_order]));
    this.tasksState.update(tasks => 
      tasks.map(t => ({
        ...t,
        sort_order: orderMap.get(t.id) ?? t.sort_order
      }))
    );
  }

  /**
   * 構建任務樹結構
   */
  private buildTaskTree(tasks: Task[]): TaskWithChildren[] {
    const taskMap = new Map<string, TaskWithChildren>();
    const rootTasks: TaskWithChildren[] = [];

    // 初始化所有任務
    tasks.forEach(task => {
      taskMap.set(task.id, { ...task, children: [], isExpanded: true });
    });

    // 建立父子關係
    tasks.forEach(task => {
      const taskWithChildren = taskMap.get(task.id)!;
      if (task.parent_id && taskMap.has(task.parent_id)) {
        taskMap.get(task.parent_id)!.children!.push(taskWithChildren);
      } else {
        rootTasks.push(taskWithChildren);
      }
    });

    // 排序
    const sortByOrder = (a: TaskWithChildren, b: TaskWithChildren) => 
      a.sort_order - b.sort_order;

    const sortRecursive = (tasks: TaskWithChildren[]) => {
      tasks.sort(sortByOrder);
      tasks.forEach(t => {
        if (t.children?.length) {
          sortRecursive(t.children);
        }
      });
    };

    sortRecursive(rootTasks);
    return rootTasks;
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this.tasksState.set([]);
    this.loadingState.set(false);
    this.errorState.set(null);
    this.currentBlueprintId.set(null);
  }
}
```

---

## 5. 組件開發建議

### 5.1 任務列表組件結構

```
src/app/routes/blueprint/tasks/
├── tasks.component.ts           # 主組件（視圖切換）
├── components/
│   ├── task-list/              # 列表視圖
│   │   ├── task-list.component.ts
│   │   └── task-list.component.html
│   ├── task-board/             # 看板視圖
│   │   ├── task-board.component.ts
│   │   └── task-board.component.html
│   ├── task-form/              # 任務表單
│   │   ├── task-form.component.ts
│   │   └── task-form.component.html
│   └── task-filters/           # 篩選器
│       └── task-filters.component.ts
└── routes.ts
```

### 5.2 核心組件範例

```typescript
// task-list.component.ts

import { Component, inject, signal, computed } from '@angular/core';
import { TaskService, TaskStatus, TaskPriority } from '@shared';
import { NzTableModule } from 'ng-zorro-antd/table';
// ... 其他 imports

@Component({
  selector: 'app-task-list',
  template: `
    <nz-table 
      [nzData]="tasks()" 
      [nzLoading]="taskService.loading()"
      [nzPageSize]="20"
    >
      <thead>
        <tr>
          <th nzWidth="40px"><label nz-checkbox [(ngModel)]="allChecked"></label></th>
          <th nzSortFn="sortByTitle">任務名稱</th>
          <th nzWidth="100px" nzSortFn="sortByStatus">狀態</th>
          <th nzWidth="100px" nzSortFn="sortByPriority">優先級</th>
          <th nzWidth="120px">負責人</th>
          <th nzWidth="120px" nzSortFn="sortByDueDate">截止日期</th>
          <th nzWidth="100px">進度</th>
          <th nzWidth="120px">操作</th>
        </tr>
      </thead>
      <tbody>
        @for (task of tasks(); track task.id) {
          <tr>
            <td><label nz-checkbox></label></td>
            <td>
              <div class="task-title">
                @if (task.children?.length) {
                  <button nz-button nzType="link" nzSize="small" 
                    (click)="toggleExpand(task)">
                    <span nz-icon [nzType]="task.isExpanded ? 'minus-square' : 'plus-square'"></span>
                  </button>
                }
                <span [style.margin-left.px]="task.level * 20">{{ task.title }}</span>
              </div>
            </td>
            <td><nz-tag [nzColor]="getStatusColor(task.status)">{{ getStatusLabel(task.status) }}</nz-tag></td>
            <td><nz-tag [nzColor]="getPriorityColor(task.priority)">{{ getPriorityLabel(task.priority) }}</nz-tag></td>
            <td>{{ task.assignee_id || '-' }}</td>
            <td>{{ task.due_date | date:'yyyy-MM-dd' }}</td>
            <td><nz-progress [nzPercent]="task.completion_rate" nzSize="small"></nz-progress></td>
            <td>
              <button nz-button nzType="link" (click)="editTask(task)">編輯</button>
              <button nz-button nzType="link" nzDanger 
                nz-popconfirm nzPopconfirmTitle="確定刪除？"
                (nzOnConfirm)="deleteTask(task)">刪除</button>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `
})
export class TaskListComponent {
  readonly taskService = inject(TaskService);
  readonly tasks = this.taskService.taskTree;
  // ... 其餘實作
}
```

---

## 6. 實作檢查清單

### Phase 1: 基礎設施 (Week 1)

- [ ] 創建資料庫遷移腳本
- [ ] 設定 RLS 政策
- [ ] 創建 TypeScript 型別定義 (`core/infra/types/task`)
- [ ] 實作 TaskRepository (`core/infra/repositories/task`)
- [ ] 更新 core/index.ts 導出

### Phase 2: 服務層 (Week 2)

- [ ] 實作 TaskService (`shared/services/task`)
- [ ] 創建 TaskFacade (`core/facades`)
- [ ] 添加任務業務模型 (`shared/models/task`)
- [ ] 更新 shared/index.ts 導出

### Phase 3: UI 組件 (Week 3-4)

- [ ] 創建 TaskListComponent
- [ ] 創建 TaskFormComponent (Modal)
- [ ] 創建 TaskFiltersComponent
- [ ] 實作拖拽排序
- [ ] 實作批量操作

### Phase 4: 增強功能 (Week 5-6)

- [ ] 子任務管理
- [ ] 任務依賴關係
- [ ] 評論/活動記錄
- [ ] 實時更新 (Supabase Realtime)

---

*文檔版本: 1.0*  
*更新日期: 2025-01-01*

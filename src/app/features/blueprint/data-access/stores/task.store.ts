/**
 * Task Store
 *
 * 任務狀態管理（使用 Angular Signals）
 *
 * @module features/blueprint/data-access/stores
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { Task, TaskTreeNode, CreateTaskRequest, UpdateTaskRequest, TaskFilter } from '../../domain';
import { TaskStatus } from '../../domain/enums';
import { TaskRepository } from '../repositories/task.repository';

@Injectable({
  providedIn: 'root'
})
export class TaskStore {
  private readonly repository = inject(TaskRepository);

  // 私有狀態
  private readonly _tasks = signal<Task[]>([]);
  private readonly _selectedTask = signal<Task | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filter = signal<TaskFilter>({});

  // 公開唯讀狀態
  readonly tasks = this._tasks.asReadonly();
  readonly selectedTask = this._selectedTask.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filter = this._filter.asReadonly();

  // 計算屬性
  readonly taskCount = computed(() => this._tasks().length);

  readonly taskTree = computed(() => {
    const tasks = this._tasks();
    return this.buildTree(tasks);
  });

  readonly pendingTasks = computed(() =>
    this._tasks().filter(t => t.status === TaskStatus.PENDING)
  );

  readonly inProgressTasks = computed(() =>
    this._tasks().filter(t => t.status === TaskStatus.IN_PROGRESS)
  );

  readonly completedTasks = computed(() =>
    this._tasks().filter(t => t.status === TaskStatus.COMPLETED)
  );

  readonly completionRate = computed(() => {
    const tasks = this._tasks();
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    return Math.round((completed / tasks.length) * 100);
  });

  /**
   * 載入藍圖的所有任務
   */
  async loadTasks(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const tasks = await this.repository.findByBlueprintId(blueprintId);
      this._tasks.set(tasks);
    } catch (error) {
      this._error.set('載入任務失敗');
      console.error('[TaskStore] loadTasks error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 根據篩選條件載入任務
   */
  async loadTasksWithFilter(blueprintId: string, filter: TaskFilter): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._filter.set(filter);

    try {
      const tasks = await this.repository.findByFilter(blueprintId, filter);
      this._tasks.set(tasks);
    } catch (error) {
      this._error.set('載入任務失敗');
      console.error('[TaskStore] loadTasksWithFilter error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 選取任務
   */
  async selectTask(taskId: string): Promise<void> {
    const task = await this.repository.findById(taskId);
    this._selectedTask.set(task);
  }

  /**
   * 清除選取
   */
  clearSelection(): void {
    this._selectedTask.set(null);
  }

  /**
   * 建立任務
   */
  async createTask(request: CreateTaskRequest): Promise<Task> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const task = await this.repository.create(request);
      this._tasks.update(tasks => [...tasks, task]);
      return task;
    } catch (error) {
      this._error.set('建立任務失敗');
      console.error('[TaskStore] createTask error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 更新任務
   */
  async updateTask(id: string, request: UpdateTaskRequest): Promise<Task> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const task = await this.repository.update(id, request);
      this._tasks.update(tasks =>
        tasks.map(t => (t.id === id ? task : t))
      );
      if (this._selectedTask()?.id === id) {
        this._selectedTask.set(task);
      }
      return task;
    } catch (error) {
      this._error.set('更新任務失敗');
      console.error('[TaskStore] updateTask error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 更新任務狀態
   */
  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.updateTask(id, { status });
  }

  /**
   * 刪除任務
   */
  async deleteTask(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.repository.softDelete(id);
      this._tasks.update(tasks => tasks.filter(t => t.id !== id));
      if (this._selectedTask()?.id === id) {
        this._selectedTask.set(null);
      }
    } catch (error) {
      this._error.set('刪除任務失敗');
      console.error('[TaskStore] deleteTask error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._tasks.set([]);
    this._selectedTask.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._filter.set({});
  }

  /**
   * 建構任務樹
   */
  private buildTree(tasks: Task[]): TaskTreeNode[] {
    const taskMap = new Map<string, TaskTreeNode>();
    const roots: TaskTreeNode[] = [];

    // 先建立所有節點
    tasks.forEach(task => {
      taskMap.set(task.id, {
        ...task,
        children: [],
        expanded: true,
        level: 0
      });
    });

    // 建構父子關係
    tasks.forEach(task => {
      const node = taskMap.get(task.id)!;
      if (task.parent_id && taskMap.has(task.parent_id)) {
        const parent = taskMap.get(task.parent_id)!;
        node.level = parent.level + 1;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // 排序
    const sortNodes = (nodes: TaskTreeNode[]): TaskTreeNode[] => {
      return nodes
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(node => ({
          ...node,
          children: sortNodes(node.children)
        }));
    };

    return sortNodes(roots);
  }
}

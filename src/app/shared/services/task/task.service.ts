/**
 * Task Service
 *
 * 任務管理服務（Shared 層）
 * Task management service (Shared layer)
 *
 * Provides business logic for task operations.
 *
 * @module shared/services/task
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  TaskRepository,
  Task,
  TaskStatus,
  TaskPriority
} from '@core';

import {
  TaskBusinessModel,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
  TaskKanbanColumn,
  TaskStatistics
} from '../../models/task';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly taskRepo = inject(TaskRepository);

  // State
  private tasksState = signal<TaskBusinessModel[]>([]);
  private currentBlueprintIdState = signal<string | null>(null);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);
  private filtersState = signal<TaskFilters>({});

  // Readonly signals
  readonly tasks = this.tasksState.asReadonly();
  readonly currentBlueprintId = this.currentBlueprintIdState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly filters = this.filtersState.asReadonly();

  // Computed signals

  /**
   * 過濾後的任務列表
   * Filtered tasks
   */
  readonly filteredTasks = computed(() => {
    const tasks = this.tasks();
    const filters = this.filters();

    return tasks.filter(task => {
      // Status filter
      if (filters.status?.length && !filters.status.includes(task.status)) {
        return false;
      }

      // Priority filter
      if (filters.priority?.length && !filters.priority.includes(task.priority)) {
        return false;
      }

      // Assignee filter
      if (filters.assigneeId && task.assignee_id !== filters.assigneeId) {
        return false;
      }

      // Parent filter
      if (filters.parentId !== undefined) {
        if (filters.parentId === null && task.parent_id !== null) {
          return false;
        }
        if (filters.parentId && task.parent_id !== filters.parentId) {
          return false;
        }
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !task.title.toLowerCase().includes(searchLower) &&
          !(task.description?.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }

      return true;
    });
  });

  /**
   * 根任務（無父任務）
   * Root tasks (no parent)
   */
  readonly rootTasks = computed(() => {
    return this.filteredTasks().filter(task => !task.parent_id);
  });

  /**
   * 看板列配置
   * Kanban columns
   */
  readonly kanbanColumns = computed<TaskKanbanColumn[]>(() => {
    const tasks = this.filteredTasks();

    return [
      {
        id: TaskStatus.PENDING,
        title: '待處理',
        color: '#faad14',
        tasks: tasks.filter(t => t.status === TaskStatus.PENDING)
      },
      {
        id: TaskStatus.IN_PROGRESS,
        title: '進行中',
        color: '#1890ff',
        tasks: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS)
      },
      {
        id: TaskStatus.IN_REVIEW,
        title: '審核中',
        color: '#722ed1',
        tasks: tasks.filter(t => t.status === TaskStatus.IN_REVIEW)
      },
      {
        id: TaskStatus.COMPLETED,
        title: '已完成',
        color: '#52c41a',
        tasks: tasks.filter(t => t.status === TaskStatus.COMPLETED)
      },
      {
        id: TaskStatus.BLOCKED,
        title: '已阻擋',
        color: '#f5222d',
        tasks: tasks.filter(t => t.status === TaskStatus.BLOCKED)
      }
    ];
  });

  /**
   * 任務統計
   * Task statistics
   */
  readonly statistics = computed<TaskStatistics>(() => {
    const tasks = this.tasks();
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const inReview = tasks.filter(t => t.status === TaskStatus.IN_REVIEW).length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const cancelled = tasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    const blocked = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;

    return {
      total,
      pending,
      inProgress,
      inReview,
      completed,
      cancelled,
      blocked,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  // === Public Methods ===

  /**
   * 載入藍圖的所有任務
   * Load all tasks for a blueprint
   */
  async loadTasks(blueprintId: string): Promise<TaskBusinessModel[]> {
    if (!blueprintId) {
      this.errorState.set('Blueprint ID is required');
      return [];
    }

    this.loadingState.set(true);
    this.errorState.set(null);
    this.currentBlueprintIdState.set(blueprintId);

    try {
      const tasks = await firstValueFrom(this.taskRepo.findByBlueprint(blueprintId));
      this.tasksState.set(tasks as TaskBusinessModel[]);
      console.log('[TaskService] Tasks loaded:', tasks.length);
      return tasks as TaskBusinessModel[];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load tasks';
      this.errorState.set(message);
      console.error('[TaskService] Load failed:', error);
      return [];
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 根據 ID 查詢任務
   * Find task by ID
   */
  async findById(id: string): Promise<TaskBusinessModel | null> {
    const task = await firstValueFrom(this.taskRepo.findById(id));
    return task as TaskBusinessModel | null;
  }

  /**
   * 創建任務
   * Create task
   */
  async createTask(request: CreateTaskRequest): Promise<TaskBusinessModel | null> {
    const taskData: Partial<Task> = {
      blueprint_id: request.blueprintId,
      title: request.title,
      description: request.description || null,
      parent_id: request.parentId || null,
      status: request.status || TaskStatus.PENDING,
      priority: request.priority || TaskPriority.MEDIUM,
      assignee_id: request.assigneeId || null,
      reviewer_id: request.reviewerId || null,
      due_date: request.dueDate || null,
      start_date: request.startDate || null,
      sort_order: request.sortOrder ?? 0
    };

    const task = await firstValueFrom(this.taskRepo.create(taskData));

    if (task) {
      // Update local state
      this.tasksState.update(tasks => [...tasks, task as TaskBusinessModel]);
      console.log('[TaskService] Task created:', task.title);
    }

    return task as TaskBusinessModel | null;
  }

  /**
   * 更新任務
   * Update task
   */
  async updateTask(id: string, request: UpdateTaskRequest): Promise<TaskBusinessModel | null> {
    const updates: Partial<Task> = {};

    if (request.title !== undefined) updates.title = request.title;
    if (request.description !== undefined) updates.description = request.description;
    if (request.parentId !== undefined) updates.parent_id = request.parentId;
    if (request.status !== undefined) updates.status = request.status;
    if (request.priority !== undefined) updates.priority = request.priority;
    if (request.assigneeId !== undefined) updates.assignee_id = request.assigneeId;
    if (request.reviewerId !== undefined) updates.reviewer_id = request.reviewerId;
    if (request.dueDate !== undefined) updates.due_date = request.dueDate;
    if (request.startDate !== undefined) updates.start_date = request.startDate;
    if (request.completionRate !== undefined) updates.completion_rate = request.completionRate;
    if (request.sortOrder !== undefined) updates.sort_order = request.sortOrder;

    const task = await firstValueFrom(this.taskRepo.update(id, updates));

    if (task) {
      // Update local state
      this.tasksState.update(tasks =>
        tasks.map(t => (t.id === id ? { ...t, ...task } as TaskBusinessModel : t))
      );
      console.log('[TaskService] Task updated:', task.title);
    }

    return task as TaskBusinessModel | null;
  }

  /**
   * 更新任務狀態
   * Update task status
   */
  async updateStatus(id: string, status: TaskStatus): Promise<TaskBusinessModel | null> {
    return this.updateTask(id, { status });
  }

  /**
   * 更新任務優先級
   * Update task priority
   */
  async updatePriority(id: string, priority: TaskPriority): Promise<TaskBusinessModel | null> {
    return this.updateTask(id, { priority });
  }

  /**
   * 軟刪除任務
   * Soft delete task
   */
  async deleteTask(id: string): Promise<TaskBusinessModel | null> {
    const task = await firstValueFrom(this.taskRepo.softDelete(id));

    if (task) {
      // Remove from local state
      this.tasksState.update(tasks => tasks.filter(t => t.id !== id));
      console.log('[TaskService] Task deleted:', task.title);
    }

    return task as TaskBusinessModel | null;
  }

  /**
   * 設置過濾器
   * Set filters
   */
  setFilters(filters: TaskFilters): void {
    this.filtersState.set(filters);
  }

  /**
   * 更新過濾器
   * Update filters
   */
  updateFilters(partial: Partial<TaskFilters>): void {
    this.filtersState.update(current => ({ ...current, ...partial }));
  }

  /**
   * 清除過濾器
   * Clear filters
   */
  clearFilters(): void {
    this.filtersState.set({});
  }

  /**
   * 重置狀態
   * Reset state
   */
  reset(): void {
    this.tasksState.set([]);
    this.currentBlueprintIdState.set(null);
    this.errorState.set(null);
    this.filtersState.set({});
    this.loadingState.set(false);
  }

  /**
   * 重新載入任務
   * Reload tasks
   */
  async reload(): Promise<TaskBusinessModel[]> {
    const blueprintId = this.currentBlueprintId();
    if (blueprintId) {
      return this.loadTasks(blueprintId);
    }
    return [];
  }

  /**
   * 取得子任務
   * Get child tasks
   */
  getChildTasks(parentId: string): TaskBusinessModel[] {
    return this.tasks().filter(t => t.parent_id === parentId);
  }
}

/**
 * Task Service
 *
 * Business logic for Task Module management
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * Uses Angular Signals for reactive state management
 * Tasks belong directly to blueprints (no workspace indirection)
 *
 * @module features/blueprint/data-access/services/task.service
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TaskModel, CreateTaskRequest, UpdateTaskRequest, TaskStatistics, TaskViewMode, TaskStatusEnum } from '../../domain';
import { TaskRepository } from '../repositories';

/**
 * Task Service
 *
 * Manages task state and business logic with Signals
 * Tasks are directly associated with blueprints
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly taskRepo = inject(TaskRepository);

  // State management with Signals
  private tasksState = signal<TaskModel[]>([]);
  private selectedTaskState = signal<TaskModel | null>(null);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);
  private viewModeState = signal<TaskViewMode>('tree');

  // Expose ReadonlySignal to components
  readonly tasks = this.tasksState.asReadonly();
  readonly selectedTask = this.selectedTaskState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly viewMode = this.viewModeState.asReadonly();

  // Computed signals for derived state
  readonly pendingTasks = computed(() => this.tasks().filter(t => t.status === TaskStatusEnum.PENDING));

  readonly inProgressTasks = computed(() => this.tasks().filter(t => t.status === TaskStatusEnum.IN_PROGRESS));

  readonly completedTasks = computed(() => this.tasks().filter(t => t.status === TaskStatusEnum.COMPLETED));

  readonly rootTasks = computed(() => this.tasks().filter(t => t.parentId === null));

  readonly statistics = computed<TaskStatistics>(() => {
    const tasks = this.tasks();
    const completedCount = tasks.filter(t => t.status === TaskStatusEnum.COMPLETED).length;
    const totalCompletionRate = tasks.reduce((sum, t) => sum + t.completionRate, 0);

    return {
      totalCount: tasks.length,
      pendingCount: tasks.filter(t => t.status === TaskStatusEnum.PENDING).length,
      inProgressCount: tasks.filter(t => t.status === TaskStatusEnum.IN_PROGRESS).length,
      inReviewCount: tasks.filter(t => t.status === TaskStatusEnum.IN_REVIEW).length,
      completedCount,
      cancelledCount: tasks.filter(t => t.status === TaskStatusEnum.CANCELLED).length,
      blockedCount: tasks.filter(t => t.status === TaskStatusEnum.BLOCKED).length,
      averageCompletionRate: tasks.length > 0 ? totalCompletionRate / tasks.length : 0
    };
  });

  /**
   * Load tasks by blueprint
   */
  async loadTasksByBlueprint(blueprintId: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const tasks = await firstValueFrom(this.taskRepo.findByBlueprint(blueprintId));
      this.tasksState.set(tasks);
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to load tasks');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<TaskModel> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const task = await firstValueFrom(this.taskRepo.findById(id));
      if (!task) {
        throw new Error('Task not found');
      }
      this.selectedTaskState.set(task);
      return task;
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to load task');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Create new task
   */
  async createTask(request: CreateTaskRequest): Promise<TaskModel> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const taskInsert = {
        blueprintId: request.blueprintId,
        parentId: request.parentId ?? null,
        title: request.title,
        description: request.description,
        status: 'pending' as const,
        priority: request.priority ?? 'medium',
        assigneeId: request.assigneeId,
        reviewerId: request.reviewerId,
        dueDate: request.dueDate,
        startDate: request.startDate,
        completionRate: 0,
        sortOrder: 0
      };

      const newTask = await firstValueFrom(this.taskRepo.create(taskInsert));

      // Update state
      this.tasksState.update(tasks => [...tasks, newTask]);

      return newTask;
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to create task');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Update task
   */
  async updateTask(id: string, request: UpdateTaskRequest): Promise<TaskModel> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const updatedTask = await firstValueFrom(this.taskRepo.update(id, request));

      // Update state
      this.tasksState.update(tasks => tasks.map(t => (t.id === id ? updatedTask : t)));

      if (this.selectedTask()?.id === id) {
        this.selectedTaskState.set(updatedTask);
      }

      return updatedTask;
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to update task');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      await firstValueFrom(this.taskRepo.delete(id));

      // Update state
      this.tasksState.update(tasks => tasks.filter(t => t.id !== id));

      if (this.selectedTask()?.id === id) {
        this.selectedTaskState.set(null);
      }
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to delete task');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Complete task
   */
  async completeTask(id: string): Promise<TaskModel> {
    return this.updateTask(id, { status: TaskStatusEnum.COMPLETED, completionRate: 100 });
  }

  /**
   * Cancel task
   */
  async cancelTask(id: string): Promise<TaskModel> {
    return this.updateTask(id, { status: TaskStatusEnum.CANCELLED });
  }

  /**
   * Set view mode (tree or table)
   */
  setViewMode(mode: TaskViewMode): void {
    this.viewModeState.set(mode);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorState.set(null);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedTaskState.set(null);
  }
}

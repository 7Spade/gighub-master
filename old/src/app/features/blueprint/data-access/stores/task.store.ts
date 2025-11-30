/**
 * Task Store
 *
 * State management store for Task feature
 * Acts as Facade layer providing unified API to components
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * Tasks belong directly to blueprints
 *
 * @module features/blueprint/data-access/stores/task.store
 */

import { Injectable, inject } from '@angular/core';

import { TaskModel, CreateTaskRequest, UpdateTaskRequest, TaskViewMode } from '../../domain';
import { TaskService } from '../services';

/**
 * Task Store (Facade)
 *
 * Provides unified API for Task Module
 */
@Injectable({ providedIn: 'root' })
export class TaskStore {
  private readonly taskService = inject(TaskService);

  // Expose Task Service state
  readonly tasks = this.taskService.tasks;
  readonly selectedTask = this.taskService.selectedTask;
  readonly loading = this.taskService.loading;
  readonly error = this.taskService.error;
  readonly viewMode = this.taskService.viewMode;
  readonly statistics = this.taskService.statistics;

  // Computed signals (shortcuts)
  readonly pendingTasks = this.taskService.pendingTasks;
  readonly inProgressTasks = this.taskService.inProgressTasks;
  readonly completedTasks = this.taskService.completedTasks;
  readonly rootTasks = this.taskService.rootTasks;

  /**
   * Load tasks for blueprint
   */
  async loadBlueprintTasks(blueprintId: string): Promise<void> {
    await this.taskService.loadTasksByBlueprint(blueprintId);
  }

  /**
   * Get task by ID
   */
  async getTask(id: string): Promise<TaskModel> {
    return this.taskService.getTaskById(id);
  }

  /**
   * Create new task
   */
  async createTask(request: CreateTaskRequest): Promise<TaskModel> {
    return this.taskService.createTask(request);
  }

  /**
   * Update task
   */
  async updateTask(id: string, request: UpdateTaskRequest): Promise<TaskModel> {
    return this.taskService.updateTask(id, request);
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<void> {
    return this.taskService.deleteTask(id);
  }

  /**
   * Complete task
   */
  async completeTask(id: string): Promise<TaskModel> {
    return this.taskService.completeTask(id);
  }

  /**
   * Cancel task
   */
  async cancelTask(id: string): Promise<TaskModel> {
    return this.taskService.cancelTask(id);
  }

  /**
   * Set view mode (tree or table)
   */
  setViewMode(mode: TaskViewMode): void {
    this.taskService.setViewMode(mode);
  }

  /**
   * Toggle view mode between tree and table
   */
  toggleViewMode(): void {
    const currentMode = this.viewMode();
    this.setViewMode(currentMode === 'tree' ? 'table' : 'tree');
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.taskService.clearError();
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.taskService.clearSelection();
  }
}

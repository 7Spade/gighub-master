/**
 * Todo Store
 *
 * State management store for Todo feature
 * Acts as Facade layer providing unified API to components
 * Following vertical slice architecture
 *
 * @module features/blueprint/data-access/stores/todo.store
 */

import { Injectable, inject } from '@angular/core';

import { TodoModel, CreateTodoRequest, UpdateTodoRequest, TodoStatus } from '../../domain';
import { TodoService } from '../services';

/**
 * Todo Store (Facade)
 *
 * Provides unified API for Todo module
 * Integrates with Workspace Context
 */
@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly todoService = inject(TodoService);

  // Expose Todo Service state
  readonly todos = this.todoService.todos;
  readonly selectedTodo = this.todoService.selectedTodo;
  readonly loading = this.todoService.loading;
  readonly error = this.todoService.error;
  readonly statistics = this.todoService.statistics;

  // Computed signals (shortcuts)
  readonly todoViewModels = this.todoService.todoViewModels;
  readonly openTodos = this.todoService.openTodos;
  readonly inProgressTodos = this.todoService.inProgressTodos;
  readonly doneTodos = this.todoService.doneTodos;
  readonly overdueTodos = this.todoService.overdueTodos;

  /**
   * Load todos by workspace
   */
  async loadWorkspaceTodos(workspaceId: string): Promise<void> {
    await this.todoService.loadTodosByWorkspace(workspaceId);
  }

  /**
   * Load todos by blueprint
   */
  async loadBlueprintTodos(blueprintId: string): Promise<void> {
    await this.todoService.loadTodosByBlueprint(blueprintId);
  }

  /**
   * Load todos by assignee
   */
  async loadMyTodos(assigneeId: string, status?: TodoStatus): Promise<void> {
    await this.todoService.loadTodosByAssignee(assigneeId, status);
  }

  /**
   * Get todo by ID
   */
  async getTodo(id: string): Promise<TodoModel> {
    return this.todoService.getTodoById(id);
  }

  /**
   * Create new todo
   */
  async createTodo(request: CreateTodoRequest, creatorId: string): Promise<TodoModel> {
    return this.todoService.createTodo(request, creatorId);
  }

  /**
   * Update todo
   */
  async updateTodo(id: string, request: UpdateTodoRequest): Promise<TodoModel> {
    return this.todoService.updateTodo(id, request);
  }

  /**
   * Change todo status
   */
  async changeStatus(id: string, status: TodoStatus): Promise<TodoModel> {
    return this.todoService.changeStatus(id, status);
  }

  /**
   * Mark todo as done
   */
  async markAsDone(id: string): Promise<TodoModel> {
    return this.todoService.markAsDone(id);
  }

  /**
   * Reopen todo
   */
  async reopenTodo(id: string): Promise<TodoModel> {
    return this.todoService.reopenTodo(id);
  }

  /**
   * Delete todo
   */
  async deleteTodo(id: string): Promise<void> {
    return this.todoService.deleteTodo(id);
  }

  /**
   * Select todo
   */
  selectTodo(todo: TodoModel | null): void {
    this.todoService.selectTodo(todo);
  }

  /**
   * Clear todo error
   */
  clearError(): void {
    this.todoService.clearError();
  }

  /**
   * Clear todo selection
   */
  clearSelection(): void {
    this.todoService.clearSelection();
  }
}

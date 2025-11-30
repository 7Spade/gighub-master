/**
 * Todo Service
 *
 * Business logic for Todo management
 * Following vertical slice architecture
 *
 * Uses Angular Signals for reactive state management
 *
 * @module features/blueprint/data-access/services/todo.service
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  TodoModel,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoStatistics,
  mapTodoToViewModel,
  calculateTodoStatistics,
  TodoViewModel,
  TodoStatus
} from '../../domain';
import { TodoRepository } from '../repositories';

/**
 * Todo Service
 *
 * Manages todo state and business logic with Signals
 */
@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly todoRepo = inject(TodoRepository);

  // State management with Signals
  private todosState = signal<TodoModel[]>([]);
  private selectedTodoState = signal<TodoModel | null>(null);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Expose ReadonlySignal to components
  readonly todos = this.todosState.asReadonly();
  readonly selectedTodo = this.selectedTodoState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // Computed signals for derived state
  readonly todoViewModels = computed<TodoViewModel[]>(() => this.todos().map(t => mapTodoToViewModel(t)));

  readonly statistics = computed<TodoStatistics>(() => calculateTodoStatistics(this.todos()));

  readonly openTodos = computed(() => this.todos().filter(t => t.status === 'open'));

  readonly inProgressTodos = computed(() => this.todos().filter(t => t.status === 'in_progress'));

  readonly doneTodos = computed(() => this.todos().filter(t => t.status === 'done'));

  readonly overdueTodos = computed(() => {
    const now = new Date();
    return this.todos().filter(t => t.dueAt && new Date(t.dueAt) < now && t.status !== 'done' && t.status !== 'cancelled');
  });

  /**
   * Load todos by workspace
   */
  async loadTodosByWorkspace(workspaceId: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const todos = await firstValueFrom(this.todoRepo.findByWorkspace(workspaceId));
      this.todosState.set(todos);
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to load todos');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Load todos by blueprint
   */
  async loadTodosByBlueprint(blueprintId: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const todos = await firstValueFrom(this.todoRepo.findByBlueprint(blueprintId));
      this.todosState.set(todos);
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to load todos');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Load todos by assignee
   */
  async loadTodosByAssignee(assigneeId: string, status?: TodoStatus): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const todos = await firstValueFrom(this.todoRepo.findByAssignee(assigneeId, status));
      this.todosState.set(todos);
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to load todos');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Get todo by ID
   */
  async getTodoById(id: string): Promise<TodoModel> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const todo = await firstValueFrom(this.todoRepo.findById(id));
      if (!todo) {
        throw new Error('Todo not found');
      }
      this.selectedTodoState.set(todo);
      return todo;
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to load todo');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Create new todo
   */
  async createTodo(request: CreateTodoRequest, creatorId: string): Promise<TodoModel> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      // Business validation
      if (!request.title || request.title.trim().length === 0) {
        throw new Error('Title is required');
      }

      const todoInsert = {
        ...request,
        status: 'open' as const,
        priority: request.priority || 'normal',
        tags: request.tags || [],
        creatorId
      };

      const newTodo = await firstValueFrom(this.todoRepo.create(todoInsert));

      // Update state
      this.todosState.update(todos => [newTodo, ...todos]);

      return newTodo;
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to create todo');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Update todo
   */
  async updateTodo(id: string, request: UpdateTodoRequest): Promise<TodoModel> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const updatedTodo = await firstValueFrom(this.todoRepo.update(id, request));

      // Update state
      this.todosState.update(todos => todos.map(t => (t.id === id ? updatedTodo : t)));

      if (this.selectedTodo()?.id === id) {
        this.selectedTodoState.set(updatedTodo);
      }

      return updatedTodo;
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to update todo');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Change todo status
   */
  async changeStatus(id: string, status: TodoStatus): Promise<TodoModel> {
    const updates: UpdateTodoRequest = { status };

    // Add completedAt when marking as done
    // Note: This would need to be handled in repository/database level

    return this.updateTodo(id, updates);
  }

  /**
   * Mark todo as done
   */
  async markAsDone(id: string): Promise<TodoModel> {
    return this.changeStatus(id, 'done');
  }

  /**
   * Reopen todo
   */
  async reopenTodo(id: string): Promise<TodoModel> {
    return this.changeStatus(id, 'open');
  }

  /**
   * Delete todo
   */
  async deleteTodo(id: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      await firstValueFrom(this.todoRepo.delete(id));

      // Update state
      this.todosState.update(todos => todos.filter(t => t.id !== id));

      if (this.selectedTodo()?.id === id) {
        this.selectedTodoState.set(null);
      }
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to delete todo');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Select todo
   */
  selectTodo(todo: TodoModel | null): void {
    this.selectedTodoState.set(todo);
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
    this.selectedTodoState.set(null);
  }
}

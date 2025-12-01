/**
 * Todo Store
 *
 * 待辦事項狀態管理（使用 Angular Signals）
 *
 * @module features/blueprint/data-access/stores
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../../domain';
import { TodoRepository } from '../repositories/todo.repository';

@Injectable({
  providedIn: 'root'
})
export class TodoStore {
  private readonly repository = inject(TodoRepository);

  // 私有狀態
  private readonly _todos = signal<Todo[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // 公開唯讀狀態
  readonly todos = this._todos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 計算屬性
  readonly todoCount = computed(() => this._todos().length);

  readonly pendingTodos = computed(() =>
    this._todos().filter(t => !t.is_completed)
  );

  readonly completedTodos = computed(() =>
    this._todos().filter(t => t.is_completed)
  );

  readonly pendingCount = computed(() => this.pendingTodos().length);

  readonly completionRate = computed(() => {
    const todos = this._todos();
    if (todos.length === 0) return 0;
    const completed = todos.filter(t => t.is_completed).length;
    return Math.round((completed / todos.length) * 100);
  });

  readonly overdueTodos = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this._todos().filter(
      t => !t.is_completed && t.due_date && t.due_date < today
    );
  });

  /**
   * 載入待辦事項
   */
  async loadTodos(blueprintId: string, accountId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const todos = await this.repository.findByBlueprintAndAccount(blueprintId, accountId);
      this._todos.set(todos);
    } catch (error) {
      this._error.set('載入待辦事項失敗');
      console.error('[TodoStore] loadTodos error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 建立待辦事項
   */
  async createTodo(request: CreateTodoRequest, accountId: string): Promise<Todo> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const todo = await this.repository.create(request, accountId);
      this._todos.update(todos => [...todos, todo]);
      return todo;
    } catch (error) {
      this._error.set('建立待辦事項失敗');
      console.error('[TodoStore] createTodo error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 更新待辦事項
   */
  async updateTodo(id: string, request: UpdateTodoRequest): Promise<Todo> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const todo = await this.repository.update(id, request);
      this._todos.update(todos =>
        todos.map(t => (t.id === id ? todo : t))
      );
      return todo;
    } catch (error) {
      this._error.set('更新待辦事項失敗');
      console.error('[TodoStore] updateTodo error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 切換完成狀態
   */
  async toggleComplete(id: string): Promise<Todo> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const todo = await this.repository.toggleComplete(id);
      this._todos.update(todos =>
        todos.map(t => (t.id === id ? todo : t))
      );
      return todo;
    } catch (error) {
      this._error.set('更新待辦事項失敗');
      console.error('[TodoStore] toggleComplete error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 刪除待辦事項
   */
  async deleteTodo(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.repository.softDelete(id);
      this._todos.update(todos => todos.filter(t => t.id !== id));
    } catch (error) {
      this._error.set('刪除待辦事項失敗');
      console.error('[TodoStore] deleteTodo error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._todos.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}

/**
 * Todo Repository
 *
 * 待辦事項資料存取層
 *
 * @module features/blueprint/data-access/repositories
 */

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core';
import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../../domain';

@Injectable({
  providedIn: 'root'
})
export class TodoRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE_NAME = 'todos';

  /**
   * 根據藍圖 ID 和用戶 ID 查詢待辦事項
   */
  async findByBlueprintAndAccount(blueprintId: string, accountId: string): Promise<Todo[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('blueprint_id', blueprintId)
      .eq('account_id', accountId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[TodoRepository] findByBlueprintAndAccount error:', error);
      throw error;
    }

    return (data || []) as Todo[];
  }

  /**
   * 根據 ID 查詢單一待辦
   */
  async findById(id: string): Promise<Todo | null> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[TodoRepository] findById error:', error);
      throw error;
    }

    return data as Todo;
  }

  /**
   * 查詢未完成的待辦事項
   */
  async findPending(blueprintId: string, accountId: string): Promise<Todo[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('blueprint_id', blueprintId)
      .eq('account_id', accountId)
      .eq('is_completed', false)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[TodoRepository] findPending error:', error);
      throw error;
    }

    return (data || []) as Todo[];
  }

  /**
   * 建立待辦事項
   */
  async create(request: CreateTodoRequest, accountId: string): Promise<Todo> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .insert({
        blueprint_id: request.blueprint_id,
        account_id: accountId,
        title: request.title,
        description: request.description ?? null,
        due_date: request.due_date ?? null,
        related_task_id: request.related_task_id ?? null
      })
      .select()
      .single();

    if (error) {
      console.error('[TodoRepository] create error:', error);
      throw error;
    }

    return data as Todo;
  }

  /**
   * 更新待辦事項
   */
  async update(id: string, request: UpdateTodoRequest): Promise<Todo> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .update({
        ...request,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TodoRepository] update error:', error);
      throw error;
    }

    return data as Todo;
  }

  /**
   * 切換完成狀態
   */
  async toggleComplete(id: string): Promise<Todo> {
    // 先查詢當前狀態
    const current = await this.findById(id);
    if (!current) {
      throw new Error('Todo not found');
    }

    return this.update(id, { is_completed: !current.is_completed });
  }

  /**
   * 軟刪除待辦事項
   */
  async softDelete(id: string): Promise<Todo> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TodoRepository] softDelete error:', error);
      throw error;
    }

    return data as Todo;
  }
}

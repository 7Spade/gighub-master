/**
 * Task Repository
 *
 * 任務資料存取層
 *
 * @module features/blueprint/data-access/repositories
 */

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilter } from '../../domain';
import { TaskStatus } from '../../domain/enums';

@Injectable({
  providedIn: 'root'
})
export class TaskRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE_NAME = 'tasks';

  /**
   * 根據藍圖 ID 查詢所有任務
   */
  async findByBlueprintId(blueprintId: string): Promise<Task[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[TaskRepository] findByBlueprintId error:', error);
      throw error;
    }

    return (data || []) as Task[];
  }

  /**
   * 根據 ID 查詢單一任務
   */
  async findById(id: string): Promise<Task | null> {
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
      console.error('[TaskRepository] findById error:', error);
      throw error;
    }

    return data as Task;
  }

  /**
   * 根據父任務 ID 查詢子任務
   */
  async findByParentId(parentId: string | null, blueprintId: string): Promise<Task[]> {
    let query = this.supabase.client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[TaskRepository] findByParentId error:', error);
      throw error;
    }

    return (data || []) as Task[];
  }

  /**
   * 根據篩選條件查詢任務
   */
  async findByFilter(blueprintId: string, filter: TaskFilter): Promise<Task[]> {
    let query = this.supabase.client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null);

    if (filter.status && filter.status.length > 0) {
      query = query.in('status', filter.status);
    }

    if (filter.priority && filter.priority.length > 0) {
      query = query.in('priority', filter.priority);
    }

    if (filter.assignee_id) {
      query = query.eq('assignee_id', filter.assignee_id);
    }

    if (filter.due_date_from) {
      query = query.gte('due_date', filter.due_date_from);
    }

    if (filter.due_date_to) {
      query = query.lte('due_date', filter.due_date_to);
    }

    if (filter.search) {
      query = query.ilike('title', `%${filter.search}%`);
    }

    const { data, error } = await query.order('sort_order', { ascending: true });

    if (error) {
      console.error('[TaskRepository] findByFilter error:', error);
      throw error;
    }

    return (data || []) as Task[];
  }

  /**
   * 建立任務
   */
  async create(request: CreateTaskRequest): Promise<Task> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .insert({
        blueprint_id: request.blueprint_id,
        title: request.title,
        parent_id: request.parent_id ?? null,
        description: request.description ?? null,
        status: request.status ?? TaskStatus.PENDING,
        priority: request.priority ?? 'medium',
        assignee_id: request.assignee_id ?? null,
        reviewer_id: request.reviewer_id ?? null,
        due_date: request.due_date ?? null,
        start_date: request.start_date ?? null,
        completion_rate: request.completion_rate ?? 0,
        sort_order: request.sort_order ?? 0,
        metadata: request.metadata ?? {}
      })
      .select()
      .single();

    if (error) {
      console.error('[TaskRepository] create error:', error);
      throw error;
    }

    return data as Task;
  }

  /**
   * 更新任務
   */
  async update(id: string, request: UpdateTaskRequest): Promise<Task> {
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
      console.error('[TaskRepository] update error:', error);
      throw error;
    }

    return data as Task;
  }

  /**
   * 軟刪除任務
   */
  async softDelete(id: string): Promise<Task> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TaskRepository] softDelete error:', error);
      throw error;
    }

    return data as Task;
  }

  /**
   * 批量更新排序
   */
  async updateSortOrder(tasks: { id: string; sort_order: number }[]): Promise<void> {
    for (const task of tasks) {
      const { error } = await this.supabase.client
        .from(this.TABLE_NAME)
        .update({ sort_order: task.sort_order })
        .eq('id', task.id);

      if (error) {
        console.error('[TaskRepository] updateSortOrder error:', error);
        throw error;
      }
    }
  }
}

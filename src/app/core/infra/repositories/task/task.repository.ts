/**
 * Task Repository
 *
 * 任務資料存取層
 * Task data access layer
 *
 * Provides CRUD operations for the tasks table using Supabase client.
 *
 * @module core/infra/repositories/task
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { Task, TaskQueryOptions, TaskStatus, TaskPriority } from '../../types/task';

@Injectable({
  providedIn: 'root'
})
export class TaskRepository {
  private readonly supabase = inject(SupabaseService);

  /**
   * 根據 ID 查詢任務
   * Find task by ID
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
   * 根據藍圖 ID 查詢任務列表
   * Find tasks by blueprint ID
   */
  findByBlueprint(blueprintId: string): Observable<Task[]> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null)
        .order('sort_order')
        .order('created_at', { ascending: false })
    ).pipe(
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
   * 查詢根任務（無父任務）
   * Find root tasks (no parent)
   */
  findRootTasks(blueprintId: string): Observable<Task[]> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .is('parent_id', null)
        .is('deleted_at', null)
        .order('sort_order')
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] findRootTasks error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 查詢子任務
   * Find child tasks
   */
  findByParent(parentId: string): Observable<Task[]> {
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
          console.error('[TaskRepository] findByParent error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 根據指派人查詢任務
   * Find tasks by assignee
   */
  findByAssignee(assigneeId: string, blueprintId?: string): Observable<Task[]> {
    let query = this.supabase.client
      .from('tasks')
      .select('*')
      .eq('assignee_id', assigneeId)
      .is('deleted_at', null);

    if (blueprintId) {
      query = query.eq('blueprint_id', blueprintId);
    }

    return from(query.order('due_date').order('priority')).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] findByAssignee error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 根據狀態查詢任務
   * Find tasks by status
   */
  findByStatus(blueprintId: string, status: TaskStatus): Observable<Task[]> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .eq('status', status)
        .is('deleted_at', null)
        .order('sort_order')
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] findByStatus error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 根據查詢選項查詢任務
   * Find tasks with options
   */
  findWithOptions(options: TaskQueryOptions): Observable<Task[]> {
    let query = this.supabase.client.from('tasks').select('*');

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options.parentId !== undefined) {
      if (options.parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', options.parentId);
      }
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.priority) {
      query = query.eq('priority', options.priority);
    }

    if (options.assigneeId) {
      query = query.eq('assignee_id', options.assigneeId);
    }

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    query = query.order('sort_order').order('created_at', { ascending: false });

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] findWithOptions error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 創建任務
   * Create task
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
   * Update task
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
   * 更新任務狀態
   * Update task status
   */
  updateStatus(id: string, status: TaskStatus): Observable<Task | null> {
    return this.update(id, { status });
  }

  /**
   * 更新任務優先級
   * Update task priority
   */
  updatePriority(id: string, priority: TaskPriority): Observable<Task | null> {
    return this.update(id, { priority });
  }

  /**
   * 更新任務排序
   * Update task sort order
   */
  updateSortOrder(id: string, sortOrder: number): Observable<Task | null> {
    return this.update(id, { sort_order: sortOrder });
  }

  /**
   * 軟刪除任務
   * Soft delete task
   */
  softDelete(id: string): Observable<Task | null> {
    return from(
      this.supabase.client
        .from('tasks')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] softDelete error:', error);
          return null;
        }
        return data as Task;
      })
    );
  }

  /**
   * 恢復已刪除的任務
   * Restore deleted task
   */
  restore(id: string): Observable<Task | null> {
    return from(
      this.supabase.client
        .from('tasks')
        .update({
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[TaskRepository] restore error:', error);
          return null;
        }
        return data as Task;
      })
    );
  }

  /**
   * 批量更新排序
   * Batch update sort orders
   */
  batchUpdateSortOrder(updates: { id: string; sort_order: number }[]): Observable<boolean> {
    // Note: Supabase doesn't support batch updates natively
    // We'll use a transaction-like approach
    const promises = updates.map(({ id, sort_order }) =>
      this.supabase.client
        .from('tasks')
        .update({ sort_order, updated_at: new Date().toISOString() })
        .eq('id', id)
    );

    return from(Promise.all(promises)).pipe(
      map(results => results.every(({ error }) => !error))
    );
  }
}

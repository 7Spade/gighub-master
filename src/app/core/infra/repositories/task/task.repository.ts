/**
 * Task Repository
 *
 * 任務資料存取層
 * Task data access layer
 *
 * Provides CRUD operations for the tasks table using Supabase client.
 * Uses Angular 20 inject() function for modern dependency injection.
 *
 * @module core/infra/repositories/task
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { LoggerService } from '../../../logger';
import { Task, TaskQueryOptions, CreateTaskRequest, UpdateTaskRequest, TaskStatus, TaskPriority } from '../../types/task';

@Injectable({
  providedIn: 'root'
})
export class TaskRepository {
  // Angular 20: 使用 inject() 函數進行依賴注入
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // Query Methods (查詢方法)
  // ============================================================================

  /**
   * 根據 ID 查詢任務
   * Find task by ID
   */
  findById(id: string): Observable<Task | null> {
    return from(this.supabase.client.from('tasks').select('*').eq('id', id).is('deleted_at', null).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null; // Not found
          this.logger.error('[TaskRepository] findById error:', error);
          return null;
        }
        return data as Task;
      })
    );
  }

  /**
   * 根據藍圖 ID 查詢所有任務
   * Find all tasks by blueprint ID
   */
  findByBlueprint(blueprintId: string): Observable<Task[]> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TaskRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 查詢子任務
   * Find child tasks by parent ID
   */
  findChildren(parentId: string): Observable<Task[]> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('parent_id', parentId)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TaskRepository] findChildren error:', error);
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
  findRoots(blueprintId: string): Observable<Task[]> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .is('parent_id', null)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TaskRepository] findRoots error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 根據查詢選項查詢任務
   * Find tasks with query options
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
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    if (options.priority) {
      if (Array.isArray(options.priority)) {
        query = query.in('priority', options.priority);
      } else {
        query = query.eq('priority', options.priority);
      }
    }

    if (options.assigneeId) {
      query = query.eq('assignee_id', options.assigneeId);
    }

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    query = query.order('sort_order', { ascending: true });

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TaskRepository] findWithOptions error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 按狀態查詢任務
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
        .order('sort_order', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TaskRepository] findByStatus error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  /**
   * 按負責人查詢任務
   * Find tasks by assignee
   */
  findByAssignee(assigneeId: string): Observable<Task[]> {
    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('assignee_id', assigneeId)
        .is('deleted_at', null)
        .order('due_date', { ascending: true, nullsFirst: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TaskRepository] findByAssignee error:', error);
          return [];
        }
        return (data || []) as Task[];
      })
    );
  }

  // ============================================================================
  // CRUD Methods (增刪改查方法)
  // ============================================================================

  /**
   * 建立任務
   * Create a new task
   */
  create(request: CreateTaskRequest, createdBy: string): Observable<Task | null> {
    return from(
      this.supabase.client
        .from('tasks')
        .insert({
          blueprint_id: request.blueprint_id,
          parent_id: request.parent_id || null,
          title: request.title,
          description: request.description || null,
          status: request.status || TaskStatus.PENDING,
          priority: request.priority || TaskPriority.MEDIUM,
          assignee_id: request.assignee_id || null,
          reviewer_id: request.reviewer_id || null,
          due_date: request.due_date || null,
          start_date: request.start_date || null,
          completion_rate: 0,
          sort_order: 0, // Will be updated by getNextSortOrder
          created_by: createdBy
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TaskRepository] create error:', error);
          return null;
        }
        return data as Task;
      })
    );
  }

  /**
   * 更新任務
   * Update a task
   */
  update(id: string, updates: UpdateTaskRequest): Observable<Task | null> {
    return from(
      this.supabase.client
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TaskRepository] update error:', error);
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
   * 更新任務完成率
   * Update task completion rate
   */
  updateCompletionRate(id: string, completionRate: number): Observable<Task | null> {
    return this.update(id, { completion_rate: completionRate });
  }

  /**
   * 軟刪除任務
   * Soft delete a task
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
          this.logger.error('[TaskRepository] softDelete error:', error);
          return null;
        }
        return data as Task;
      })
    );
  }

  /**
   * 恢復已刪除的任務
   * Restore a deleted task
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
          this.logger.error('[TaskRepository] restore error:', error);
          return null;
        }
        return data as Task;
      })
    );
  }

  // ============================================================================
  // Helper Methods (輔助方法)
  // ============================================================================

  /**
   * 獲取下一個排序順序
   * Get next sort order for a task
   */
  getNextSortOrder(blueprintId: string, parentId: string | null): Observable<number> {
    let query = this.supabase.client
      .from('tasks')
      .select('sort_order')
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: false })
      .limit(1);

    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error || !data || data.length === 0) {
          return 1;
        }
        return (data[0].sort_order || 0) + 1;
      })
    );
  }

  /**
   * 批量更新排序順序
   * Batch update sort orders
   */
  updateSortOrders(updates: Array<{ id: string; sort_order: number }>): Observable<boolean> {
    // Use Promise.all for batch updates
    const updatePromises = updates.map(({ id, sort_order }) =>
      this.supabase.client.from('tasks').update({ sort_order, updated_at: new Date().toISOString() }).eq('id', id)
    );

    return from(Promise.all(updatePromises)).pipe(
      map(results => {
        const hasError = results.some(r => r.error);
        if (hasError) {
          this.logger.error(
            '[TaskRepository] updateSortOrders error:',
            results.filter(r => r.error)
          );
          return false;
        }
        return true;
      })
    );
  }

  /**
   * 計算子任務數量
   * Count child tasks
   */
  countChildren(parentId: string): Observable<number> {
    return from(
      this.supabase.client.from('tasks').select('id', { count: 'exact', head: true }).eq('parent_id', parentId).is('deleted_at', null)
    ).pipe(
      map(({ count, error }) => {
        if (error) {
          this.logger.error('[TaskRepository] countChildren error:', error);
          return 0;
        }
        return count || 0;
      })
    );
  }

  /**
   * 計算藍圖的任務總數
   * Count total tasks in blueprint
   */
  countByBlueprint(blueprintId: string): Observable<number> {
    return from(
      this.supabase.client.from('tasks').select('id', { count: 'exact', head: true }).eq('blueprint_id', blueprintId).is('deleted_at', null)
    ).pipe(
      map(({ count, error }) => {
        if (error) {
          this.logger.error('[TaskRepository] countByBlueprint error:', error);
          return 0;
        }
        return count || 0;
      })
    );
  }
}

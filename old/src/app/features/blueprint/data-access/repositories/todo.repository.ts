/**
 * Todo Repository
 *
 * Repository for Todo data access layer
 * Following vertical slice architecture
 *
 * @module features/blueprint/data-access/repositories/todo.repository
 */

import { Injectable } from '@angular/core';
import { BaseRepository, QueryOptions } from '@core';
import { Observable } from 'rxjs';

import { Todo, TodoInsert, TodoUpdate, TodoStatus } from '../../domain';

/**
 * Todo Repository
 *
 * Handles data access for todos with automatic camelCase conversion
 */
@Injectable({ providedIn: 'root' })
export class TodoRepository extends BaseRepository<Todo, TodoInsert, TodoUpdate> {
  protected tableName = 'todos';

  /**
   * Find todos by workspace
   *
   * @param {string} workspaceId - Workspace ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Todo[]>} Array of todos
   */
  findByWorkspace(workspaceId: string, options?: QueryOptions): Observable<Todo[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        workspaceId
      },
      order: { column: 'created_at', ascending: false }
    });
  }

  /**
   * Find todos by blueprint
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Todo[]>} Array of todos
   */
  findByBlueprint(blueprintId: string, options?: QueryOptions): Observable<Todo[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        blueprintId
      },
      order: { column: 'priority', ascending: false }
    });
  }

  /**
   * Find todos by assignee
   *
   * @param {string} assigneeId - Assignee ID
   * @param {TodoStatus} [status] - Optional status filter
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Todo[]>} Array of todos
   */
  findByAssignee(assigneeId: string, status?: TodoStatus, options?: QueryOptions): Observable<Todo[]> {
    const filters: Record<string, unknown> = { assigneeId };
    if (status) {
      filters['status'] = status;
    }

    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        ...filters
      },
      order: { column: 'due_at', ascending: true }
    });
  }

  /**
   * Find todos by creator
   *
   * @param {string} creatorId - Creator ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Todo[]>} Array of todos
   */
  findByCreator(creatorId: string, options?: QueryOptions): Observable<Todo[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        creatorId
      },
      order: { column: 'created_at', ascending: false }
    });
  }

  /**
   * Find todos by status
   *
   * @param {string} workspaceId - Workspace ID
   * @param {TodoStatus} status - Todo status
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Todo[]>} Array of todos
   */
  findByStatus(workspaceId: string, status: TodoStatus, options?: QueryOptions): Observable<Todo[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        workspaceId,
        status
      }
    });
  }

  /**
   * Find todos linked to diary
   *
   * @param {string} diaryId - Diary ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Todo[]>} Array of todos
   */
  findByLinkedDiary(diaryId: string, options?: QueryOptions): Observable<Todo[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        linkedDiaryId: diaryId
      }
    });
  }

  /**
   * Batch update status
   *
   * @param {string[]} ids - Todo IDs
   * @param {TodoStatus} status - New status
   * @returns {Observable<Todo[]>} Updated todos
   */
  batchUpdateStatus(ids: string[], status: TodoStatus): Observable<Todo[]> {
    // Note: Batch update requires custom implementation
    // For now, this is a placeholder that would need Supabase RPC or multiple calls
    return this.updateBy({ id: ids }, { status } as TodoUpdate);
  }
}

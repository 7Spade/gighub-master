/**
 * Task Repository
 *
 * Repository for Task data access layer
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * Tasks belong directly to blueprints (blueprint_id)
 *
 * @module features/blueprint/data-access/repositories/task.repository
 */

import { Injectable } from '@angular/core';
import { BaseRepository, QueryOptions } from '@core';
import { Observable } from 'rxjs';

import { Task, TaskInsert, TaskUpdate } from '../../domain';

/**
 * Task Repository
 *
 * Handles data access for tasks with tree structure support
 */
@Injectable({ providedIn: 'root' })
export class TaskRepository extends BaseRepository<Task, TaskInsert, TaskUpdate> {
  protected tableName = 'tasks';

  /**
   * Find tasks by blueprint
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Task[]>} Array of tasks ordered by sort_order
   */
  findByBlueprint(blueprintId: string, options?: QueryOptions): Observable<Task[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        blueprintId
      },
      order: {
        column: 'sortOrder',
        ascending: true
      }
    });
  }

  /**
   * Find tasks by parent
   *
   * @param {string} parentId - Parent task ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Task[]>} Array of child tasks
   */
  findByParent(parentId: string, options?: QueryOptions): Observable<Task[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        parentId
      },
      order: {
        column: 'sortOrder',
        ascending: true
      }
    });
  }

  /**
   * Find root tasks (tasks without parent)
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Task[]>} Array of root tasks
   */
  findRootTasks(blueprintId: string, options?: QueryOptions): Observable<Task[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        blueprintId,
        parentId: null
      },
      order: {
        column: 'sortOrder',
        ascending: true
      }
    });
  }

  /**
   * Find tasks by status
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {string} status - Task status
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Task[]>} Array of tasks with specified status
   */
  findByStatus(blueprintId: string, status: string, options?: QueryOptions): Observable<Task[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        blueprintId,
        status
      }
    });
  }

  /**
   * Find tasks by assignee
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {string} assigneeId - Assignee ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Task[]>} Array of assigned tasks
   */
  findByAssignee(blueprintId: string, assigneeId: string, options?: QueryOptions): Observable<Task[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        blueprintId,
        assigneeId
      }
    });
  }

  /**
   * Find tasks by reviewer
   *
   * @param {string} blueprintId - Blueprint ID
   * @param {string} reviewerId - Reviewer ID
   * @param {QueryOptions} [options] - Query options
   * @returns {Observable<Task[]>} Array of tasks for review
   */
  findByReviewer(blueprintId: string, reviewerId: string, options?: QueryOptions): Observable<Task[]> {
    return this.findAll({
      ...options,
      filters: {
        ...options?.filters,
        blueprintId,
        reviewerId
      }
    });
  }
}

/**
 * Task Models
 *
 * Business models for Task Module (任務模組)
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/domain/models/task.models
 */

import { Task, TaskStatus, TaskPriority } from '../types';

/**
 * Task Model (re-export from types with business context)
 */
export type TaskModel = Task;

/**
 * Task summary for list display
 */
export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  completionRate: number;
  assigneeId?: string;
  reviewerId?: string;
  dueDate?: Date;
}

/**
 * Task creation request
 */
export interface CreateTaskRequest {
  blueprintId: string;
  parentId?: string | null;
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  reviewerId?: string;
  dueDate?: Date;
  startDate?: Date;
}

/**
 * Task update request
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  reviewerId?: string;
  dueDate?: Date;
  startDate?: Date;
  completionRate?: number;
  sortOrder?: number;
}

/**
 * Task move request (change parent or position)
 */
export interface MoveTaskRequest {
  taskId: string;
  newParentId?: string | null;
  newSortOrder: number;
}

/**
 * Task statistics for blueprint
 */
export interface TaskStatistics {
  totalCount: number;
  pendingCount: number;
  inProgressCount: number;
  inReviewCount: number;
  completedCount: number;
  cancelledCount: number;
  blockedCount: number;
  averageCompletionRate: number;
}

/**
 * Task filter options
 */
export interface TaskFilterOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  reviewerId?: string;
  searchTerm?: string;
}

/**
 * Task view mode
 */
export type TaskViewMode = 'tree' | 'table';

/**
 * Bulk task operation request
 */
export interface BulkTaskOperationRequest {
  taskIds: string[];
  operation: 'complete' | 'cancel' | 'delete' | 'assign';
  payload?: unknown;
}

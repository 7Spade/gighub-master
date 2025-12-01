/**
 * Task Interfaces
 *
 * Interface definitions for Task feature contracts
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/domain/interfaces/task.interfaces
 */

import { TaskStatusEnum, TaskPriorityEnum } from '../enums';

/**
 * Task filter options interface
 */
export interface ITaskFilterOptions {
  status?: TaskStatusEnum | TaskStatusEnum[];
  priority?: TaskPriorityEnum | TaskPriorityEnum[];
  assigneeId?: string;
  reviewerId?: string;
  blueprintId?: string;
  parentTaskId?: string;
  searchTerm?: string;
  dateFrom?: Date;
  dateTo?: Date;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  isOverdue?: boolean;
}

/**
 * Task sort options interface
 */
export interface ITaskSortOptions {
  field: 'title' | 'created_at' | 'updated_at' | 'due_date' | 'priority' | 'status' | 'sort_order';
  direction: 'asc' | 'desc';
}

/**
 * Task pagination options interface
 */
export interface ITaskPaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Task query options interface
 * Combines filter, sort, and pagination
 */
export interface ITaskQueryOptions {
  filter?: ITaskFilterOptions;
  sort?: ITaskSortOptions;
  pagination?: ITaskPaginationOptions;
}

/**
 * Task statistics interface
 */
export interface ITaskStatistics {
  total: number;
  byStatus: Record<TaskStatusEnum, number>;
  byPriority: Record<TaskPriorityEnum, number>;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completedThisWeek: number;
}

/**
 * Task validation result interface
 */
export interface ITaskValidationResult {
  isValid: boolean;
  errors: ITaskValidationError[];
  warnings: ITaskValidationWarning[];
}

/**
 * Task validation error interface
 */
export interface ITaskValidationError {
  field: string;
  code: string;
  message: string;
}

/**
 * Task validation warning interface
 */
export interface ITaskValidationWarning {
  field: string;
  code: string;
  message: string;
}

/**
 * Task assignment options interface
 */
export interface ITaskAssignmentOptions {
  assigneeId: string;
  notifyAssignee?: boolean;
  message?: string;
}

/**
 * Task bulk update options interface
 */
export interface ITaskBulkUpdateOptions {
  taskIds: string[];
  updates: {
    status?: TaskStatusEnum;
    priority?: TaskPriorityEnum;
    assigneeId?: string;
    reviewerId?: string;
    dueDate?: Date;
  };
}

/**
 * Task dependency interface
 */
export interface ITaskDependency {
  taskId: string;
  dependsOnTaskId: string;
  type: 'blocks' | 'blocked_by' | 'related';
}

/**
 * Task progress interface
 */
export interface ITaskProgress {
  taskId: string;
  completionRate: number;
  estimatedHours?: number;
  actualHours?: number;
  remainingHours?: number;
}

/**
 * Task time tracking interface
 */
export interface ITaskTimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description?: string;
}

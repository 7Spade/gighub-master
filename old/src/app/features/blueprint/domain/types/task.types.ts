/**
 * Task Types
 *
 * Type definitions for Task Module (任務模組)
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/domain/types/task.types
 */

/**
 * Task status (matches database enum)
 */
export type TaskStatus =
  | 'pending' // 待處理
  | 'in_progress' // 進行中
  | 'in_review' // 審核中
  | 'completed' // 已完成
  | 'cancelled' // 已取消
  | 'blocked'; // 已阻塞

/**
 * Task priority (matches database enum)
 */
export type TaskPriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';

/**
 * Task entity (matches database schema)
 */
export interface Task {
  // Identity
  id: string;
  blueprintId: string;

  // Tree structure
  parentId: string | null;

  // Basic info
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;

  // Assignment
  assigneeId?: string;
  reviewerId?: string;

  // Dates
  dueDate?: Date;
  startDate?: Date;

  // Progress
  completionRate: number; // 0-100

  // Ordering
  sortOrder: number;

  // Metadata (JSONB)
  metadata?: Record<string, unknown>;

  // Audit
  createdBy?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

/**
 * Task insert type (for creation)
 */
export interface TaskInsert {
  blueprintId: string;
  parentId?: string | null;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  reviewerId?: string;
  dueDate?: Date;
  startDate?: Date;
  completionRate?: number;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}

/**
 * Task update type (for modifications)
 */
export interface TaskUpdate {
  parentId?: string | null;
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
  metadata?: Record<string, unknown>;
}

/**
 * Task tree node for UI display
 */
export interface TaskTreeNode {
  key: string;
  title: string;
  isLeaf: boolean;
  expanded: boolean;
  children: TaskTreeNode[];
  task: Task;
  icon: string;
  disabled: boolean;
}

/**
 * Type guards
 */
export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && ['pending', 'in_progress', 'in_review', 'completed', 'cancelled', 'blocked'].includes(value);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && ['lowest', 'low', 'medium', 'high', 'highest'].includes(value);
}

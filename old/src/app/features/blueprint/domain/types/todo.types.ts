/**
 * Todo Types
 *
 * Type definitions for Todo Module (待辦事項模組)
 * Following vertical slice architecture and enterprise guidelines
 *
 * @module features/blueprint/domain/types/todo.types
 */

/**
 * Todo status
 */
export type TodoStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

/**
 * Todo priority
 */
export type TodoPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Todo comment
 */
export interface TodoComment {
  readonly id: string;
  readonly todoId: string;
  readonly content: string;
  readonly authorId: string;
  readonly authorName?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Todo attachment
 */
export interface TodoAttachment {
  readonly id: string;
  readonly todoId: string;
  readonly name: string;
  readonly url: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploadedAt: Date;
  readonly uploadedBy: string;
}

/**
 * Todo entity
 */
export interface Todo {
  readonly id: string;
  readonly workspaceId: string;
  readonly blueprintId?: string;

  // Basic info
  readonly title: string;
  readonly description?: string;
  readonly status: TodoStatus;
  readonly priority: TodoPriority;

  // Assignment
  readonly assigneeId?: string;
  readonly assigneeName?: string;
  readonly creatorId: string;
  readonly creatorName?: string;

  // Dates
  readonly dueAt?: Date;
  readonly completedAt?: Date;

  // Relations
  readonly linkedDiaryId?: string;
  readonly parentTodoId?: string;
  readonly tags: string[];

  // Denormalized counts
  readonly commentCount: number;
  readonly attachmentCount: number;

  // Timestamps
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Todo insert type (for creation)
 */
export interface TodoInsert {
  workspaceId: string;
  blueprintId?: string;
  title: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  assigneeId?: string;
  dueAt?: Date;
  linkedDiaryId?: string;
  parentTodoId?: string;
  tags?: string[];
  creatorId: string;
}

/**
 * Todo update type (for modifications)
 */
export interface TodoUpdate {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  assigneeId?: string;
  dueAt?: Date;
  linkedDiaryId?: string;
  tags?: string[];
}

/**
 * Todo view model for UI display
 */
export interface TodoViewModel {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly status: TodoStatus;
  readonly statusLabel: string;
  readonly statusColor: string;
  readonly priority: TodoPriority;
  readonly priorityLabel: string;
  readonly priorityColor: string;
  readonly assigneeName?: string;
  readonly dueAt?: Date;
  readonly formattedDueAt?: string;
  readonly isOverdue: boolean;
  readonly daysUntilDue?: number;
  readonly completedAt?: Date;
  readonly tags: string[];
  readonly commentCount: number;
  readonly attachmentCount: number;
  readonly createdAt: Date;
}

/**
 * Todo filter options
 */
export interface TodoFilterOptions {
  status?: TodoStatus;
  priority?: TodoPriority;
  assigneeId?: string;
  creatorId?: string;
  dueStartDate?: Date;
  dueEndDate?: Date;
  searchTerm?: string;
  includeCompleted?: boolean;
}

/**
 * Todo statistics
 */
export interface TodoStatistics {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  doneCount: number;
  cancelledCount: number;
  overdueCount: number;
}

/**
 * Type guards
 */
export function isTodoStatus(value: unknown): value is TodoStatus {
  return typeof value === 'string' && ['open', 'in_progress', 'done', 'cancelled'].includes(value);
}

export function isTodoPriority(value: unknown): value is TodoPriority {
  return typeof value === 'string' && ['low', 'normal', 'high', 'urgent'].includes(value);
}

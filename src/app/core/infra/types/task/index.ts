/**
 * Task Types Module
 * 任務類型定義模組
 *
 * Exports all task-related type definitions.
 * Types match PostgreSQL enums and table definitions in init.sql.
 *
 * @module core/infra/types/task
 */

// ============================================================================
// Task Enums (任務枚舉)
// ============================================================================

/**
 * 任務狀態枚舉
 * Task status enumeration
 *
 * Corresponds to database task_status enum
 */
export enum TaskStatus {
  /** 待處理 | Pending */
  PENDING = 'pending',
  /** 進行中 | In progress */
  IN_PROGRESS = 'in_progress',
  /** 審核中 | In review */
  IN_REVIEW = 'in_review',
  /** 已完成 | Completed */
  COMPLETED = 'completed',
  /** 已取消 | Cancelled */
  CANCELLED = 'cancelled',
  /** 已阻擋 | Blocked */
  BLOCKED = 'blocked'
}

/**
 * 任務優先級枚舉
 * Task priority enumeration
 *
 * Corresponds to database task_priority enum
 */
export enum TaskPriority {
  /** 最低 | Lowest */
  LOWEST = 'lowest',
  /** 低 | Low */
  LOW = 'low',
  /** 中 | Medium */
  MEDIUM = 'medium',
  /** 高 | High */
  HIGH = 'high',
  /** 最高 | Highest */
  HIGHEST = 'highest'
}

// ============================================================================
// Task Entity Interfaces (任務實體介面)
// ============================================================================

/**
 * Task entity interface
 * 任務實體介面
 *
 * Corresponds to database tasks table
 */
export interface Task {
  id: string;
  blueprint_id: string;
  parent_id?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string | null;
  reviewer_id?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  completion_rate?: number;
  sort_order: number;
  metadata?: Record<string, unknown>;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

/**
 * TaskAttachment entity interface
 * 任務附件實體介面
 *
 * Corresponds to database task_attachments table
 */
export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size?: number | null;
  mime_type?: string | null;
  uploaded_by?: string | null;
  created_at?: string;
}

// ============================================================================
// Task Query Options (任務查詢選項)
// ============================================================================

/**
 * 任務查詢選項
 * Task query options
 */
export interface TaskQueryOptions {
  /** 藍圖 ID | Blueprint ID */
  blueprintId?: string;
  /** 父任務 ID | Parent task ID */
  parentId?: string | null;
  /** 狀態過濾 | Filter by status */
  status?: TaskStatus;
  /** 優先級過濾 | Filter by priority */
  priority?: TaskPriority;
  /** 指派人過濾 | Filter by assignee */
  assigneeId?: string;
  /** 是否包含已刪除的任務 | Include deleted tasks */
  includeDeleted?: boolean;
}

// ============================================================================
// Type Aliases for Compatibility
// ============================================================================

export type TaskModel = Task;
export type TaskAttachmentModel = TaskAttachment;

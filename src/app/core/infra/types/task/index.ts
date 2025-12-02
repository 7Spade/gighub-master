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
  /** 已阻塞 | Blocked */
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
  parent_id: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string | null;
  reviewer_id?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  completion_rate: number;
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
// Task Tree Interfaces (任務樹狀結構介面)
// ============================================================================

/**
 * 巢狀任務介面 (用於原始資料結構)
 * Nested task interface (for raw data structure)
 */
export interface TaskNode extends Task {
  children?: TaskNode[];
  /** 層級 (計算得出) | Level (calculated) */
  level?: number;
  /** 是否為葉節點 | Is leaf node */
  isLeaf?: boolean;
  /** 子任務數量 | Children count */
  childCount?: number;
}

/**
 * 扁平化任務介面 (用於 tree-view 顯示)
 * Flattened task interface (for tree-view display)
 */
export interface FlatTaskNode {
  id: string;
  blueprint_id: string;
  parent_id: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  completion_rate: number;
  sort_order: number;
  /** 層級深度 | Level depth */
  level: number;
  /** 是否可展開 | Is expandable */
  expandable: boolean;
  /** 原始任務資料 | Original task data */
  origin: Task;
}

// ============================================================================
// Task Query Options (任務查詢選項)
// ============================================================================

/**
 * 任務查詢選項
 * Task query options
 */
export interface TaskQueryOptions {
  /** 按藍圖過濾 | Filter by blueprint */
  blueprintId?: string;
  /** 按父任務過濾 | Filter by parent */
  parentId?: string | null;
  /** 按狀態過濾 | Filter by status */
  status?: TaskStatus | TaskStatus[];
  /** 按優先級過濾 | Filter by priority */
  priority?: TaskPriority | TaskPriority[];
  /** 按負責人過濾 | Filter by assignee */
  assigneeId?: string;
  /** 是否包含已刪除的任務 | Include deleted tasks */
  includeDeleted?: boolean;
}

// ============================================================================
// Task Create/Update DTOs
// ============================================================================

/**
 * 建立任務請求
 * Create task request
 */
export interface CreateTaskRequest {
  blueprint_id: string;
  parent_id?: string | null;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  reviewer_id?: string | null;
  due_date?: string | null;
  start_date?: string | null;
}

/**
 * 更新任務請求
 * Update task request
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  reviewer_id?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  completion_rate?: number;
  sort_order?: number;
}

// ============================================================================
// Task View Types (任務視圖類型)
// ============================================================================

/**
 * 任務視圖類型
 * Task view type
 */
export enum TaskViewType {
  /** 樹狀視圖 | Tree view */
  TREE = 'tree',
  /** 表格視圖 | Table view */
  TABLE = 'table',
  /** 看板視圖 | Kanban view */
  KANBAN = 'kanban'
}

/**
 * 看板欄位配置
 * Kanban column configuration
 */
export interface KanbanColumn {
  status: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * 任務狀態顯示配置
 * Task status display configuration
 */
export interface TaskStatusConfig {
  label: string;
  color: string;
  icon: string;
}

/**
 * 任務優先級顯示配置
 * Task priority display configuration
 */
export interface TaskPriorityConfig {
  label: string;
  color: string;
  icon: string;
}

/**
 * 任務狀態配置映射
 * Task status configuration map
 */
export const TASK_STATUS_CONFIG: Record<TaskStatus, TaskStatusConfig> = {
  [TaskStatus.PENDING]: { label: '待處理', color: 'default', icon: 'clock-circle' },
  [TaskStatus.IN_PROGRESS]: { label: '進行中', color: 'processing', icon: 'sync' },
  [TaskStatus.IN_REVIEW]: { label: '審核中', color: 'warning', icon: 'eye' },
  [TaskStatus.COMPLETED]: { label: '已完成', color: 'success', icon: 'check-circle' },
  [TaskStatus.CANCELLED]: { label: '已取消', color: 'default', icon: 'close-circle' },
  [TaskStatus.BLOCKED]: { label: '已阻塞', color: 'error', icon: 'stop' }
};

/**
 * 任務優先級配置映射
 * Task priority configuration map
 */
export const TASK_PRIORITY_CONFIG: Record<TaskPriority, TaskPriorityConfig> = {
  [TaskPriority.LOWEST]: { label: '最低', color: 'default', icon: 'arrow-down' },
  [TaskPriority.LOW]: { label: '低', color: 'cyan', icon: 'arrow-down' },
  [TaskPriority.MEDIUM]: { label: '中', color: 'blue', icon: 'minus' },
  [TaskPriority.HIGH]: { label: '高', color: 'orange', icon: 'arrow-up' },
  [TaskPriority.HIGHEST]: { label: '最高', color: 'red', icon: 'arrow-up' }
};

// ============================================================================
// Type Aliases for Compatibility
// ============================================================================

export type TaskModel = Task;
export type TaskNodeModel = TaskNode;
export type FlatTaskNodeModel = FlatTaskNode;

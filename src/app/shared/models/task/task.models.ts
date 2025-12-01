/**
 * Task Business Models
 *
 * 任務業務模型定義（業務層）
 * Task business model definitions (Business Layer)
 *
 * @module shared/models/task
 */

import { Task, TaskStatus, TaskPriority } from '@core';

/**
 * Task entity type
 */
export type TaskModel = Task;

/**
 * 任務業務模型（業務層）
 * Task model (Business layer)
 */
export interface TaskBusinessModel extends Task {
  /** 指派人名稱 | Assignee name (optional, populated separately) */
  assigneeName?: string;
  /** 指派人頭像 | Assignee avatar (optional, populated separately) */
  assigneeAvatar?: string | null;
  /** 審核人名稱 | Reviewer name (optional, populated separately) */
  reviewerName?: string;
  /** 子任務數 | Child task count (optional, populated separately) */
  childCount?: number;
  /** 附件數 | Attachment count (optional, populated separately) */
  attachmentCount?: number;
}

/**
 * 創建任務請求
 * Create task request
 */
export interface CreateTaskRequest {
  blueprintId: string;
  title: string;
  description?: string;
  parentId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  reviewerId?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  sortOrder?: number;
}

/**
 * 更新任務請求
 * Update task request
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  parentId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  reviewerId?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  completionRate?: number;
  sortOrder?: number;
}

/**
 * 任務列表過濾器
 * Task list filters
 */
export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string;
  parentId?: string | null;
  search?: string;
}

/**
 * 任務看板列
 * Task kanban column
 */
export interface TaskKanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: TaskBusinessModel[];
}

/**
 * 任務統計
 * Task statistics
 */
export interface TaskStatistics {
  total: number;
  pending: number;
  inProgress: number;
  inReview: number;
  completed: number;
  cancelled: number;
  blocked: number;
  completionRate: number;
}

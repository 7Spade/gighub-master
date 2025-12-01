/**
 * Task Interface
 *
 * 任務領域介面
 *
 * @module features/blueprint/domain/interfaces
 */

import { TaskStatus, TaskPriority } from '../enums';

/**
 * Task - 任務實體
 */
export interface Task {
  id: string;
  blueprint_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  reviewer_id: string | null;
  due_date: string | null;
  start_date: string | null;
  completion_rate: number;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * TaskTreeNode - 任務樹節點（用於樹狀視圖）
 */
export interface TaskTreeNode extends Task {
  children: TaskTreeNode[];
  expanded?: boolean;
  level: number;
}

/**
 * CreateTaskRequest - 建立任務請求
 */
export interface CreateTaskRequest {
  blueprint_id: string;
  title: string;
  parent_id?: string | null;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string | null;
  reviewer_id?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  completion_rate?: number;
  sort_order?: number;
  metadata?: Record<string, unknown>;
}

/**
 * UpdateTaskRequest - 更新任務請求
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
  metadata?: Record<string, unknown>;
}

/**
 * TaskFilter - 任務篩選條件
 */
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
}

/**
 * Todo Models
 *
 * Business models for Todo module
 * Following vertical slice architecture
 *
 * @module features/blueprint/domain/models/todo.models
 */

import { Todo, TodoStatus, TodoPriority, TodoViewModel, TodoStatistics } from '../types';

/**
 * Todo Model (re-export from types with business context)
 */
export type TodoModel = Todo;

/**
 * Todo summary for list display
 */
export interface TodoSummary {
  id: string;
  title: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueAt?: Date;
  assigneeName?: string;
  isOverdue: boolean;
}

/**
 * Create todo request
 */
export interface CreateTodoRequest {
  workspaceId: string;
  blueprintId?: string;
  title: string;
  description?: string;
  priority?: TodoPriority;
  assigneeId?: string;
  dueAt?: Date;
  linkedDiaryId?: string;
  tags?: string[];
}

/**
 * Update todo request
 */
export interface UpdateTodoRequest {
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
 * Status configuration
 */
export const TODO_STATUS_CONFIG: Record<TodoStatus, { label: string; color: string }> = {
  open: { label: '待處理', color: 'blue' },
  in_progress: { label: '進行中', color: 'orange' },
  done: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'default' }
};

/**
 * Priority configuration
 */
export const TODO_PRIORITY_CONFIG: Record<TodoPriority, { label: string; color: string }> = {
  low: { label: '低', color: 'default' },
  normal: { label: '一般', color: 'blue' },
  high: { label: '高', color: 'orange' },
  urgent: { label: '緊急', color: 'red' }
};

/**
 * Todo view model mapper
 */
export function mapTodoToViewModel(todo: Todo): TodoViewModel {
  const statusConfig = TODO_STATUS_CONFIG[todo.status];
  const priorityConfig = TODO_PRIORITY_CONFIG[todo.priority];
  const now = new Date();
  const isOverdue = todo.dueAt && new Date(todo.dueAt) < now && todo.status !== 'done' && todo.status !== 'cancelled';
  const daysUntilDue = todo.dueAt ? Math.ceil((new Date(todo.dueAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    status: todo.status,
    statusLabel: statusConfig.label,
    statusColor: statusConfig.color,
    priority: todo.priority,
    priorityLabel: priorityConfig.label,
    priorityColor: priorityConfig.color,
    assigneeName: todo.assigneeName,
    dueAt: todo.dueAt,
    formattedDueAt: todo.dueAt ? formatDate(todo.dueAt) : undefined,
    isOverdue: isOverdue || false,
    daysUntilDue,
    completedAt: todo.completedAt,
    tags: todo.tags,
    commentCount: todo.commentCount,
    attachmentCount: todo.attachmentCount,
    createdAt: todo.createdAt
  };
}

/**
 * Calculate todo statistics
 */
export function calculateTodoStatistics(todos: Todo[]): TodoStatistics {
  const now = new Date();
  const overdue = todos.filter(t => t.dueAt && new Date(t.dueAt) < now && t.status !== 'done' && t.status !== 'cancelled');

  return {
    totalCount: todos.length,
    openCount: todos.filter(t => t.status === 'open').length,
    inProgressCount: todos.filter(t => t.status === 'in_progress').length,
    doneCount: todos.filter(t => t.status === 'done').length,
    cancelledCount: todos.filter(t => t.status === 'cancelled').length,
    overdueCount: overdue.length
  };
}

/**
 * Format date helper
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

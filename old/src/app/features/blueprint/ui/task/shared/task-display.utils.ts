/**
 * Task Display Utilities
 *
 * Utility functions for task display formatting
 * Shared between tree and table views
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/ui/task/shared/task-display.utils
 */

import { TaskStatus, TaskPriority } from '../../../domain';

/**
 * Status badge color mapping
 */
const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'default',
  in_progress: 'processing',
  in_review: 'warning',
  completed: 'success',
  cancelled: 'error',
  blocked: 'magenta'
};

/**
 * Status display text mapping (Traditional Chinese)
 */
const STATUS_TEXTS: Record<TaskStatus, string> = {
  pending: '待處理',
  in_progress: '進行中',
  in_review: '審核中',
  completed: '已完成',
  cancelled: '已取消',
  blocked: '已阻塞'
};

/**
 * Priority color mapping
 */
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  lowest: 'default',
  low: 'blue',
  medium: 'warning',
  high: 'orange',
  highest: 'error'
};

/**
 * Priority display text mapping
 */
const PRIORITY_TEXTS: Record<TaskPriority, string> = {
  lowest: '最低',
  low: '低',
  medium: '中',
  high: '高',
  highest: '最高'
};

/**
 * Get status badge color for ng-zorro badge
 */
export function getStatusColor(status: TaskStatus): string {
  return STATUS_COLORS[status] ?? 'default';
}

/**
 * Get status display text
 */
export function getStatusText(status: TaskStatus): string {
  return STATUS_TEXTS[status] ?? status;
}

/**
 * Get priority tag color
 */
export function getPriorityColor(priority: TaskPriority): string {
  return PRIORITY_COLORS[priority] ?? 'default';
}

/**
 * Get priority display text
 */
export function getPriorityText(priority: TaskPriority): string {
  return PRIORITY_TEXTS[priority] ?? priority;
}

/**
 * Format level display (L0, L1, L2, L3+)
 */
export function formatLevel(depth: number): string {
  return `L${depth}`;
}

/**
 * Get level tag color based on depth
 */
export function getLevelColor(depth: number): string {
  const colors = ['blue', 'cyan', 'green', 'orange', 'purple'];
  return colors[Math.min(depth, colors.length - 1)];
}

/**
 * Format progress display
 */
export function formatProgress(completed: number, total: number): string {
  if (total === 0) return '-';
  return `${completed} / ${total}`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Get progress bar status color
 */
export function getProgressStatus(progress: number): 'success' | 'normal' | 'exception' | 'active' {
  if (progress >= 100) return 'success';
  if (progress > 0) return 'active';
  return 'normal';
}

/**
 * Format assignee display
 * Returns initials for avatar display
 */
export function formatAssigneeInitials(assigneeId: string): string {
  return assigneeId.slice(0, 2).toUpperCase();
}

/**
 * Get tree node icon based on status and expandable state
 */
export function getNodeIcon(status: TaskStatus, expandable: boolean): string {
  if (status === 'completed') return 'check-circle';
  if (status === 'cancelled') return 'close-circle';
  if (status === 'in_progress') return 'loading';
  if (expandable) return 'folder';
  return 'file';
}

/**
 * Get icon theme based on status
 */
export function getIconTheme(status: TaskStatus): 'outline' | 'fill' | 'twotone' {
  return status === 'completed' || status === 'cancelled' ? 'fill' : 'outline';
}

/**
 * Task Status Enum
 *
 * 任務狀態枚舉
 *
 * @module features/blueprint/domain/enums
 */

export enum TaskStatus {
  /** 待處理 */
  PENDING = 'pending',
  /** 進行中 */
  IN_PROGRESS = 'in_progress',
  /** 審核中 */
  IN_REVIEW = 'in_review',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 已取消 */
  CANCELLED = 'cancelled',
  /** 已阻塞 */
  BLOCKED = 'blocked'
}

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: '待處理',
  [TaskStatus.IN_PROGRESS]: '進行中',
  [TaskStatus.IN_REVIEW]: '審核中',
  [TaskStatus.COMPLETED]: '已完成',
  [TaskStatus.CANCELLED]: '已取消',
  [TaskStatus.BLOCKED]: '已阻塞'
};

export const TaskStatusColors: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'default',
  [TaskStatus.IN_PROGRESS]: 'processing',
  [TaskStatus.IN_REVIEW]: 'warning',
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.CANCELLED]: 'error',
  [TaskStatus.BLOCKED]: 'error'
};

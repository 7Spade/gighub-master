/**
 * Task Priority Enum
 *
 * 任務優先級枚舉
 *
 * @module features/blueprint/domain/enums
 */

export enum TaskPriority {
  /** 最低 */
  LOWEST = 'lowest',
  /** 低 */
  LOW = 'low',
  /** 中 */
  MEDIUM = 'medium',
  /** 高 */
  HIGH = 'high',
  /** 最高 */
  HIGHEST = 'highest'
}

export const TaskPriorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOWEST]: '最低',
  [TaskPriority.LOW]: '低',
  [TaskPriority.MEDIUM]: '中',
  [TaskPriority.HIGH]: '高',
  [TaskPriority.HIGHEST]: '最高'
};

export const TaskPriorityColors: Record<TaskPriority, string> = {
  [TaskPriority.LOWEST]: '#bfbfbf',
  [TaskPriority.LOW]: '#52c41a',
  [TaskPriority.MEDIUM]: '#1890ff',
  [TaskPriority.HIGH]: '#fa8c16',
  [TaskPriority.HIGHEST]: '#f5222d'
};

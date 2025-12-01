/**
 * Task Constants
 *
 * Constants for Task business logic
 * Following enterprise development guidelines
 *
 * @module features/blueprint/constants/task.constants
 */

import { TaskStatusEnum, TaskPriorityEnum, TaskTypeEnum } from '../domain';

/**
 * Task default values
 */
export const TASK_DEFAULTS = {
  /** Default status for new tasks */
  STATUS: TaskStatusEnum.TODO,
  /** Default priority for new tasks */
  PRIORITY: TaskPriorityEnum.MEDIUM,
  /** Default type for new tasks */
  TYPE: TaskTypeEnum.TASK,
  /** Default page size for pagination */
  PAGE_SIZE: 50,
  /** Maximum name length */
  MAX_NAME_LENGTH: 200,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 2000,
  /** Maximum tags count */
  MAX_TAGS_COUNT: 20,
  /** Maximum tag length */
  MAX_TAG_LENGTH: 30,
  /** Maximum subtasks depth */
  MAX_SUBTASK_DEPTH: 3,
  /** Default estimated hours */
  DEFAULT_ESTIMATED_HOURS: 0
} as const;

/**
 * Task status display configuration
 */
export const TASK_STATUS_CONFIG = {
  [TaskStatusEnum.TODO]: {
    label: '待處理',
    color: 'default',
    icon: 'clock-circle',
    description: '任務尚未開始',
    sortOrder: 1
  },
  [TaskStatusEnum.IN_PROGRESS]: {
    label: '進行中',
    color: 'processing',
    icon: 'sync',
    description: '任務正在進行',
    sortOrder: 2
  },
  [TaskStatusEnum.IN_REVIEW]: {
    label: '審核中',
    color: 'warning',
    icon: 'eye',
    description: '任務正在審核',
    sortOrder: 3
  },
  [TaskStatusEnum.DONE]: {
    label: '已完成',
    color: 'success',
    icon: 'check-circle',
    description: '任務已完成',
    sortOrder: 4
  },
  [TaskStatusEnum.CANCELLED]: {
    label: '已取消',
    color: 'error',
    icon: 'close-circle',
    description: '任務已取消',
    sortOrder: 5
  }
} as const;

/**
 * Task priority display configuration
 */
export const TASK_PRIORITY_CONFIG = {
  [TaskPriorityEnum.LOWEST]: {
    label: '最低',
    color: 'default',
    icon: 'arrow-down',
    weight: 1
  },
  [TaskPriorityEnum.LOW]: {
    label: '低',
    color: 'cyan',
    icon: 'minus',
    weight: 2
  },
  [TaskPriorityEnum.MEDIUM]: {
    label: '中',
    color: 'blue',
    icon: 'line',
    weight: 3
  },
  [TaskPriorityEnum.HIGH]: {
    label: '高',
    color: 'orange',
    icon: 'arrow-up',
    weight: 4
  },
  [TaskPriorityEnum.HIGHEST]: {
    label: '最高',
    color: 'red',
    icon: 'double-right',
    weight: 5
  }
} as const;

/**
 * Task type display configuration
 */
export const TASK_TYPE_CONFIG = {
  [TaskTypeEnum.TASK]: {
    label: '任務',
    color: 'blue',
    icon: 'check-square'
  },
  [TaskTypeEnum.MILESTONE]: {
    label: '里程碑',
    color: 'gold',
    icon: 'flag'
  },
  [TaskTypeEnum.BUG]: {
    label: '錯誤',
    color: 'red',
    icon: 'bug'
  },
  [TaskTypeEnum.FEATURE]: {
    label: '功能',
    color: 'green',
    icon: 'bulb'
  },
  [TaskTypeEnum.IMPROVEMENT]: {
    label: '改進',
    color: 'purple',
    icon: 'rise'
  }
} as const;

/**
 * Task form validation rules
 */
export const TASK_VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 1,
    maxLength: TASK_DEFAULTS.MAX_NAME_LENGTH
  },
  description: {
    required: false,
    maxLength: TASK_DEFAULTS.MAX_DESCRIPTION_LENGTH
  },
  tags: {
    maxCount: TASK_DEFAULTS.MAX_TAGS_COUNT,
    maxLength: TASK_DEFAULTS.MAX_TAG_LENGTH
  },
  estimatedHours: {
    min: 0,
    max: 9999
  }
} as const;

/**
 * Task sort options for UI
 */
export const TASK_SORT_OPTIONS = [
  { label: '名稱', value: 'name' },
  { label: '建立時間', value: 'created_at' },
  { label: '更新時間', value: 'updated_at' },
  { label: '到期日', value: 'due_date' },
  { label: '優先級', value: 'priority' },
  { label: '狀態', value: 'status' },
  { label: '順序', value: 'order' }
] as const;

/**
 * Task Kanban column configuration
 */
export const TASK_KANBAN_COLUMNS = [
  { status: TaskStatusEnum.TODO, title: '待處理', limit: 0 },
  { status: TaskStatusEnum.IN_PROGRESS, title: '進行中', limit: 5 },
  { status: TaskStatusEnum.IN_REVIEW, title: '審核中', limit: 3 },
  { status: TaskStatusEnum.DONE, title: '已完成', limit: 0 }
] as const;

/**
 * Task due date warning thresholds (in days)
 */
export const TASK_DUE_DATE_THRESHOLDS = {
  /** Tasks due within this many days show warning */
  WARNING_DAYS: 3,
  /** Tasks due within this many days show danger */
  DANGER_DAYS: 1,
  /** Tasks overdue color */
  OVERDUE_COLOR: 'red'
} as const;

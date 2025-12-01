/**
 * Task Status Pipe
 *
 * Transform task status to display format
 * For showing localized status labels and colors
 *
 * @module features/blueprint/pipes/task-status.pipe
 */

import { Pipe, PipeTransform } from '@angular/core';

import { TASK_STATUS_CONFIG } from '../constants';
import { TaskStatusEnum } from '../domain';

/**
 * Status display format
 */
export type TaskStatusDisplayFormat = 'label' | 'color' | 'icon' | 'description' | 'sortOrder' | 'full';

/**
 * Task status display object
 */
export interface TaskStatusDisplay {
  label: string;
  color: string;
  icon: string;
  description: string;
  sortOrder: number;
}

/**
 * Pipe to transform task status to display format
 *
 * @example
 * ```html
 * <!-- Get label only -->
 * {{ task.status | taskStatus }}
 *
 * <!-- Get specific property -->
 * {{ task.status | taskStatus:'color' }}
 * {{ task.status | taskStatus:'icon' }}
 *
 * <!-- Get full display object -->
 * {{ task.status | taskStatus:'full' }}
 * ```
 */
@Pipe({
  name: 'taskStatus',
  standalone: true,
  pure: true
})
export class TaskStatusPipe implements PipeTransform {
  transform(
    status: TaskStatusEnum | string | undefined | null,
    format: TaskStatusDisplayFormat = 'label'
  ): string | number | TaskStatusDisplay {
    if (!status) {
      return format === 'full' ? this.getDefaultDisplay() : '';
    }

    const config = TASK_STATUS_CONFIG[status as TaskStatusEnum];

    if (!config) {
      return format === 'full' ? this.getDefaultDisplay() : '';
    }

    switch (format) {
      case 'label':
        return config.label;
      case 'color':
        return config.color;
      case 'icon':
        return config.icon;
      case 'description':
        return config.description;
      case 'sortOrder':
        return config.sortOrder;
      case 'full':
        return {
          label: config.label,
          color: config.color,
          icon: config.icon,
          description: config.description,
          sortOrder: config.sortOrder
        };
      default:
        return config.label;
    }
  }

  private getDefaultDisplay(): TaskStatusDisplay {
    return {
      label: '未知',
      color: 'default',
      icon: 'question-circle',
      description: '未知狀態',
      sortOrder: 999
    };
  }
}

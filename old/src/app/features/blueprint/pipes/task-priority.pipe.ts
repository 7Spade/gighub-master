/**
 * Task Priority Pipe
 *
 * Transform task priority to display format
 * For showing localized priority labels and colors
 *
 * @module features/blueprint/pipes/task-priority.pipe
 */

import { Pipe, PipeTransform } from '@angular/core';

import { TASK_PRIORITY_CONFIG } from '../constants';
import { TaskPriorityEnum } from '../domain';

/**
 * Priority display format
 */
export type PriorityDisplayFormat = 'label' | 'color' | 'icon' | 'weight' | 'full';

/**
 * Priority display object
 */
export interface TaskPriorityDisplay {
  label: string;
  color: string;
  icon: string;
  weight: number;
}

/**
 * Pipe to transform task priority to display format
 *
 * @example
 * ```html
 * <!-- Get label only -->
 * {{ task.priority | taskPriority }}
 *
 * <!-- Get specific property -->
 * {{ task.priority | taskPriority:'color' }}
 * {{ task.priority | taskPriority:'icon' }}
 *
 * <!-- Get full display object -->
 * {{ task.priority | taskPriority:'full' }}
 * ```
 */
@Pipe({
  name: 'taskPriority',
  standalone: true,
  pure: true
})
export class TaskPriorityPipe implements PipeTransform {
  transform(
    priority: TaskPriorityEnum | string | undefined | null,
    format: PriorityDisplayFormat = 'label'
  ): string | number | TaskPriorityDisplay {
    if (!priority) {
      return format === 'full' ? this.getDefaultDisplay() : '';
    }

    const config = TASK_PRIORITY_CONFIG[priority as TaskPriorityEnum];

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
      case 'weight':
        return config.weight;
      case 'full':
        return {
          label: config.label,
          color: config.color,
          icon: config.icon,
          weight: config.weight
        };
      default:
        return config.label;
    }
  }

  private getDefaultDisplay(): TaskPriorityDisplay {
    return {
      label: '未知',
      color: 'default',
      icon: 'question',
      weight: 0
    };
  }
}

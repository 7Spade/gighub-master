/**
 * Blueprint Status Pipe
 *
 * Transform blueprint status to display format
 * For showing localized status labels and colors
 *
 * @module features/blueprint/pipes/blueprint-status.pipe
 */

import { Pipe, PipeTransform } from '@angular/core';

import { BLUEPRINT_STATUS_CONFIG } from '../constants';
import { BlueprintStatusEnum } from '../domain';

/**
 * Status display format
 */
export type StatusDisplayFormat = 'label' | 'color' | 'icon' | 'description' | 'full';

/**
 * Status display object
 */
export interface BlueprintStatusDisplay {
  label: string;
  color: string;
  icon: string;
  description: string;
}

/**
 * Pipe to transform blueprint status to display format
 *
 * @example
 * ```html
 * <!-- Get label only -->
 * {{ blueprint.status | blueprintStatus }}
 *
 * <!-- Get specific property -->
 * {{ blueprint.status | blueprintStatus:'color' }}
 * {{ blueprint.status | blueprintStatus:'icon' }}
 *
 * <!-- Get full display object -->
 * {{ blueprint.status | blueprintStatus:'full' }}
 * ```
 */
@Pipe({
  name: 'blueprintStatus',
  standalone: true,
  pure: true
})
export class BlueprintStatusPipe implements PipeTransform {
  transform(
    status: BlueprintStatusEnum | string | undefined | null,
    format: StatusDisplayFormat = 'label'
  ): string | BlueprintStatusDisplay {
    if (!status) {
      return format === 'full' ? this.getDefaultDisplay() : '';
    }

    const config = BLUEPRINT_STATUS_CONFIG[status as BlueprintStatusEnum];

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
      case 'full':
        return {
          label: config.label,
          color: config.color,
          icon: config.icon,
          description: config.description
        };
      default:
        return config.label;
    }
  }

  private getDefaultDisplay(): BlueprintStatusDisplay {
    return {
      label: '未知',
      color: 'default',
      icon: 'question-circle',
      description: '未知狀態'
    };
  }
}

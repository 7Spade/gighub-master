/**
 * Stat Card Component
 *
 * 統計卡片元件
 * Unified statistic card component for consistent UI
 *
 * Features:
 * - Icon with customizable color
 * - Title and value display
 * - Optional prefix and suffix
 * - Color variants
 *
 * @module shared/components/stat-card
 */

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';

export type StatCardColor = 'primary' | 'success' | 'warning' | 'error' | 'purple' | 'default';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NzCardModule, NzStatisticModule, NzIconModule],
  template: `
    <nz-card [nzBordered]="false" class="stat-card">
      <nz-statistic [nzTitle]="title()" [nzValue]="value()" [nzValueStyle]="valueStyle()" [nzPrefix]="prefixTpl" [nzSuffix]="suffix()">
      </nz-statistic>
      <ng-template #prefixTpl>
        @if (icon()) {
          <span nz-icon [nzType]="icon()!" nzTheme="outline"></span>
        }
        @if (prefix()) {
          {{ prefix() }}
        }
      </ng-template>
    </nz-card>
  `,
  styles: [
    `
      .stat-card {
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: 100px;
        text-align: center;

        ::ng-deep .ant-statistic-title {
          font-size: 14px;
          color: #666;
        }

        ::ng-deep .ant-statistic-content-value {
          font-size: 24px;
          font-weight: 600;
        }

        ::ng-deep .ant-statistic-content-prefix {
          margin-right: 4px;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatCardComponent {
  // Input signals
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<string>();
  readonly prefix = input<string>();
  readonly suffix = input<string>();
  readonly color = input<StatCardColor>('default');

  // Computed value style based on color
  valueStyle = () => {
    const colorMap: Record<StatCardColor, string> = {
      primary: '#1890ff',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      purple: '#722ed1',
      default: '#333'
    };
    return { color: colorMap[this.color()] };
  };
}

/**
 * Navigation Card Component
 *
 * 導航卡片元件
 * Unified navigation card component for quick access links
 *
 * Features:
 * - Icon with background color
 * - Title and description
 * - Optional count badge
 * - Arrow indicator
 * - Hover effects
 *
 * @module shared/components/nav-card
 */

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';

export type NavCardVariant =
  | 'primary'
  | 'success'
  | 'warning'
  | 'purple'
  | 'contracts'
  | 'expenses'
  | 'requests'
  | 'payments'
  | 'members'
  | 'tasks'
  | 'financial';

@Component({
  selector: 'app-nav-card',
  standalone: true,
  imports: [NzCardModule, NzIconModule],
  template: `
    <nz-card [nzBordered]="false" class="nav-card" [nzHoverable]="true" (click)="onClick()">
      <div class="nav-content">
        <div class="nav-icon" [class]="variant()">
          <span nz-icon [nzType]="icon()" nzTheme="outline"></span>
        </div>
        <div class="nav-info">
          <h4>{{ title() }}</h4>
          @if (description()) {
            <p>{{ description() }}</p>
          }
        </div>
        @if (showArrow()) {
          <span nz-icon nzType="right" class="nav-arrow"></span>
        }
      </div>
    </nz-card>
  `,
  styles: [
    `
      .nav-card {
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      }

      .nav-content {
        display: flex;
        gap: 16px;
        align-items: center;
      }

      .nav-icon {
        padding: 12px;
        border-radius: 8px;
        font-size: 32px;

        // Color variants
        &.primary,
        &.contracts,
        &.tasks {
          color: #1890ff;
          background: #e6f7ff;
        }

        &.warning,
        &.expenses,
        &.financial {
          color: #faad14;
          background: #fff7e6;
        }

        &.purple,
        &.requests {
          color: #722ed1;
          background: #f9f0ff;
        }

        &.success,
        &.payments,
        &.members {
          color: #52c41a;
          background: #f6ffed;
        }
      }

      .nav-info {
        flex: 1;

        h4 {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 600;
        }

        p {
          margin: 0;
          font-size: 13px;
          color: #666;
        }
      }

      .nav-arrow {
        font-size: 16px;
        color: #999;
        transition: all 0.3s ease;

        .nav-card:hover & {
          transform: translateX(4px);
          color: #1890ff;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavCardComponent {
  // Input signals
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly variant = input<NavCardVariant>('primary');
  readonly showArrow = input<boolean>(true);

  // Output signals
  readonly cardClick = output<void>();

  onClick(): void {
    this.cardClick.emit();
  }
}

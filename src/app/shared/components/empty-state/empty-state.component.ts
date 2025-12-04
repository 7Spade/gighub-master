/**
 * Empty State Component
 *
 * 空狀態元件
 * Unified empty state component for consistent UI
 *
 * Features:
 * - Customizable image/icon
 * - Title and description
 * - Optional action button
 *
 * @module shared/components/empty-state
 */

import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [NzEmptyModule, NzButtonModule, NzIconModule],
  template: `
    <nz-empty [nzNotFoundImage]="image()" [nzNotFoundContent]="title()">
      <ng-template #nzNotFoundFooter>
        @if (description()) {
          <p class="empty-description">{{ description() }}</p>
        }
        @if (showAction()) {
          <button nz-button [nzType]="actionType()" (click)="onAction()">
            @if (actionIcon()) {
              <span nz-icon [nzType]="actionIcon()!"></span>
            }
            {{ actionText() }}
          </button>
        }
      </ng-template>
    </nz-empty>
  `,
  styles: [
    `
      :host {
        display: block;
        padding: 32px 0;
      }

      .empty-description {
        margin-bottom: 16px;
        color: #999;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  // Input signals
  readonly title = input<string>('尚無資料');
  readonly description = input<string>();
  readonly image = input<'simple' | 'default' | string>('simple');
  readonly showAction = input<boolean>(false);
  readonly actionText = input<string>('新增');
  readonly actionIcon = input<string>('plus');
  readonly actionType = input<'primary' | 'default' | 'dashed' | 'text' | 'link'>('primary');

  // Output signals
  readonly actionClick = output<void>();

  onAction(): void {
    this.actionClick.emit();
  }
}

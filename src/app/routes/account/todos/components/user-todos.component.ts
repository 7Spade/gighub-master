/**
 * User Todos Component
 *
 * 個人待辦事項子組件
 * User todos sub-component
 *
 * @module routes/account/todos/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-todos',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="用戶 ID">{{ userId() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="待辦事項">開發中</nz-descriptions-item>
    </nz-descriptions>
    <!-- TODO: 實作個人待辦事項內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserTodosComponent {
  userId = input.required<string>();
}

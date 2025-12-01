/**
 * User Todos Component
 *
 * 個人待辦子組件
 * User todos sub-component
 *
 * @module routes/account/todos/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-todos-content',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="用戶 ID">{{ userId() }}</nz-descriptions-item>
    </nz-descriptions>
    <nz-divider></nz-divider>
    <p>管理個人待辦事項</p>
    <!-- TODO: 實作個人待辦內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserTodosContentComponent {
  userId = input.required<string>();
}

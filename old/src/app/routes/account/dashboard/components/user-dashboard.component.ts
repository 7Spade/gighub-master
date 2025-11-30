/**
 * User Dashboard Component
 *
 * 個人儀表板子組件
 * User dashboard sub-component
 *
 * @module routes/account/dashboard/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="用戶 ID">{{ userId() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="統計資訊">開發中</nz-descriptions-item>
    </nz-descriptions>
    <!-- TODO: 實作個人儀表板內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDashboardComponent {
  userId = input.required<string>();
}

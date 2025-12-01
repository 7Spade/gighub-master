/**
 * Team Dashboard Component
 *
 * 團隊儀表板子組件
 * Team dashboard sub-component
 *
 * @module routes/account/dashboard/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-team-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="團隊 ID">{{ teamId() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="統計資訊">開發中</nz-descriptions-item>
    </nz-descriptions>
    <!-- TODO: 實作團隊儀表板內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamDashboardComponent {
  teamId = input.required<string>();
}

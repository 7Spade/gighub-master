/**
 * Organization Dashboard Component
 *
 * 組織儀表板子組件
 * Organization dashboard sub-component
 *
 * @module routes/account/dashboard/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-organization-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="組織 ID">{{ organizationId() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="統計資訊">開發中</nz-descriptions-item>
    </nz-descriptions>
    <!-- TODO: 實作組織儀表板內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationDashboardComponent {
  organizationId = input.required<string>();
}

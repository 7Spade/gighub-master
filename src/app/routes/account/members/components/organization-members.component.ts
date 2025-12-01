/**
 * Organization Members Component
 *
 * 組織成員列表子組件
 * Organization members list sub-component
 *
 * @module routes/account/members/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-organization-members',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="組織 ID">{{ organizationId() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="成員列表">開發中</nz-descriptions-item>
    </nz-descriptions>
    <!-- TODO: 實作組織成員列表內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationMembersComponent {
  organizationId = input.required<string>();
}

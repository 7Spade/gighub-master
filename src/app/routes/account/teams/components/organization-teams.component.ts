/**
 * Organization Teams Component
 *
 * 組織團隊列表子組件
 * Organization teams list sub-component
 *
 * @module routes/account/teams/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-organization-teams',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="組織 ID">{{ organizationId() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="團隊列表">開發中</nz-descriptions-item>
    </nz-descriptions>
    <!-- TODO: 實作組織團隊列表內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationTeamsComponent {
  organizationId = input.required<string>();
}

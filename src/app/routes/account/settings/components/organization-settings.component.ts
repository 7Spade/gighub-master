/**
 * Organization Settings Component
 *
 * 組織設定子組件
 * Organization settings sub-component
 *
 * @module routes/account/settings/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="組織 ID">{{ organizationId() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="組織設定">開發中</nz-descriptions-item>
    </nz-descriptions>
    <!-- TODO: 實作組織設定內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationSettingsComponent {
  organizationId = input.required<string>();
}

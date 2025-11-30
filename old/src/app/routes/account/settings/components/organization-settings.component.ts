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
    <nz-tabset>
      <nz-tab nzTitle="基本資訊">
        <p class="text-grey">組織 ID: {{ organizationId() }}</p>
        <!-- TODO: 實作組織基本資訊設定 -->
      </nz-tab>
      <nz-tab nzTitle="成員管理">
        <!-- TODO: 實作成員管理 -->
      </nz-tab>
      <nz-tab nzTitle="權限設定">
        <!-- TODO: 實作權限設定 -->
      </nz-tab>
    </nz-tabset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationSettingsComponent {
  organizationId = input.required<string>();
}

/**
 * User Settings Component
 *
 * 個人設定子組件
 * User settings sub-component
 *
 * @module routes/account/settings/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-tabset>
      <nz-tab nzTitle="基本資訊">
        <p class="text-grey">用戶 ID: {{ userId() }}</p>
        <!-- TODO: 實作個人基本資訊設定 -->
      </nz-tab>
      <nz-tab nzTitle="偏好設定">
        <!-- TODO: 實作個人偏好設定 -->
      </nz-tab>
      <nz-tab nzTitle="安全性">
        <!-- TODO: 實作安全性設定 -->
      </nz-tab>
    </nz-tabset>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSettingsComponent {
  userId = input.required<string>();
}

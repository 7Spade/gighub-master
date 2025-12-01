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
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="用戶 ID">{{ userId() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="個人設定">開發中</nz-descriptions-item>
    </nz-descriptions>
    <!-- TODO: 實作個人設定內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserSettingsComponent {
  userId = input.required<string>();
}

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-org-settings',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header />
    <nz-card>
      <h2>組織設定</h2>
      <p>配置組織資訊與偏好設定</p>
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrgSettingsComponent {}

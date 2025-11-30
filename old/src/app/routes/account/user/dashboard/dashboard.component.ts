import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header />
    <nz-card>
      <h2>個人儀表板</h2>
      <p>個人概覽與統計資訊</p>
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDashboardComponent {}

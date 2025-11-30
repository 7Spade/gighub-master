import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-team-dashboard',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <page-header />
    <nz-card>
      <h2>團隊儀表板</h2>
      <p>團隊概覽與統計資訊</p>
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamDashboardComponent {}

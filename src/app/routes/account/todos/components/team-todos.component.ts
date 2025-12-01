/**
 * Team Todos Component
 *
 * 團隊待辦事項子組件
 * Team todos sub-component
 *
 * @module routes/account/todos/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-team-todos',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="團隊 ID">{{ teamId() }}</nz-descriptions-item>
      <nz-descriptions-item nzTitle="待辦事項">開發中</nz-descriptions-item>
    </nz-descriptions>
    <!-- TODO: 實作團隊待辦事項內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamTodosComponent {
  teamId = input.required<string>();
}

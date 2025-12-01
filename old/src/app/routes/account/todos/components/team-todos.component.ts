/**
 * Team Todos Component
 *
 * 團隊待辦子組件
 * Team todos sub-component
 *
 * @module routes/account/todos/components
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-team-todos-content',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <nz-descriptions nzBordered [nzColumn]="2">
      <nz-descriptions-item nzTitle="團隊 ID">{{ teamId() }}</nz-descriptions-item>
    </nz-descriptions>
    <nz-divider></nz-divider>
    <p>管理團隊待辦事項</p>
    <!-- TODO: 實作團隊待辦內容 -->
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamTodosContentComponent {
  teamId = input.required<string>();
}

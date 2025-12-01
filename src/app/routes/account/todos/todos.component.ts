/**
 * Todos Component
 *
 * 統一待辦事項組件 - 根據工作區上下文動態顯示內容
 * Unified todos component - dynamically displays content based on workspace context
 *
 * @module routes/account/todos
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContextType } from '@core';
import { SHARED_IMPORTS, BaseContextAwareComponent } from '@shared';

import { UserTodosComponent, TeamTodosComponent } from './components';

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [SHARED_IMPORTS, UserTodosComponent, TeamTodosComponent],
  template: `
    <page-header [title]="pageTitle()">
      <ng-template #extra>
        <nz-tag [nzColor]="contextTagColor()">
          <i nz-icon [nzType]="authContext.contextIcon()" class="mr-xs"></i>
          {{ authContext.contextLabel() }}
        </nz-tag>
      </ng-template>
    </page-header>

    <nz-card [nzTitle]="cardTitle()" class="mt-md">
      @if (authContext.switching()) {
        <div class="text-center py-lg">
          <nz-spin nzSimple [nzSize]="'large'"></nz-spin>
        </div>
      } @else if (!hasValidContext()) {
        <nz-empty nzNotFoundContent="請選擇一個工作區" [nzNotFoundFooter]="emptyFooter"></nz-empty>
        <ng-template #emptyFooter>
          <button nz-button nzType="primary" (click)="navigateToAccount()">
            <i nz-icon nzType="setting" nzTheme="outline"></i>
            前往帳戶管理
          </button>
        </ng-template>
      } @else {
        @switch (authContext.contextType()) {
          @case (ContextType.USER) {
            <app-user-todos [userId]="authContext.contextId()!" />
          }
          @case (ContextType.ORGANIZATION) {
            <nz-alert nzType="info" nzMessage="組織待辦" nzDescription="請選擇團隊查看待辦事項" nzShowIcon></nz-alert>
          }
          @case (ContextType.TEAM) {
            <app-team-todos [teamId]="authContext.contextId()!" />
          }
          @case (ContextType.BOT) {
            <nz-alert nzType="info" nzMessage="機器人待辦" nzDescription="機器人待辦功能正在開發中" nzShowIcon></nz-alert>
          }
        }
      }
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodosComponent extends BaseContextAwareComponent {
  protected readonly contextConfigs = {
    [ContextType.USER]: {
      title: '我的待辦',
      subtitle: '查看 {label} 的待辦事項',
      cardTitle: '個人待辦'
    },
    [ContextType.ORGANIZATION]: {
      title: '組織待辦',
      subtitle: '查看 {label} 的組織待辦',
      cardTitle: '組織待辦'
    },
    [ContextType.TEAM]: {
      title: '團隊待辦',
      subtitle: '查看 {label} 的團隊待辦',
      cardTitle: '團隊待辦'
    },
    [ContextType.BOT]: {
      title: '機器人待辦',
      subtitle: '查看 {label} 的機器人待辦',
      cardTitle: '機器人待辦'
    }
  };

  protected readonly defaultConfig = {
    title: '待辦事項',
    subtitle: '請選擇一個工作區以查看待辦事項',
    cardTitle: '待辦事項'
  };
}

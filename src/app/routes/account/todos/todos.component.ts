/**
 * Todos Component
 *
 * 統一待辦組件 - 根據工作區上下文動態顯示內容
 * Unified todos component - dynamically displays content based on workspace context
 *
 * @module routes/account/todos
 */

import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContextType } from '@core';
import { PageHeaderModule } from '@delon/abc/page-header';
import { BaseContextAwareComponent } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { UserTodosContentComponent, TeamTodosContentComponent } from './components';

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderModule,
    NzCardModule,
    NzSpinModule,
    NzEmptyModule,
    NzTagModule,
    NzButtonModule,
    NzIconModule,
    NzAlertModule,
    UserTodosContentComponent,
    TeamTodosContentComponent
  ],
  template: `
    <page-header [title]="pageTitle()">
      <ng-template #extra>
        <nz-tag [nzColor]="contextTagColor()">
          <span nz-icon [nzType]="authContext.contextIcon()" class="mr-xs"></span>
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
            <span nz-icon nzType="setting" nzTheme="outline"></span>
            前往帳戶管理
          </button>
        </ng-template>
      } @else {
        @switch (authContext.contextType()) {
          @case (ContextType.USER) {
            <app-user-todos-content [userId]="authContext.contextId()!" />
          }
          @case (ContextType.TEAM) {
            <app-team-todos-content [teamId]="authContext.contextId()!" />
          }
          @case (ContextType.ORGANIZATION) {
            <nz-alert
              nzType="info"
              nzMessage="組織待辦"
              nzDescription="組織層級不支援待辦功能，請切換到個人或團隊工作區"
              nzShowIcon
            ></nz-alert>
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
export class AccountTodosComponent extends BaseContextAwareComponent {
  protected readonly contextConfigs = {
    [ContextType.USER]: {
      title: '我的待辦',
      subtitle: '管理 {label} 的個人待辦事項',
      cardTitle: '個人待辦'
    },
    [ContextType.TEAM]: {
      title: '團隊待辦',
      subtitle: '管理 {label} 的團隊待辦事項',
      cardTitle: '團隊待辦'
    },
    [ContextType.ORGANIZATION]: {
      title: '組織待辦',
      subtitle: '組織層級不支援待辦功能',
      cardTitle: '組織待辦'
    },
    [ContextType.BOT]: {
      title: '機器人待辦',
      subtitle: '管理 {label} 的機器人待辦事項',
      cardTitle: '機器人待辦'
    }
  };

  protected readonly defaultConfig = {
    title: '待辦',
    subtitle: '請選擇一個工作區以查看待辦',
    cardTitle: '待辦'
  };
}

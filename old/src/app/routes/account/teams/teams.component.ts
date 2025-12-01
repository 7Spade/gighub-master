/**
 * Teams Component
 *
 * 統一團隊管理組件 - 根據工作區上下文動態顯示內容
 * Unified teams management component - dynamically displays content based on workspace context
 *
 * @module routes/account/teams
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ContextType } from '@core';
import { SHARED_IMPORTS, BaseContextAwareComponent } from '@shared';

import { OrganizationTeamsContentComponent } from './components';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [SHARED_IMPORTS, OrganizationTeamsContentComponent],
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
          @case (ContextType.ORGANIZATION) {
            <app-organization-teams-content [organizationId]="authContext.contextId()!" />
          }
          @case (ContextType.USER) {
            <nz-alert
              nzType="info"
              nzMessage="個人工作區"
              nzDescription="個人工作區不支援團隊管理，請切換到組織工作區"
              nzShowIcon
            ></nz-alert>
          }
          @case (ContextType.TEAM) {
            <nz-alert
              nzType="info"
              nzMessage="團隊工作區"
              nzDescription="您目前在團隊工作區中，請切換到組織工作區以管理團隊"
              nzShowIcon
            ></nz-alert>
          }
          @case (ContextType.BOT) {
            <nz-alert nzType="info" nzMessage="機器人工作區" nzDescription="機器人工作區不支援團隊管理" nzShowIcon></nz-alert>
          }
        }
      }
    </nz-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamsComponent extends BaseContextAwareComponent {
  protected readonly contextConfigs = {
    [ContextType.ORGANIZATION]: {
      title: '團隊管理',
      subtitle: '管理 {label} 的團隊',
      cardTitle: '組織團隊'
    },
    [ContextType.USER]: {
      title: '團隊管理',
      subtitle: '個人工作區不支援團隊管理',
      cardTitle: '無可用團隊'
    },
    [ContextType.TEAM]: {
      title: '團隊管理',
      subtitle: '請切換到組織工作區',
      cardTitle: '無可用團隊'
    },
    [ContextType.BOT]: {
      title: '團隊管理',
      subtitle: '機器人工作區不支援團隊管理',
      cardTitle: '無可用團隊'
    }
  };

  protected readonly defaultConfig = {
    title: '團隊管理',
    subtitle: '請選擇一個組織工作區以管理團隊',
    cardTitle: '團隊管理'
  };
}
